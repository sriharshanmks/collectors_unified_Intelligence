import datetime
from sqlalchemy.orm import Session
from backend.auth import get_password_hash
from backend.models import User, Entity, Mandal, Site, Issue, Report, Complaint, NewsArticle
from services.ai_service.vector_store import vector_store

def hash_pw(password: str) -> str:
    return get_password_hash(password)

def seed_database(db: Session):
    # Check if already seeded
    if db.query(Entity).count() > 0:
        return

    print("🌱 Seeding FIMMS Unified Collectorate database...")

    # 1. Seed Taluks/Blocks (19 Taluks & Blocks of Madurai District, Tamil Nadu)
    mandals_data = [
        {"name": "Madurai North", "health_score": 17, "coverage_pct": 15, "open_issues": 2, "critical_issues": 1, "overdue_issues": 0, "latitude": 9.9392, "longitude": 78.1217},
        {"name": "Melur", "health_score": 20, "coverage_pct": 18, "open_issues": 77, "critical_issues": 31, "overdue_issues": 0, "latitude": 10.0278, "longitude": 78.3361},
        {"name": "Thiruparankundram", "health_score": 22, "coverage_pct": 20, "open_issues": 6, "critical_issues": 2, "overdue_issues": 0, "latitude": 9.8828, "longitude": 78.0734},
        {"name": "Vadipatti", "health_score": 23, "coverage_pct": 22, "open_issues": 22, "critical_issues": 7, "overdue_issues": 0, "latitude": 10.0760, "longitude": 77.9472},
        {"name": "Madurai South", "health_score": 24, "coverage_pct": 25, "open_issues": 11, "critical_issues": 3, "overdue_issues": 0, "latitude": 9.9195, "longitude": 78.1194},
        {"name": "Thirumangalam", "health_score": 33, "coverage_pct": 35, "open_issues": 1, "critical_issues": 0, "overdue_issues": 0, "latitude": 9.8242, "longitude": 77.9868},
        {"name": "Alanganallur", "health_score": 33, "coverage_pct": 35, "open_issues": 1, "critical_issues": 0, "overdue_issues": 0, "latitude": 10.0460, "longitude": 78.0935},
        {"name": "Usilampatti", "health_score": 38, "coverage_pct": 40, "open_issues": 3, "critical_issues": 1, "overdue_issues": 0, "latitude": 9.9678, "longitude": 77.7942},
        {"name": "Sholavandan", "health_score": 42, "coverage_pct": 45, "open_issues": 4, "critical_issues": 1, "overdue_issues": 0, "latitude": 10.0210, "longitude": 78.0120},
        {"name": "Madurai East", "health_score": 45, "coverage_pct": 50, "open_issues": 2, "critical_issues": 0, "overdue_issues": 0, "latitude": 9.9280, "longitude": 78.1400},
        {"name": "Madurai West", "health_score": 48, "coverage_pct": 52, "open_issues": 3, "critical_issues": 1, "overdue_issues": 0, "latitude": 9.9350, "longitude": 78.0980},
        {"name": "Peraiyur", "health_score": 50, "coverage_pct": 55, "open_issues": 2, "critical_issues": 0, "overdue_issues": 0, "latitude": 9.7144, "longitude": 77.7886},
        {"name": "Kallikudi", "health_score": 52, "coverage_pct": 58, "open_issues": 1, "critical_issues": 0, "overdue_issues": 0, "latitude": 9.7042, "longitude": 77.9511},
        {"name": "Sedapatti", "health_score": 55, "coverage_pct": 60, "open_issues": 2, "critical_issues": 0, "overdue_issues": 0, "latitude": 9.8240, "longitude": 77.7120},
        {"name": "Chellampatti", "health_score": 58, "coverage_pct": 62, "open_issues": 1, "critical_issues": 0, "overdue_issues": 0, "latitude": 9.9920, "longitude": 77.8920},
        {"name": "T. Kallupatti", "health_score": 60, "coverage_pct": 65, "open_issues": 1, "critical_issues": 0, "overdue_issues": 0, "latitude": 9.6912, "longitude": 77.8123},
        {"name": "Kottampatti", "health_score": 62, "coverage_pct": 68, "open_issues": 2, "critical_issues": 1, "overdue_issues": 0, "latitude": 10.1920, "longitude": 78.4320},
        {"name": "Othakadai", "health_score": 65, "coverage_pct": 70, "open_issues": 1, "critical_issues": 0, "overdue_issues": 0, "latitude": 9.9620, "longitude": 78.1720},
        {"name": "Samayanallur", "health_score": 68, "coverage_pct": 72, "open_issues": 1, "critical_issues": 0, "overdue_issues": 0, "latitude": 9.9820, "longitude": 78.0420}
    ]

    mandal_objs = {}
    for md in mandals_data:
        m = Mandal(**md)
        db.add(m)
        mandal_objs[md["name"]] = m
    db.commit()

    # 2. Seed Entities (Matching Image 1)
    entities_data = [
        {
            "name": "FIMMS Test - Issues v2 (TE)",
            "category": "Hostels",
            "status": "ongoing",
            "survey_progress": 0,
            "total_sites": 1,
            "scheduled": 1,
            "issues_count": 5,
            "completed_count": 0,
            "missed_count": 0,
            "pending_count": 0,
            "banner_color": "purple"
        },
        {
            "name": "GOVERNMENT HOSTELS",
            "category": "Hostels",
            "status": "not_initiated",
            "survey_progress": 0,
            "total_sites": 85,
            "scheduled": 0,
            "issues_count": 21,
            "completed_count": 0,
            "missed_count": 0,
            "pending_count": 0,
            "banner_color": "amber",
            "image_url": "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=600&q=80"
        },
        {
            "name": "REPORTS TEST — Govt Hostels",
            "category": "Hostels",
            "status": "ongoing",
            "survey_progress": 0,
            "total_sites": 5,
            "scheduled": 1,
            "issues_count": 4,
            "completed_count": 0,
            "missed_count": 0,
            "pending_count": 0,
            "banner_color": "blue",
            "image_url": "https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&w=600&q=80"
        },
        {
            "name": "Uday Test Hostels",
            "category": "Hostels",
            "status": "ongoing",
            "survey_progress": 0,
            "total_sites": 4,
            "scheduled": 1,
            "issues_count": 7,
            "completed_count": 0,
            "missed_count": 0,
            "pending_count": 0,
            "banner_color": "indigo",
            "image_url": "https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=600&q=80"
        }
    ]

    entity_objs = []
    for ed in entities_data:
        e = Entity(**ed)
        db.add(e)
        entity_objs.append(e)
    db.commit()

    # 3. Seed Users (Matching Image 3: 113 users - 97 Field Officers, 14 HODs, 2 Admins)
    pw = hash_pw("admin123")
    citizen_pw = hash_pw("citizen123")

    users_data = [
        # Admins
        {"email": "collector@fimms.gov.in", "hashed_password": pw, "full_name": "Dr. M.S. Sangeetha, IAS", "role": "collector", "title": "District Collector & DM, Madurai", "department": "District Administration", "phone": "+919440123456", "district": "Madurai"},
        {"email": "admin@fimms.gov.in", "hashed_password": pw, "full_name": "Dr. R. Saravanan", "role": "admin", "title": "District Revenue Officer & Joint Collector", "department": "Collectorate", "phone": "+919440654321", "district": "Madurai"},
        
        # Citizens
        {"email": "citizen@fimms.gov.in", "hashed_password": citizen_pw, "full_name": "Ravi Kumar (Citizen)", "role": "citizen", "title": "Citizen / Resident", "phone": "+919876543210", "district": "Madurai", "mandal": "Madurai North"},
        {"email": "farmer@fimms.gov.in", "hashed_password": citizen_pw, "full_name": "M. Murugesan (Farmer)", "role": "citizen", "title": "Citizen / Farmer", "phone": "+919876500112", "district": "Madurai", "mandal": "Melur"},

        # HODs (Heads of Department)
        {"email": "hod.social@fimms.gov.in", "hashed_password": pw, "full_name": "M. Rajeshwari, DSWO", "role": "hod", "title": "District Social Welfare Officer", "department": "BC & MBC Welfare", "phone": "+919989011223", "district": "Madurai"},
        {"email": "hod.health@fimms.gov.in", "hashed_password": pw, "full_name": "Dr. P. Kumar, DDHS", "role": "hod", "title": "Deputy Director of Health Services", "department": "Health & Medical Services", "phone": "+919989022334", "district": "Madurai"},
        {"email": "hod.pwd@fimms.gov.in", "hashed_password": pw, "full_name": "S. Shanmugam, EE", "role": "hod", "title": "Executive Engineer", "department": "PWD Buildings & Highways", "phone": "+919989033445", "district": "Madurai"},
        {"email": "hod.irrigation@fimms.gov.in", "hashed_password": pw, "full_name": "K. Veeramani, SE", "role": "hod", "title": "Superintending Engineer", "department": "PWD Water Resources (Vaigai Basin)", "phone": "+919989044556", "district": "Madurai"},

        # Field Officers
        {"email": "alivelu@fimms.gov.in", "hashed_password": pw, "full_name": "S. Alagarsamy, BDO", "role": "field_officer", "title": "Block Development Officer", "department": "Rural Development", "phone": "+919121300313", "sites_assigned_count": 1, "assigned_site_name": "Govt BC Girls Hostel Thirumangalam", "mandal": "Thirumangalam"},
        {"email": "anuradha@fimms.gov.in", "hashed_password": pw, "full_name": "M. Anuradha, Tahsildar", "role": "field_officer", "title": "Tahsildar", "department": "Revenue", "phone": "+918790539009", "sites_assigned_count": 1, "assigned_site_name": "Govt Adi Dravidar Welfare Hostel Melur", "mandal": "Melur"},
        {"email": "ramulu@fimms.gov.in", "hashed_password": pw, "full_name": "K. Ramasamy, BDO", "role": "field_officer", "title": "Block Development Officer", "department": "Panchayat Raj", "phone": "+919989059042", "sites_assigned_count": 1, "assigned_site_name": "Govt BC Boys Hostel Thiruparankundram", "mandal": "Thiruparankundram"},
        {"email": "srinivas.ad@fimms.gov.in", "hashed_password": pw, "full_name": "P. Srinivasan, AD Handlooms", "role": "field_officer", "title": "Assistant Director", "department": "Handlooms & Textiles", "phone": "+919603712199", "sites_assigned_count": 1, "assigned_site_name": "Govt Model Residential School Vadipatti", "mandal": "Vadipatti"},
        {"email": "bikshapathi@fimms.gov.in", "hashed_password": pw, "full_name": "K. Balakrishnan, CEO", "role": "field_officer", "title": "Chief Educational Officer", "department": "School Education", "phone": "+917995087630", "sites_assigned_count": 1, "assigned_site_name": "Govt SCDD Girls College Hostel Madurai North", "mandal": "Madurai North"},
        {"email": "chandeerani@fimms.gov.in", "hashed_password": pw, "full_name": "S. Chandramathi, BDO", "role": "field_officer", "title": "Block Development Officer", "department": "Rural Development", "phone": "+919989059016", "sites_assigned_count": 0, "assigned_site_name": None, "mandal": "Usilampatti"},
        {"email": "chandra.prakash@fimms.gov.in", "hashed_password": pw, "full_name": "V. Chandrasekar, Tahsildar", "role": "field_officer", "title": "Tahsildar", "department": "Revenue", "phone": "+919392205913", "sites_assigned_count": 1, "assigned_site_name": "Govt Welfare Hostel Sholavandan", "mandal": "Sholavandan"},
        {"email": "ch.srinivas@fimms.gov.in", "hashed_password": pw, "full_name": "C. Soundararajan, Dy BDO", "role": "field_officer", "title": "Deputy BDO", "department": "Zilla Praja Parishad", "phone": "+918374507070", "sites_assigned_count": 1, "assigned_site_name": "TMREIS Model School Alanganallur", "mandal": "Alanganallur"}
    ]

    for ud in users_data:
        u = User(**ud)
        db.add(u)
    db.commit()

    # 4. Seed Sites (Hostels & Facilities across Madurai Taluks)
    sites_data = [
        {"name": "Govt BC Girls Hostel Thirumangalam", "site_type": "Hostel", "entity_id": entity_objs[1].id, "mandal_id": mandal_objs["Thirumangalam"].id, "latitude": 9.8242, "longitude": 77.9868, "address": "Usilampatti Road, Thirumangalam"},
        {"name": "Govt Adi Dravidar Welfare Hostel Melur", "site_type": "Hostel", "entity_id": entity_objs[1].id, "mandal_id": mandal_objs["Melur"].id, "latitude": 10.0278, "longitude": 78.3361, "address": "Trichy Main Road, Melur"},
        {"name": "Govt SCDD Girls College Hostel Madurai North", "site_type": "Hostel", "entity_id": entity_objs[1].id, "mandal_id": mandal_objs["Madurai North"].id, "latitude": 9.9392, "longitude": 78.1217, "address": "Near Tallakulam, Madurai North"},
        {"name": "Govt BC Boys Hostel Thiruparankundram", "site_type": "Hostel", "entity_id": entity_objs[1].id, "mandal_id": mandal_objs["Thiruparankundram"].id, "latitude": 9.8828, "longitude": 78.0734, "address": "TCE Link Road, Thiruparankundram"},
        {"name": "TMREIS Model School Alanganallur", "site_type": "Hostel", "entity_id": entity_objs[1].id, "mandal_id": mandal_objs["Alanganallur"].id, "latitude": 10.0460, "longitude": 78.0935, "address": "Jallikattu Road, Alanganallur"},
        {"name": "KGBV Girls Residential Hostel Usilampatti", "site_type": "Hostel", "entity_id": entity_objs[1].id, "mandal_id": mandal_objs["Usilampatti"].id, "latitude": 9.9678, "longitude": 77.7942, "address": "Town Center, Usilampatti"},
        {"name": "Govt Model Residential School Vadipatti", "site_type": "Hostel", "entity_id": entity_objs[1].id, "mandal_id": mandal_objs["Vadipatti"].id, "latitude": 10.0760, "longitude": 77.9472, "address": "Near Railway Feeder Road, Vadipatti"},
        {"name": "Govt Welfare Hostel Sholavandan", "site_type": "Hostel", "entity_id": entity_objs[1].id, "mandal_id": mandal_objs["Sholavandan"].id, "latitude": 10.0210, "longitude": 78.0120, "address": "Vaigai Bank Road, Sholavandan"}
    ]

    for sd in sites_data:
        s = Site(**sd)
        db.add(s)
    db.commit()

    # 5. Seed Unique Collector Tasks / Issues (Identified via LLM RAG Deduplication)
    issues_data = [
        {
            "title": "Contaminated Drinking Water & Pipeline Infiltration at Thirumangalam Govt Hostel",
            "description": "Borewell motor pipeline has corroded resulting in municipal drainage infiltration into the overhead water tank. 15 students reported mild gastro symptoms.",
            "category": "Hostels",
            "severity": "Critical",
            "status": "Open",
            "mandal_name": "Thirumangalam",
            "site_name": "Govt BC Girls Hostel Thirumangalam",
            "latitude": 9.8242,
            "longitude": 77.9868,
            "assigned_department": "BC & MBC Welfare",
            "assigned_officer_name": "S. Alagarsamy, BDO",
            "source": "news_api",
            "is_unique": True,
            "cluster_count": 3,
            "duplicate_evidence": [
                {"source": "The Hindu", "snippet": "Drinking water contamination at Thirumangalam student hostel", "confidence": 0.96},
                {"source": "Citizen Complaint", "snippet": "Grievance #104: Murky tap water in mess area", "confidence": 0.94}
            ],
            "ai_confidence": 0.97,
            "ai_reasoning": "RAG vector retrieval matched multiple complaints into one verified unique critical task. Municipal pipeline inspection mandated."
        },
        {
            "title": "Vaigai Canal Sluice Gate Breach Flooding 150 Acres of Paddy Fields in Melur",
            "description": "Sub-distributary canal embankment breached across 15 meters following heavy Vaigai reservoir discharge. Water gushing onto field access roads.",
            "category": "Water & Irrigation",
            "severity": "Critical",
            "status": "Under Review",
            "mandal_name": "Melur",
            "site_name": "Melur Canal Basin",
            "latitude": 10.0278,
            "longitude": 78.3361,
            "assigned_department": "PWD Water Resources",
            "assigned_officer_name": "K. Veeramani, SE",
            "source": "citizen_complaint",
            "is_unique": True,
            "cluster_count": 4,
            "duplicate_evidence": [
                {"source": "Citizen Complaint", "snippet": "Canal water entering agricultural lands along Melur bypass", "confidence": 0.95},
                {"source": "Times of India", "snippet": "Melur paddy fields inundated after sluice damage", "confidence": 0.92}
            ],
            "ai_confidence": 0.98,
            "ai_reasoning": "High-priority irrigation emergency. Deduplicated 4 individual complaints into a single unified flood defense ticket."
        },
        {
            "title": "Vadipatti Primary Health Centre Transformer Blowout - Cold Chain Alert",
            "description": "11kV distribution transformer burnt out during storm. Vaccine storage cold chain running on inverter backup.",
            "category": "Health",
            "severity": "Critical",
            "status": "Action Initiated",
            "mandal_name": "Vadipatti",
            "site_name": "Vadipatti PHC Campus",
            "latitude": 10.0760,
            "longitude": 77.9472,
            "assigned_department": "Health & Medical Services",
            "assigned_officer_name": "Dr. P. Kumar, DDHS",
            "source": "news_api",
            "is_unique": True,
            "cluster_count": 2,
            "duplicate_evidence": [],
            "ai_confidence": 0.94,
            "ai_reasoning": "Critical infrastructure failure impacting health cold-chain."
        },
        {
            "title": "Culvert Subsidence & Road Cracks on Alanganallur-Vadipatti Link Road",
            "description": "Heavy monsoon runoff damages 40-year-old culvert masonry. Commuters and school buses stranded; PWD inspection team dispatched.",
            "category": "Roads & PWD",
            "severity": "Non-critical",
            "status": "Open",
            "mandal_name": "Alanganallur",
            "site_name": "Alanganallur Link Road",
            "latitude": 10.0460,
            "longitude": 78.0935,
            "assigned_department": "PWD Buildings & Highways",
            "assigned_officer_name": "S. Shanmugam, EE",
            "source": "field_survey",
            "is_unique": True,
            "cluster_count": 1,
            "duplicate_evidence": [],
            "ai_confidence": 0.91,
            "ai_reasoning": "Structural survey issue flagged during field inspection cycle."
        },
        {
            "title": "Drinking Water Borewell Motor Failure at Thiruparankundram Boys Hostel",
            "description": "Motor burnout causing water scarcity for 120 resident students. Emergency tanker supply requested.",
            "category": "Hostels",
            "severity": "Non-critical",
            "status": "Open",
            "mandal_name": "Thiruparankundram",
            "site_name": "Govt BC Boys Hostel Thiruparankundram",
            "latitude": 9.8828,
            "longitude": 78.0734,
            "assigned_department": "BC & MBC Welfare",
            "assigned_officer_name": "K. Ramasamy, BDO",
            "source": "citizen_complaint",
            "is_unique": True,
            "cluster_count": 1,
            "duplicate_evidence": [],
            "ai_confidence": 0.93,
            "ai_reasoning": "Unique hostel infrastructure grievance."
        }
    ]

    for iss_data in issues_data:
        m_name = iss_data.get("mandal_name")
        if m_name in mandal_objs:
            iss_data["mandal_id"] = mandal_objs[m_name].id
        iss = Issue(**iss_data)
        db.add(iss)
        db.commit()
        db.refresh(iss)

        # Index in RAG Vector Store
        text_content = f"{iss.title}. {iss.description}. Mandal: {iss.mandal_name}. Category: {iss.category}."
        emb = vector_store._fallback_embedding(text_content)
        vector_store.upsert_issue_embedding(iss.id, text_content, emb)

    # 6. Seed Survey Reports (Matching Image 4)
    now = datetime.datetime.utcnow()
    reports_data = [
        {
            "entity_id": entity_objs[1].id,
            "entity_name": "GOVERNMENT HOSTELS",
            "title": "Welfare Hostel Inspection 2026 - 15 da...",
            "cycle_label": "Cycle 6 • 30 Aug 2026 - 13 Sep 2026",
            "cycle_number": 6,
            "start_date": now - datetime.timedelta(days=50),
            "end_date": now - datetime.timedelta(days=36),
            "completed_count": 0,
            "missed_count": 85,
            "issues_count": 0,
            "status": "completed"
        },
        {
            "entity_id": entity_objs[2].id,
            "entity_name": "REPORTS TEST — GOVT HOSTELS",
            "title": "REPORTS TEST — 15-day Inspection",
            "cycle_label": "Cycle 9 • 29 Aug 2026 - 12 Sep 2026",
            "cycle_number": 9,
            "start_date": now - datetime.timedelta(days=51),
            "end_date": now - datetime.timedelta(days=37),
            "completed_count": 0,
            "missed_count": 4,
            "issues_count": 0,
            "status": "completed"
        },
        {
            "entity_id": entity_objs[1].id,
            "entity_name": "GOVERNMENT HOSTELS",
            "title": "Welfare Hostel Inspection 2026 - 15 da...",
            "cycle_label": "Cycle 5 • 15 Aug 2026 - 29 Aug 2026",
            "cycle_number": 5,
            "start_date": now - datetime.timedelta(days=65),
            "end_date": now - datetime.timedelta(days=51),
            "completed_count": 0,
            "missed_count": 85,
            "issues_count": 0,
            "status": "completed"
        },
        {
            "entity_id": entity_objs[2].id,
            "entity_name": "REPORTS TEST — GOVT HOSTELS",
            "title": "REPORTS TEST — 15-day Inspection",
            "cycle_label": "Cycle 8 • 14 Aug 2026 - 28 Aug 2026",
            "cycle_number": 8,
            "start_date": now - datetime.timedelta(days=66),
            "end_date": now - datetime.timedelta(days=52),
            "completed_count": 0,
            "missed_count": 4,
            "issues_count": 0,
            "status": "completed"
        },
        {
            "entity_id": entity_objs[3].id,
            "entity_name": "UDAY TEST HOSTELS",
            "title": "Test for survey issue raise",
            "cycle_label": "1 Aug 2026 - 18 Aug 2026",
            "cycle_number": 1,
            "start_date": now - datetime.timedelta(days=79),
            "end_date": now - datetime.timedelta(days=62),
            "completed_count": 1,
            "missed_count": 0,
            "issues_count": 0,
            "status": "completed"
        },
        {
            "entity_id": entity_objs[1].id,
            "entity_name": "GOVERNMENT HOSTELS",
            "title": "Welfare Hostel Inspection 2026 - 15 da...",
            "cycle_label": "Cycle 4 • 31 Jul 2026 - 14 Aug 2026",
            "cycle_number": 4,
            "start_date": now - datetime.timedelta(days=80),
            "end_date": now - datetime.timedelta(days=66),
            "completed_count": 0,
            "missed_count": 85,
            "issues_count": 0,
            "status": "completed"
        },
        {
            "entity_id": entity_objs[2].id,
            "entity_name": "REPORTS TEST — GOVT HOSTELS",
            "title": "REPORTS TEST — 15-day Inspection",
            "cycle_label": "Cycle 7 • 30 Jul 2026 - 13 Aug 2026",
            "cycle_number": 7,
            "start_date": now - datetime.timedelta(days=81),
            "end_date": now - datetime.timedelta(days=67),
            "completed_count": 0,
            "missed_count": 4,
            "issues_count": 0,
            "status": "completed"
        },
        {
            "entity_id": entity_objs[3].id,
            "entity_name": "UDAY TEST HOSTELS",
            "title": "To test issues",
            "cycle_label": "1 Aug 2026 - 2 Aug 2026",
            "cycle_number": 2,
            "start_date": now - datetime.timedelta(days=79),
            "end_date": now - datetime.timedelta(days=78),
            "completed_count": 0,
            "missed_count": 1,
            "issues_count": 0,
            "status": "completed"
        },
        {
            "entity_id": entity_objs[1].id,
            "entity_name": "GOVERNMENT HOSTEL - 1",
            "title": "GHO Test Inspection (18 Jun - 19 Jul 2026)",
            "cycle_label": "Cycle 1 • 18 Jun 2026 - 19 Jul 2026",
            "cycle_number": 1,
            "start_date": now - datetime.timedelta(days=120),
            "end_date": now - datetime.timedelta(days=91),
            "completed_count": 2,
            "missed_count": 3,
            "issues_count": 3,
            "status": "completed"
        }
    ]

    for rd in reports_data:
        r = Report(**rd)
        db.add(r)
    db.commit()

    print("✅ Database successfully seeded with FIMMS entities, scorecard, users, and reports!")

if __name__ == "__main__":
    from backend.database import SessionLocal, Base, engine
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    seed_database(db)
    db.close()
