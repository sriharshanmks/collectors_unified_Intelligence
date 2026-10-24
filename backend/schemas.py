import datetime
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: str = "citizen"
    phone: Optional[str] = None
    title: Optional[str] = None
    department: Optional[str] = None
    district: str = "Madurai"
    mandal: Optional[str] = None
    sites_assigned_count: int = 0
    assigned_site_name: Optional[str] = None
    is_active: bool = True

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: int
    created_at: Optional[datetime.datetime] = None

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# Entity Schemas (Image 1)
class EntityBase(BaseModel):
    name: str
    category: str = "Hostels"
    status: str = "ongoing" # ongoing, not_initiated, completed
    survey_progress: int = 0
    total_sites: int = 0
    scheduled: int = 0
    issues_count: int = 0
    completed_count: int = 0
    missed_count: int = 0
    pending_count: int = 0
    image_url: Optional[str] = None
    banner_color: str = "purple"

class EntityCreate(EntityBase):
    pass

class EntityResponse(EntityBase):
    id: int
    created_at: Optional[datetime.datetime] = None

    class Config:
        from_attributes = True

# Mandal / Scorecard Schemas (Image 2)
class MandalResponse(BaseModel):
    id: int
    name: str
    district: str
    health_score: int
    coverage_pct: int
    open_issues: int
    critical_issues: int
    overdue_issues: int
    latitude: float
    longitude: float

    class Config:
        from_attributes = True

# Issue / Collector Task Schemas
class IssueBase(BaseModel):
    title: str
    description: str
    category: str = "Hostels"
    severity: str = "Non-critical" # Critical, Non-critical, High, Medium, Low
    status: str = "Open"
    mandal_name: Optional[str] = None
    site_name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    assigned_department: Optional[str] = "Social Welfare"
    assigned_officer_name: Optional[str] = None
    source: str = "news_api"
    is_unique: bool = True
    cluster_count: int = 1
    duplicate_evidence: Optional[List[Dict[str, Any]]] = None
    ai_confidence: float = 0.95
    ai_reasoning: Optional[str] = None
    action_notes: Optional[str] = None

class IssueCreate(IssueBase):
    entity_id: Optional[int] = None
    site_id: Optional[int] = None
    mandal_id: Optional[int] = None

class IssueResponse(IssueBase):
    id: int
    entity_id: Optional[int] = None
    site_id: Optional[int] = None
    mandal_id: Optional[int] = None
    created_at: Optional[datetime.datetime] = None
    updated_at: Optional[datetime.datetime] = None

    class Config:
        from_attributes = True

class IssueStatusUpdate(BaseModel):
    status: str
    action_notes: Optional[str] = None
    assigned_officer_name: Optional[str] = None

# Citizen Complaint Schemas
class ComplaintCreate(BaseModel):
    title: str
    description: str
    category: str
    district: Optional[str] = "Madurai"
    mandal: str
    village: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    image_url: Optional[str] = None

class ComplaintResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    citizen_name: Optional[str] = None
    phone: Optional[str] = None
    title: str
    description: str
    category: str
    district: str
    mandal: str
    village: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    image_url: Optional[str] = None
    status: str
    is_unique_task: bool
    matched_issue_id: Optional[int] = None
    ai_analysis: Optional[Dict[str, Any]] = None
    created_at: Optional[datetime.datetime] = None

    class Config:
        from_attributes = True

# Report Schemas (Image 4)
class ReportResponse(BaseModel):
    id: int
    entity_id: Optional[int] = None
    entity_name: str
    title: str
    cycle_label: Optional[str] = None
    cycle_number: int
    start_date: datetime.datetime
    end_date: datetime.datetime
    completed_count: int
    missed_count: int
    issues_count: int
    status: str
    download_url: Optional[str] = None

    class Config:
        from_attributes = True

# Dashboard Stats Schemas (Image 2)
class DashboardStatsResponse(BaseModel):
    total_sites: int = 99
    total_issues: int = 0
    completed: int = 0
    pending: int = 0
    critical_issues_count: int = 0
    non_critical_issues_count: int = 0
    issues_by_department: Dict[str, int] = {}
    issues_by_taluka: Dict[str, int] = {}
    issues_by_hod: Dict[str, int] = {}
    issues_by_site: Dict[str, int] = {}
    issues_by_age: Dict[str, int] = {}
    issues_by_type: Dict[str, int] = {}
    mandals: List[MandalResponse] = []
