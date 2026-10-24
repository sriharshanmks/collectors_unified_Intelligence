"""
Database Migration & Reset Script: Reseed FIMMS with Madurai District Data.
Run inside the EC2 container or locally to instantly populate Madurai and its surroundings.
"""

import sys
import os
from sqlalchemy import text

# Add workspace to path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from backend.database import SessionLocal, engine, Base
from backend.models import Mandal, Site, Issue, Entity, Report, Complaint, NewsArticle
from backend.seed_data import seed_database

def reseed_to_madurai():
    print("📍 Connecting to database to apply Madurai District migration...")
    db = SessionLocal()
    try:
        # Clear issues, sites, mandals, entities to trigger clean seed
        print("🧹 Clearing previous district entities, sites, issues & mandals...")
        db.query(Issue).delete()
        db.query(Site).delete()
        db.query(Report).delete()
        db.query(Entity).delete()
        db.query(Mandal).delete()
        db.commit()

        # Update existing users district if any
        from backend.models import User
        users = db.query(User).all()
        for u in users:
            u.district = "Madurai"
            if u.role == "collector":
                u.full_name = "Dr. M.S. Sangeetha, IAS"
                u.title = "District Collector & DM, Madurai"
            elif u.role == "admin":
                u.full_name = "Dr. R. Saravanan"
                u.title = "District Revenue Officer & Joint Collector"
        db.commit()

        print("🌱 Seeding 19 Taluks/Blocks of Madurai, Facilities, and Issues...")
        seed_database(db)
        print("✅ Madurai District reseed completed successfully!")
        
        # Verify
        mandals_count = db.query(Mandal).count()
        issues_count = db.query(Issue).count()
        sites_count = db.query(Site).count()
        print(f"📊 Live counts: {mandals_count} Taluks/Blocks, {sites_count} Facilities/Sites, {issues_count} Geotagged Issues.")
    except Exception as e:
        db.rollback()
        print(f"❌ Error during reseed: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    reseed_to_madurai()
