import logging
import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any

from backend.database import get_db
from backend.models import NewsArticle, Issue
from services.ai_service.news_crawler import news_crawler
from services.ai_service.providers.gemini_provider import GeminiProvider
from services.ai_service.vector_store import vector_store

logger = logging.getLogger("fimms.news")
router = APIRouter(prefix="/news", tags=["News API & AI News Triage"])

@router.get("")
def get_news(
    district: Optional[str] = "Madurai",
    limit: int = 10,
    db: Session = Depends(get_db)
):
    articles = db.query(NewsArticle).order_by(NewsArticle.published_at.desc()).limit(limit).all()
    if not articles:
        # Return fallback feed from crawler
        import asyncio
        loop = asyncio.get_event_loop()
        raw_feed = news_crawler.DEFAULT_DISTRICT_NEWS[:limit]
        return raw_feed
    return articles

@router.post("/triage-wire")
async def triage_news_wire(
    district: str = "Madurai",
    db: Session = Depends(get_db)
):
    """
    Crawls News API / District wire, runs RAG LLM deduplication pipeline,
    and identifies ONLY unique tasks to register as Collector issues,
    while attaching duplicate news coverage to existing issue clusters.
    """
    articles = await news_crawler.fetch_news(district=district, count=6)
    gemini = GeminiProvider()

    existing_issues = [
        {
            "id": i.id,
            "title": i.title,
            "description": i.description,
            "mandal_name": i.mandal_name,
            "category": i.category,
            "severity": i.severity,
            "status": i.status
        }
        for i in db.query(Issue).all()
    ]

    triage_results = []
    unique_tasks_created = 0
    duplicate_clusters_updated = 0

    for art in articles:
        candidate = {
            "title": art["title"],
            "description": art["description"],
            "mandal": art.get("mandal", "Madurai North"),
            "category": art.get("category", "Hostels"),
            "source_type": "news_api"
        }

        # Step 1 & 2: RAG embedding and LLM evaluation
        verdict = await gemini.deduplicate_and_extract_task(candidate, existing_issues)
        is_unique = verdict.get("is_unique", True)
        matched_id = verdict.get("matched_issue_id")
        task = verdict.get("extracted_task", {})

        if is_unique or not matched_id:
            # Look up exact GPS coordinates for the identified Taluk/Block
            m_name = art.get("mandal", "Madurai North")
            from backend.models import Mandal
            m_obj = db.query(Mandal).filter(Mandal.name == m_name).first()
            lat = m_obj.latitude if m_obj else 9.9252
            lng = m_obj.longitude if m_obj else 78.1198

            # Create new unique collector task!
            new_issue = Issue(
                title=task.get("title", art["title"]),
                description=task.get("description", art["description"]),
                category=task.get("category", art.get("category", "Hostels")),
                severity=task.get("severity", art.get("severity", "Non-critical")),
                status="Open",
                mandal_name=m_name,
                mandal_id=m_obj.id if m_obj else None,
                latitude=lat,
                longitude=lng,
                assigned_department=task.get("suggested_department", "Social Welfare"),
                source="news_api",
                is_unique=True,
                cluster_count=1,
                duplicate_evidence=[{"source": art.get("source", "News"), "url": art.get("url")}],
                ai_confidence=verdict.get("confidence", 0.95),
                ai_reasoning=f"Identified as UNIQUE district problem from news media. Recommended Action: {task.get('recommended_action')}"
            )
            db.add(new_issue)
            db.commit()
            db.refresh(new_issue)

            # Fast Vector Indexing
            text_str = f"{new_issue.title}. {new_issue.description}. Mandal: {new_issue.mandal_name}"
            emb = await gemini.get_embedding(text_str)
            vector_store.upsert_issue_embedding(new_issue.id, text_str, emb)

            unique_tasks_created += 1
            verdict["created_issue_id"] = new_issue.id
        else:
            # Duplicate cluster
            existing = db.query(Issue).filter(Issue.id == matched_id).first()
            if existing:
                existing.cluster_count += 1
                ev = list(existing.duplicate_evidence or [])
                ev.append({
                    "source": f"News: {art.get('source', 'Media')}",
                    "title": art["title"],
                    "url": art.get("url"),
                    "confidence": verdict.get("confidence", 0.94),
                    "timestamp": datetime.datetime.utcnow().isoformat()
                })
                existing.duplicate_evidence = ev
                db.commit()
                duplicate_clusters_updated += 1

        triage_results.append({
            "article": art,
            "verdict": verdict
        })

    return {
        "status": "success",
        "total_analyzed": len(articles),
        "unique_tasks_created": unique_tasks_created,
        "duplicate_clusters_updated": duplicate_clusters_updated,
        "results": triage_results
    }
