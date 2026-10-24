# 🏛️ FIMMS — Collector's Unified Application

**Field Inspection & Monitoring Management System** for District Collectors / Magistrates and Citizens.

AI-powered civic intelligence platform with **Google Gemini RAG** (switchable to **AWS Bedrock**), interactive **district problem map**, automated **News API deduplication**, and full **citizen grievance** redressal.

---

## 🏗️ Architecture — Microservices

```
FIMMS System
├── 🔐 Auth Microservice        (port 8001)  — Registration, Login, JWT, role management
├── 🤖 AI/RAG Microservice      (port 8002)  — Gemini embeddings, pgvector HNSW, dedup, RAG query
├── ⚙️  Core Backend FastAPI    (port 8000)  — Entities, Complaints, Collector, Reports, News
└── 🌐 React Frontend + Nginx  (port 80)    — FIMMS UI (Dashboard, Map, Entities, Users, Reports)
```

---

## 🌟 Key Features

| Feature | Description |
|---|---|
| **Dual Role** | District Collector (FIMMS Suite) vs Citizen (Grievance Portal) |
| **AI RAG Deduplication** | Gemini / Bedrock identifies only **unique** tasks from News API + complaints |
| **pgvector HNSW** | PostgreSQL vector indexing for ultra-fast semantic nearest-neighbor search |
| **Live Provider Switch** | Toggle between Gemini and Bedrock live from the dashboard |
| **District Map** | Leaflet/OSM map with geotagged issues, mandal boundaries, severity pins |
| **Entities Board** | Survey entity cards (Screenshot 1 exact match) |
| **Dashboard Scorecard** | KPI tiles + Issue Breakdown + District Mandal Scorecard (Screenshot 2) |
| **User Management** | Field Officers, HODs, Admins with assignment status (Screenshot 3) |
| **Survey Reports** | Cycle-based inspection report history with download (Screenshot 4) |
| **Citizen Grievance** | Lodge → AI Triage → Map Pin → Redressal Tracking |
| **News Wire Ingestion** | Fetch, embed, deduplicate live district news into unique tasks |

---

## 🚀 Quick Start — Local Development (No Docker)

### Prerequisites
- Python 3.11+ (tested on 3.14)
- Node.js 18+
- `venv` already set up in `./venv/`

### 1. Configure Environment

```bash
cp .env.example .env
# Edit .env — at minimum add:
# GEMINI_API_KEY=your_gemini_api_key_here
```

### 2. One-command startup

```bash
chmod +x start_dev.sh
./start_dev.sh
```

This automatically:
- Seeds the SQLite database with entities, 19 mandals, 16 users, issues, and reports
- Starts Core Backend on `http://localhost:8000`
- Starts Auth Microservice on `http://localhost:8001`
- Starts AI/RAG Microservice on `http://localhost:8002`
- Starts React Frontend on `http://localhost:5173`

### Demo Login Credentials

| Role | Email | Password |
|------|-------|----------|
| **Collector** | collector@fimms.gov.in | admin123 |
| **Citizen** | citizen@fimms.gov.in | citizen123 |
| **Field Officer** | alivelu@fimms.gov.in | admin123 |

> You can also use the quick-fill demo buttons on the Login page.

---

## 🐳 Docker Compose — Full Production Mode

### Prerequisites
- Docker Desktop
- Docker Compose v2+

### 1. Configure

```bash
cp .env.example .env
# Add GEMINI_API_KEY (and optionally AWS keys for Bedrock)
```

### 2. Launch all 5 services

```bash
docker compose up --build -d
```

Services launched:
| Container | Port | Description |
|---|---|---|
| `fimms-postgres` | 5432 | PostgreSQL 16 with pgvector extension |
| `fimms-auth` | 8001 | Auth Microservice |
| `fimms-ai` | 8002 | AI/RAG Deduplication Microservice |
| `fimms-backend` | 8000 | Core FastAPI Backend |
| `fimms-frontend` | 80 | React + Nginx |

### 3. Access

- **FIMMS App:** http://localhost
- **Core API Docs:** http://localhost:8000/docs
- **Auth API Docs:** http://localhost:8001/docs
- **AI API Docs:** http://localhost:8002/docs

### 4. Stop

```bash
docker compose down
docker compose down -v   # also removes database volume
```

---

## 🔑 API Reference

### Auth Microservice (Port 8001)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/auth/register` | Register new Collector or Citizen |
| `POST` | `/api/v1/auth/login` | Login and get JWT token |
| `GET` | `/api/v1/auth/me` | Get current user profile |
| `GET` | `/api/v1/auth/verify` | Verify token validity |

### Core Backend (Port 8000)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/collector/dashboard-stats` | KPIs + breakdown + scorecard |
| `GET` | `/api/v1/collector/entities` | All monitoring entities |
| `POST` | `/api/v1/collector/entities` | Create new entity |
| `GET` | `/api/v1/collector/users/summary` | User management with KPIs |
| `GET` | `/api/v1/collector/reports` | Survey reports by cycle |
| `GET` | `/api/v1/collector/issues` | List unique collector tasks |
| `PATCH`| `/api/v1/collector/issues/{id}` | Update issue status |
| `GET` | `/api/v1/collector/map-data` | All geo data for district map |
| `POST` | `/api/v1/complaints` | Submit citizen grievance (triggers AI dedup) |
| `POST` | `/api/v1/news/triage-wire` | Run AI news deduplication pipeline |
| `POST` | `/api/v1/rag/query` | Strategic RAG assistant query |
| `GET` | `/api/v1/rag/provider` | Get active LLM provider |
| `POST` | `/api/v1/rag/provider` | Switch between Gemini ↔ Bedrock |

### AI Microservice (Port 8002)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/ai/provider-status` | Gemini + Bedrock config status |
| `POST` | `/api/v1/ai/switch-provider` | Switch active LLM |
| `POST` | `/api/v1/ai/triage` | Deduplicate a single event |
| `POST` | `/api/v1/ai/process-news-feed` | Batch process news articles |
| `POST` | `/api/v1/ai/rag-assistant` | RAG query with vector context |
| `POST` | `/api/v1/ai/index-issue` | Index a new issue embedding |

---

## 🤖 Switching LLM Provider

### Default: Google Gemini
Set in `.env`:
```
LLM_PROVIDER=gemini
GEMINI_API_KEY=your_api_key
```

### Switch to AWS Bedrock
```
LLM_PROVIDER=bedrock
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=ap-south-1
BEDROCK_MODEL_ID=anthropic.claude-3-haiku-20240307-v1:0
```

### Live Switch (no restart needed)
From the **FIMMS Dashboard → AI Triage & RAG tab**, click the provider toggle (Gemini / AWS Bedrock) or call:
```bash
curl -X POST http://localhost:8000/api/v1/rag/provider \
  -H "Content-Type: application/json" \
  -d '{"provider":"bedrock"}'
```

---

## 📊 Database Schema

- **PostgreSQL + pgvector** in production
- **SQLite** for local development (auto-seeded)
- HNSW index on `issue_embeddings.embedding` for O(log n) vector search
- 768-dimensional embeddings (Google `text-embedding-004` / Titan Text v2)

See `schema_postgres.sql` for the full production schema.

---

## 📁 Project Structure

```
farmai/
├── backend/                    # Core FastAPI backend microservice (port 8000)
│   ├── main.py                 # FastAPI app + lifespan seeder
│   ├── models.py               # SQLAlchemy ORM models
│   ├── schemas.py              # Pydantic request/response schemas
│   ├── auth.py                 # bcrypt + JWT helpers
│   ├── config.py               # Environment settings
│   ├── seed_data.py            # DB seeder (entities, mandals, users, reports)
│   └── routes/
│       ├── auth_routes.py      # /auth/* endpoints
│       ├── collector_routes.py # /collector/* dashboard, entities, map, users
│       ├── complaints_routes.py# /complaints/* with AI triage
│       ├── news_routes.py      # /news/* with live wire & dedup
│       └── rag_routes.py       # /rag/* query + provider switch
├── services/
│   ├── auth_service/           # Independent Auth Microservice (port 8001)
│   │   ├── main.py             # FastAPI app with bcrypt + JWT
│   │   └── Dockerfile
│   └── ai_service/             # AI/RAG Microservice (port 8002)
│       ├── main.py             # Provider registry, triage, RAG endpoints
│       ├── vector_store.py     # pgvector HNSW + in-memory cosine fallback
│       ├── news_crawler.py     # NewsAPI + curated district news wire
│       ├── providers/
│       │   ├── base.py         # Abstract LLM provider interface
│       │   ├── gemini_provider.py   # Gemini 1.5 Flash + text-embedding-004
│       │   └── bedrock_provider.py  # Claude 3 Haiku + Titan Embed v2
│       └── Dockerfile
├── frontend/                   # React 18 + Vite + Tailwind CSS
│   └── src/
│       ├── App.jsx             # Root routing (Collector/Citizen)
│       ├── pages/
│       │   ├── LoginPage.jsx           # Dual-role login + register
│       │   ├── DashboardPage.jsx       # KPIs + scorecard + map + AI triage
│       │   ├── EntitiesPage.jsx        # Entity cards (Screenshot 1)
│       │   ├── UserManagementPage.jsx  # Field Officers + HODs (Screenshot 3)
│       │   ├── ReportsPage.jsx         # Survey reports (Screenshot 4)
│       │   └── CitizenDashboard.jsx    # Citizen grievance portal + map
│       ├── components/
│       │   ├── Header.jsx              # FIMMS nav bar + role switcher
│       │   ├── DistrictMap.jsx         # Leaflet district problem map
│       │   └── AiTriageDrawer.jsx      # News triage + RAG assistant
│       └── services/
│           └── api.js                 # Axios API client
├── schema_postgres.sql         # Full PostgreSQL + pgvector schema
├── docker-compose.yml          # All 5 services
├── nginx.conf                  # Reverse proxy for all microservices
├── start_dev.sh                # One-command local dev launcher
└── .env.example                # Environment variable template
```

---

## 🔐 Roles & Access

| Role | Access Level |
|------|-------------|
| `collector` | Full FIMMS Suite — all 4 tabs, AI triage, provider switch |
| `field_officer` | Full FIMMS Suite (same as collector) |
| `hod` | Full FIMMS Suite (same as collector) |
| `admin` | Full FIMMS Suite (same as collector) |
| `citizen` | Citizen Grievance Portal — Lodge, Track, District Map |

---

## ⚡ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, Lucide Icons, react-leaflet |
| Backend | FastAPI 0.143, Python 3.11+, SQLAlchemy 2 |
| Database | PostgreSQL 16 + pgvector (HNSW index), SQLite (dev) |
| AI/LLM | Google Gemini 1.5 Flash (default) / AWS Bedrock Claude 3 |
| Embeddings | text-embedding-004 (Gemini) / Titan Embed v2 (Bedrock) |
| Vector Search | pgvector HNSW (cosine distance) |
| Auth | bcrypt + PyJWT (HS256, 7-day expiry) |
| Maps | Leaflet + OpenStreetMap |
| Containerization | Docker, Docker Compose, Nginx |
