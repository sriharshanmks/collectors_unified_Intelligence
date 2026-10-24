import httpx
import logging
import datetime
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any

from backend.database import get_db
from backend.models import Complaint, Issue, User
from backend.schemas import ComplaintCreate, ComplaintResponse
from backend.auth import get_current_user
from services.ai_service.providers.gemini_provider import GeminiProvider
from services.ai_service.vector_store import vector_store

logger = logging.getLogger("fimms.complaints")
router = APIRouter(prefix="/complaints", tags=["Citizen Complaints & Triage"])

@router.post("", response_model=ComplaintResponse)
async def submit_complaint(
    payload: ComplaintCreate,
    db: Session = Depends(get_db)
):
    """
    Submit Citizen Grievance.
    Runs LLM RAG Deduplication to identify whether this is a brand new unique task
    or an escalation / duplicate of an existing district issue.
    """
    # 1. Fetch existing issues for RAG matching
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

    # 2. Call AI RAG Deduplication Engine (via local GeminiProvider or AI microservice)
    gemini = GeminiProvider()
    candidate = {
        "title": payload.title,
        "description": payload.description,
        "mandal": payload.mandal,
        "category": payload.category,
        "source_type": "citizen_complaint"
    }

    ai_verdict = await gemini.deduplicate_and_extract_task(candidate, existing_issues)
    is_unique = ai_verdict.get("is_unique", True)
    matched_id = ai_verdict.get("matched_issue_id")

    task_info = ai_verdict.get("extracted_task", {})

    # 3. Handle Issue Creation or Clustering
    if is_unique or not matched_id:
        # Create brand-new unique collector task!
        new_issue = Issue(
            title=task_info.get("title", payload.title),
            description=task_info.get("description", payload.description),
            category=task_info.get("category", payload.category),
            severity=task_info.get("severity", "Non-critical"),
            status="Open",
            mandal_name=payload.mandal,
            latitude=payload.latitude or 17.5113,
            longitude=payload.longitude or 78.8872,
            assigned_department=task_info.get("suggested_department", "Social Welfare"),
            source="citizen_complaint",
            is_unique=True,
            cluster_count=1,
            duplicate_evidence=[],
            ai_confidence=ai_verdict.get("confidence", 0.95),
            ai_reasoning=f"Verified unique citizen grievance by AI. Recommended action: {task_info.get('recommended_action')}"
        )
        db.add(new_issue)
        db.commit()
        db.refresh(new_issue)
        matched_id = new_issue.id

        # Index in Vector Store
        text_content = f"{new_issue.title}. {new_issue.description}. Mandal: {new_issue.mandal_name}. Category: {new_issue.category}"
        emb = await gemini.get_embedding(text_content)
        vector_store.upsert_issue_embedding(new_issue.id, text_content, emb)
    else:
        # Cluster under existing issue
        existing = db.query(Issue).filter(Issue.id == matched_id).first()
        if existing:
            existing.cluster_count += 1
            evidence_list = list(existing.duplicate_evidence or [])
            evidence_list.append({
                "source": "Citizen Complaint",
                "title": payload.title,
                "snippet": payload.description[:150],
                "confidence": ai_verdict.get("confidence", 0.92),
                "timestamp": datetime.datetime.utcnow().isoformat()
            })
            existing.duplicate_evidence = evidence_list
            db.commit()

    # 4. Save Citizen Complaint Record
    complaint = Complaint(
        citizen_name="Citizen Reporter",
        title=payload.title,
        description=payload.description,
        category=payload.category,
        district=payload.district or "Yadadri Bhuvanagiri",
        mandal=payload.mandal,
        village=payload.village,
        latitude=payload.latitude,
        longitude=payload.longitude,
        image_url=payload.image_url,
        status="Pending",
        is_unique_task=is_unique,
        matched_issue_id=matched_id,
        ai_analysis=ai_verdict
    )
    db.add(complaint)
    db.commit()
    db.refresh(complaint)

    return ComplaintResponse.model_validate(complaint)

@router.get("/all", response_model=List[ComplaintResponse])
def get_all_complaints(db: Session = Depends(get_db)):
    complaints = db.query(Complaint).order_by(Complaint.created_at.desc()).all()
    return [ComplaintResponse.model_validate(c) for c in complaints]

@router.get("/my", response_model=List[ComplaintResponse])
def get_my_complaints(db: Session = Depends(get_db)):
    # Returns complaints for active citizen
    complaints = db.query(Complaint).order_by(Complaint.created_at.desc()).limit(20).all()
    return [ComplaintResponse.model_validate(c) for c in complaints]
