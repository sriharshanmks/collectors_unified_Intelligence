import os
import logging
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .providers.base import BaseLLMProvider
from .providers.gemini_provider import GeminiProvider
from .providers.bedrock_provider import BedrockProvider
from .vector_store import vector_store
from .news_crawler import news_crawler

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("fimms.ai.service")

app = FastAPI(
    title="FIMMS AI & RAG Deduplication Microservice",
    description="Independent AI Microservice with Google Gemini and AWS Bedrock RAG, fast pgvector indexing, and unique task identification.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Providers Registry
PROVIDERS: Dict[str, BaseLLMProvider] = {
    "gemini": GeminiProvider(),
    "bedrock": BedrockProvider()
}

# Default to Gemini as requested in user prompt!
DEFAULT_PROVIDER = os.getenv("LLM_PROVIDER", "gemini").lower()
active_provider_name: str = DEFAULT_PROVIDER if DEFAULT_PROVIDER in PROVIDERS else "gemini"

def get_active_provider() -> BaseLLMProvider:
    return PROVIDERS.get(active_provider_name, PROVIDERS["gemini"])

# Schemas
class TriageRequest(BaseModel):
    title: str
    description: str
    mandal: Optional[str] = "Bhongiri"
    category: Optional[str] = "Hostels"
    source_type: Optional[str] = "citizen_complaint" # 'citizen_complaint' or 'news_api'
    existing_issues: Optional[List[Dict[str, Any]]] = None

class RagQueryRequest(BaseModel):
    query: str
    top_k: Optional[int] = 5
    mandal_filter: Optional[str] = None
    context_issues: Optional[List[Dict[str, Any]]] = None

class ProviderSwitchRequest(BaseModel):
    provider: str # 'gemini' or 'bedrock'
    api_key: Optional[str] = None
    model_id: Optional[str] = None

@app.get("/health")
def health():
    prov = get_active_provider()
    return {
        "status": "healthy",
        "service": "ai_service",
        "active_provider": active_provider_name,
        "is_configured": prov.is_configured if hasattr(prov, "is_configured") else True,
        "port": 8002
    }

@app.get("/api/v1/ai/provider-status")
def get_provider_status():
    gemini = PROVIDERS["gemini"]
    bedrock = PROVIDERS["bedrock"]
    return {
        "active_provider": active_provider_name,
        "providers": {
            "gemini": {
                "name": "Google Gemini API",
                "model": getattr(gemini, "model", "gemini-1.5-flash"),
                "embedding_model": getattr(gemini, "embedding_model", "text-embedding-004"),
                "is_configured": getattr(gemini, "is_configured", False)
            },
            "bedrock": {
                "name": "AWS Bedrock",
                "model": getattr(bedrock, "model_id", "anthropic.claude-3-haiku-20240307-v1:0"),
                "region": getattr(bedrock, "region", "ap-south-1"),
                "is_configured": getattr(bedrock, "is_configured", False)
            }
        }
    }

@app.post("/api/v1/ai/switch-provider")
def switch_provider(req: ProviderSwitchRequest):
    global active_provider_name
    target = req.provider.lower().strip()
    if target not in ["gemini", "bedrock"]:
        raise HTTPException(status_code=400, detail="Provider must be either 'gemini' or 'bedrock'")
    
    if target == "gemini" and req.api_key:
        PROVIDERS["gemini"] = GeminiProvider(api_key=req.api_key)
    elif target == "bedrock" and req.model_id:
        PROVIDERS["bedrock"] = BedrockProvider(model_id=req.model_id)

    active_provider_name = target
    logger.info(f"Switched active RAG LLM Provider to: {active_provider_name}")
    return {
        "status": "success",
        "message": f"Active RAG LLM Provider changed to {active_provider_name}",
        "active_provider": active_provider_name
    }

@app.post("/api/v1/ai/triage")
async def triage_event(req: TriageRequest):
    """
    RAG Deduplication Pipeline:
    1. Embed text of complaint or news article.
    2. Retrieve top-k semantic matches from vector index.
    3. Pass candidate + retrieved matches to Gemini (or Bedrock) LLM.
    4. Return uniqueness verdict: brand new collector task vs duplicate cluster.
    """
    provider = get_active_provider()
    candidate_text = f"{req.title}. {req.description}"
    
    # Step 1: Generate Embedding Vector
    embedding = await provider.get_embedding(candidate_text)
    
    # Step 2: Vector Search in pgvector/in-memory store
    retrieved_matches = vector_store.search_similar(embedding, top_k=6)
    
    # If client passed existing issues, augment them
    existing_candidates = req.existing_issues or retrieved_matches
    
    # Step 3: LLM Deduplication & Unique Task Extraction
    verdict = await provider.deduplicate_and_extract_task(
        candidate={
            "title": req.title,
            "description": req.description,
            "mandal": req.mandal,
            "category": req.category,
            "source_type": req.source_type
        },
        existing_issues=existing_candidates
    )

    verdict["embedding"] = embedding
    verdict["provider_used"] = active_provider_name
    return verdict

@app.post("/api/v1/ai/process-news-feed")
async def process_news_feed(
    district: str = "Yadadri Bhuvanagiri",
    count: int = 5,
    existing_issues: Optional[List[Dict[str, Any]]] = None
):
    """
    Ingest latest district news and automatically deduplicate via RAG LLM into unique collector tasks.
    """
    articles = await news_crawler.fetch_news(district=district, count=count)
    provider = get_active_provider()
    
    results = []
    unique_count = 0
    duplicate_count = 0

    for art in articles:
        text = f"{art['title']}. {art['description']}"
        embedding = await provider.get_embedding(text)
        
        matches = vector_store.search_similar(embedding, top_k=5)
        pool = existing_issues or matches

        verdict = await provider.deduplicate_and_extract_task(
            candidate={
                "title": art["title"],
                "description": art["description"],
                "mandal": art.get("mandal", "Bhongiri"),
                "category": art.get("category", "Hostels"),
                "source_type": "news_api"
            },
            existing_issues=pool
        )
        
        verdict["news_article"] = art
        results.append(verdict)
        if verdict.get("is_unique"):
            unique_count += 1
        else:
            duplicate_count += 1

    return {
        "status": "completed",
        "provider": active_provider_name,
        "total_analyzed": len(articles),
        "unique_tasks_identified": unique_count,
        "duplicate_clusters_found": duplicate_count,
        "triaged_items": results
    }

@app.post("/api/v1/ai/rag-assistant")
async def rag_assistant(req: RagQueryRequest):
    """
    Strategic Executive RAG Assistant: answers queries using vector-indexed issues.
    """
    provider = get_active_provider()
    query_emb = await provider.get_embedding(req.query)
    
    docs = vector_store.search_similar(query_emb, top_k=req.top_k or 5)
    if req.context_issues:
        docs = req.context_issues[:8]

    answer = await provider.answer_rag_query(query=req.query, context_docs=docs)
    return {
        "query": req.query,
        "answer": answer,
        "provider": active_provider_name,
        "sources_count": len(docs),
        "sources": docs
    }

@app.post("/api/v1/ai/index-issue")
def index_issue(issue_id: int = Body(...), content: str = Body(...), embedding: List[float] = Body(...)):
    """Index an issue embedding into vector store."""
    vector_store.upsert_issue_embedding(issue_id, content, embedding)
    return {"status": "indexed", "issue_id": issue_id}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8002, reload=True)
