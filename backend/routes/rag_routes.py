import logging
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from pydantic import BaseModel

from backend.database import get_db
from backend.models import Issue, RagLog
from services.ai_service.main import get_active_provider, active_provider_name, switch_provider, ProviderSwitchRequest
from services.ai_service.vector_store import vector_store

logger = logging.getLogger("fimms.rag")
router = APIRouter(prefix="/rag", tags=["RAG Intelligence & LLM Switcher"])

class RagQueryInput(BaseModel):
    query: str
    mandal: Optional[str] = None
    category: Optional[str] = None

@router.get("/provider")
def get_current_provider():
    from services.ai_service.main import active_provider_name, PROVIDERS
    curr = PROVIDERS.get(active_provider_name)
    return {
        "active_provider": active_provider_name,
        "name": "Google Gemini API" if active_provider_name == "gemini" else "AWS Bedrock",
        "is_configured": getattr(curr, "is_configured", True)
    }

@router.post("/provider")
def switch_active_provider(req: ProviderSwitchRequest):
    return switch_provider(req)

@router.post("/query")
async def execute_rag_query(payload: RagQueryInput, db: Session = Depends(get_db)):
    """
    RAG Assistant query across all indexed district issues.
    """
    provider = get_active_provider()
    
    # 1. Fetch relevant issues from vector store
    q_emb = await provider.get_embedding(payload.query)
    matches = vector_store.search_similar(q_emb, top_k=6)

    # Enrich with DB fields if needed
    context_docs = []
    for m in matches:
        iss = db.query(Issue).filter(Issue.id == m["id"]).first()
        if iss:
            context_docs.append({
                "id": iss.id,
                "title": iss.title,
                "description": iss.description,
                "mandal_name": iss.mandal_name,
                "category": iss.category,
                "severity": iss.severity,
                "status": iss.status
            })
        else:
            context_docs.append(m)

    # 2. Invoke Gemini (or Bedrock)
    answer = await provider.answer_rag_query(query=payload.query, context_docs=context_docs)

    # 3. Log query
    try:
        log = RagLog(
            query=payload.query,
            response=answer,
            provider=active_provider_name,
            sources_count=len(context_docs)
        )
        db.add(log)
        db.commit()
    except Exception as e:
        logger.warning(f"RagLog save note: {e}")

    return {
        "query": payload.query,
        "answer": answer,
        "active_provider": active_provider_name,
        "sources_count": len(context_docs),
        "sources": context_docs
    }
