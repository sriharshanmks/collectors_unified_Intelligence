-- ==============================================================================
-- FIMMS - Collector's Unified Application
-- PostgreSQL Schema with pgvector Fast HNSW Indexing
-- ==============================================================================

-- Enable pgvector extension for high-performance RAG vector search
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users & Roles (Collectors, Field Officers, HODs, Admins, Citizens)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'citizen', -- 'collector', 'citizen', 'field_officer', 'hod', 'admin'
    phone VARCHAR(50),
    title VARCHAR(100), -- e.g. "PD Housing", "MPDO Ramannapet", "AD Handlooms"
    department VARCHAR(100),
    district VARCHAR(100) DEFAULT 'Yadadri Bhuvanagiri',
    mandal VARCHAR(100),
    sites_assigned_count INT DEFAULT 0,
    assigned_site_name VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 2. Entities (Facilities / Departments being monitored - Image 1)
CREATE TABLE IF NOT EXISTS entities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL DEFAULT 'Hostels',
    status VARCHAR(50) NOT NULL DEFAULT 'ongoing', -- 'ongoing', 'not_initiated', 'completed'
    survey_progress INT DEFAULT 0,
    total_sites INT DEFAULT 0,
    scheduled INT DEFAULT 0,
    issues_count INT DEFAULT 0,
    completed_count INT DEFAULT 0,
    missed_count INT DEFAULT 0,
    pending_count INT DEFAULT 0,
    image_url VARCHAR(500),
    banner_color VARCHAR(50) DEFAULT 'purple',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Mandals / Talukas (Image 2 District Scorecard)
CREATE TABLE IF NOT EXISTS mandals (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    district VARCHAR(100) DEFAULT 'Yadadri Bhuvanagiri',
    health_score INT DEFAULT 25,
    coverage_pct INT DEFAULT 0,
    open_issues INT DEFAULT 0,
    critical_issues INT DEFAULT 0,
    overdue_issues INT DEFAULT 0,
    latitude DOUBLE PRECISION DEFAULT 17.5113,
    longitude DOUBLE PRECISION DEFAULT 78.8872,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mandals_name ON mandals(name);

-- 4. Sites (Physical facilities mapped in mandals)
CREATE TABLE IF NOT EXISTS sites (
    id SERIAL PRIMARY KEY,
    entity_id INT REFERENCES entities(id) ON DELETE CASCADE,
    mandal_id INT REFERENCES mandals(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    site_type VARCHAR(100) DEFAULT 'Hostel',
    address TEXT,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    assigned_officer_id INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Issues / Unique Tasks (Identified via LLM RAG Deduplication or Ground Surveys)
CREATE TABLE IF NOT EXISTS issues (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL DEFAULT 'Infrastructure',
    severity VARCHAR(50) NOT NULL DEFAULT 'Non-critical', -- 'Critical', 'Non-critical', 'High', 'Medium', 'Low'
    status VARCHAR(50) NOT NULL DEFAULT 'Open', -- 'Open', 'Under Review', 'Action Initiated', 'Resolved'
    mandal_id INT REFERENCES mandals(id) ON DELETE SET NULL,
    mandal_name VARCHAR(100),
    entity_id INT REFERENCES entities(id) ON DELETE SET NULL,
    site_id INT REFERENCES sites(id) ON DELETE SET NULL,
    site_name VARCHAR(255),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    assigned_department VARCHAR(100),
    assigned_officer_id INT REFERENCES users(id) ON DELETE SET NULL,
    assigned_officer_name VARCHAR(255),
    source VARCHAR(50) DEFAULT 'news_api', -- 'news_api', 'citizen_complaint', 'field_survey'
    is_unique BOOLEAN DEFAULT TRUE,
    cluster_count INT DEFAULT 1,
    duplicate_evidence JSONB DEFAULT '[]'::jsonb,
    ai_confidence DOUBLE PRECISION DEFAULT 0.95,
    ai_reasoning TEXT,
    action_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_issues_mandal ON issues(mandal_name);
CREATE INDEX IF NOT EXISTS idx_issues_severity ON issues(severity);
CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_department ON issues(assigned_department);

-- 6. Issue Embeddings for pgvector RAG Fast Indexing
-- 768 dimensions standard for Google text-embedding-004 / modern embeddings
CREATE TABLE IF NOT EXISTS issue_embeddings (
    id SERIAL PRIMARY KEY,
    issue_id INT REFERENCES issues(id) ON DELETE CASCADE,
    embedding vector(768),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Fast HNSW Index for ultra-fast approximate nearest neighbor vector similarity search
CREATE INDEX IF NOT EXISTS idx_issue_embeddings_hnsw 
ON issue_embeddings 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- 7. Citizen Complaints (Raw inputs before / during LLM deduplication)
CREATE TABLE IF NOT EXISTS citizen_complaints (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    citizen_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    mandal VARCHAR(100) NOT NULL,
    village VARCHAR(100),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    image_url VARCHAR(500),
    status VARCHAR(50) DEFAULT 'Pending',
    is_unique_task BOOLEAN DEFAULT TRUE,
    matched_issue_id INT REFERENCES issues(id) ON DELETE SET NULL,
    ai_analysis JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. News Articles (Raw inputs from News API / News Wire)
CREATE TABLE IF NOT EXISTS news_articles (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    content TEXT,
    source VARCHAR(255),
    url VARCHAR(1000),
    image_url VARCHAR(1000),
    published_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    category VARCHAR(100) DEFAULT 'Civic Infrastructure',
    sentiment VARCHAR(50) DEFAULT 'Negative',
    district VARCHAR(100) DEFAULT 'Yadadri Bhuvanagiri',
    mandal VARCHAR(100),
    processed_by_llm BOOLEAN DEFAULT FALSE,
    is_unique_problem BOOLEAN DEFAULT TRUE,
    matched_issue_id INT REFERENCES issues(id) ON DELETE SET NULL,
    ai_dedup_verdict JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Reports (Image 4 Survey Reports)
CREATE TABLE IF NOT EXISTS reports (
    id SERIAL PRIMARY KEY,
    entity_id INT REFERENCES entities(id) ON DELETE CASCADE,
    entity_name VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    cycle_label VARCHAR(100), -- e.g. "Cycle 6 • 30 Aug 2026 - 13 Sep 2026"
    cycle_number INT DEFAULT 1,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    completed_count INT DEFAULT 0,
    missed_count INT DEFAULT 0,
    issues_count INT DEFAULT 0,
    status VARCHAR(50) DEFAULT 'completed',
    download_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
