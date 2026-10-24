import datetime
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, Boolean, JSON
from sqlalchemy.orm import relationship
from backend.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), default="citizen", nullable=False)  # 'collector', 'citizen', 'field_officer', 'hod', 'admin'
    phone = Column(String(50), nullable=True)
    title = Column(String(100), nullable=True)
    department = Column(String(100), nullable=True)
    district = Column(String(100), default="Yadadri Bhuvanagiri", nullable=False)
    mandal = Column(String(100), nullable=True)
    sites_assigned_count = Column(Integer, default=0)
    assigned_site_name = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    complaints = relationship("Complaint", back_populates="user")
    assigned_issues = relationship("Issue", back_populates="assigned_officer")


class Entity(Base):
    __tablename__ = "entities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    category = Column(String(100), default="Hostels", nullable=False)
    status = Column(String(50), default="ongoing", nullable=False) # ongoing, not_initiated, completed
    survey_progress = Column(Integer, default=0)
    total_sites = Column(Integer, default=0)
    scheduled = Column(Integer, default=0)
    issues_count = Column(Integer, default=0)
    completed_count = Column(Integer, default=0)
    missed_count = Column(Integer, default=0)
    pending_count = Column(Integer, default=0)
    image_url = Column(String(500), nullable=True)
    banner_color = Column(String(50), default="purple")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    sites = relationship("Site", back_populates="entity")
    issues = relationship("Issue", back_populates="entity")
    reports = relationship("Report", back_populates="entity")


class Mandal(Base):
    __tablename__ = "mandals"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True, nullable=False)
    district = Column(String(100), default="Yadadri Bhuvanagiri", nullable=False)
    health_score = Column(Integer, default=25)
    coverage_pct = Column(Integer, default=0)
    open_issues = Column(Integer, default=0)
    critical_issues = Column(Integer, default=0)
    overdue_issues = Column(Integer, default=0)
    latitude = Column(Float, default=17.5113)
    longitude = Column(Float, default=78.8872)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    sites = relationship("Site", back_populates="mandal")
    issues = relationship("Issue", back_populates="mandal")


class Site(Base):
    __tablename__ = "sites"

    id = Column(Integer, primary_key=True, index=True)
    entity_id = Column(Integer, ForeignKey("entities.id"), nullable=True)
    mandal_id = Column(Integer, ForeignKey("mandals.id"), nullable=True)
    name = Column(String(255), nullable=False)
    site_type = Column(String(100), default="Hostel")
    address = Column(Text, nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    assigned_officer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    entity = relationship("Entity", back_populates="sites")
    mandal = relationship("Mandal", back_populates="sites")
    issues = relationship("Issue", back_populates="site")


class Issue(Base):
    __tablename__ = "issues"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(100), default="Infrastructure", nullable=False)
    severity = Column(String(50), default="Non-critical", nullable=False) # Critical, Non-critical, High, Medium, Low
    status = Column(String(50), default="Open", nullable=False) # Open, Under Review, Action Initiated, Resolved
    
    mandal_id = Column(Integer, ForeignKey("mandals.id"), nullable=True)
    mandal_name = Column(String(100), nullable=True)
    entity_id = Column(Integer, ForeignKey("entities.id"), nullable=True)
    site_id = Column(Integer, ForeignKey("sites.id"), nullable=True)
    site_name = Column(String(255), nullable=True)
    
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    
    assigned_department = Column(String(100), default="Social Welfare")
    assigned_officer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    assigned_officer_name = Column(String(255), nullable=True)
    
    source = Column(String(50), default="news_api") # news_api, citizen_complaint, field_survey
    is_unique = Column(Boolean, default=True)
    cluster_count = Column(Integer, default=1)
    duplicate_evidence = Column(JSON, default=list)
    ai_confidence = Column(Float, default=0.95)
    ai_reasoning = Column(Text, nullable=True)
    action_notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    entity = relationship("Entity", back_populates="issues")
    mandal = relationship("Mandal", back_populates="issues")
    site = relationship("Site", back_populates="issues")
    assigned_officer = relationship("User", back_populates="assigned_issues")


class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    citizen_name = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(100), nullable=False)
    district = Column(String(100), default="Yadadri Bhuvanagiri", nullable=False)
    mandal = Column(String(100), nullable=False)
    village = Column(String(100), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    image_url = Column(String(500), nullable=True)
    status = Column(String(50), default="Pending", nullable=False)
    is_unique_task = Column(Boolean, default=True)
    matched_issue_id = Column(Integer, ForeignKey("issues.id"), nullable=True)
    ai_analysis = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="complaints")


class NewsArticle(Base):
    __tablename__ = "news_articles"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    content = Column(Text, nullable=True)
    source = Column(String(255), nullable=True)
    url = Column(String(1000), nullable=True)
    image_url = Column(String(1000), nullable=True)
    published_at = Column(DateTime, default=datetime.datetime.utcnow)
    category = Column(String(100), default="Hostels")
    sentiment = Column(String(50), default="Negative")
    district = Column(String(100), default="Yadadri Bhuvanagiri")
    mandal = Column(String(100), nullable=True)
    processed_by_llm = Column(Boolean, default=False)
    is_unique_problem = Column(Boolean, default=True)
    matched_issue_id = Column(Integer, ForeignKey("issues.id"), nullable=True)
    ai_dedup_verdict = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    entity_id = Column(Integer, ForeignKey("entities.id"), nullable=True)
    entity_name = Column(String(255), nullable=False)
    title = Column(String(255), nullable=False)
    cycle_label = Column(String(100), nullable=True)
    cycle_number = Column(Integer, default=1)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    completed_count = Column(Integer, default=0)
    missed_count = Column(Integer, default=0)
    issues_count = Column(Integer, default=0)
    status = Column(String(50), default="completed")
    download_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    entity = relationship("Entity", back_populates="reports")


class RagLog(Base):
    __tablename__ = "rag_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    query = Column(Text, nullable=False)
    response = Column(Text, nullable=False)
    provider = Column(String(50), default="gemini")
    sources_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
