import os
import datetime
from typing import Optional, List
from fastapi import FastAPI, HTTPException, Depends, status, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
import jwt
import bcrypt
from sqlalchemy import create_engine, Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker, Session

# Environment / Config
SECRET_KEY = os.getenv("SECRET_KEY", "collector-secret-key-super-secure-2026")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./farmai.db")

# Setup DB
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# User Model
class AuthUser(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), default="citizen", nullable=False) # 'collector', 'citizen', 'field_officer', 'hod', 'admin'
    phone = Column(String(50), nullable=True)
    title = Column(String(100), nullable=True)
    department = Column(String(100), nullable=True)
    district = Column(String(100), default="Yadadri Bhuvanagiri", nullable=False)
    mandal = Column(String(100), nullable=True)
    sites_assigned_count = Column(Integer, default=0)
    assigned_site_name = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Pydantic Schemas
class UserRegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: str = "citizen" # 'collector' or 'citizen'
    phone: Optional[str] = None
    district: Optional[str] = "Yadadri Bhuvanagiri"
    mandal: Optional[str] = None
    department: Optional[str] = None
    title: Optional[str] = None

class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    phone: Optional[str] = None
    title: Optional[str] = None
    department: Optional[str] = None
    district: str
    mandal: Optional[str] = None
    sites_assigned_count: int = 0
    assigned_site_name: Optional[str] = None
    is_active: bool = True
    created_at: Optional[datetime.datetime] = None

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# Helpers
def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8")[:72], hashed_password.encode("utf-8"))
    except Exception:
        return False

def hash_password(password: str) -> str:
    pwd_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")

def create_access_token(data: dict, expires_delta: Optional[datetime.timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.datetime.utcnow() + (expires_delta or datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")

# FastAPI App
app = FastAPI(
    title="FIMMS Auth Microservice",
    description="Independent Authentication & User Registration Microservice for Collector and Citizen roles.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "healthy", "service": "auth_service", "port": 8001}

@app.post("/api/v1/auth/register", response_model=TokenResponse)
def register(req: UserRegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(AuthUser).filter(AuthUser.email == req.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="A user with this email already exists.")
    
    role = req.role.lower().strip()
    if role not in ["collector", "citizen", "field_officer", "hod", "admin"]:
        role = "citizen"
        
    user = AuthUser(
        email=req.email,
        hashed_password=hash_password(req.password),
        full_name=req.full_name,
        role=role,
        phone=req.phone,
        district=req.district or "Yadadri Bhuvanagiri",
        mandal=req.mandal,
        department=req.department,
        title=req.title or ("District Collector" if role == "collector" else "Citizen")
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({
        "sub": user.email,
        "id": user.id,
        "role": user.role,
        "name": user.full_name,
        "district": user.district
    })

    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))

@app.post("/api/v1/auth/login", response_model=TokenResponse)
def login(req: UserLoginRequest, db: Session = Depends(get_db)):
    user = db.query(AuthUser).filter(AuthUser.email == req.email).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    token = create_access_token({
        "sub": user.email,
        "id": user.id,
        "role": user.role,
        "name": user.full_name,
        "district": user.district
    })

    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))

@app.get("/api/v1/auth/verify")
def verify_token_endpoint(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    token = authorization.split(" ")[1]
    payload = decode_token(token)
    email = payload.get("sub")
    user = db.query(AuthUser).filter(AuthUser.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"valid": True, "user": UserResponse.model_validate(user)}

@app.get("/api/v1/auth/me", response_model=UserResponse)
def get_current_user_profile(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication required")
    token = authorization.split(" ")[1]
    payload = decode_token(token)
    user = db.query(AuthUser).filter(AuthUser.email == payload.get("sub")).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserResponse.model_validate(user)

@app.get("/api/v1/auth/users", response_model=List[UserResponse])
def list_users(role: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(AuthUser)
    if role and role != "all":
        q = q.filter(AuthUser.role == role)
    return [UserResponse.model_validate(u) for u in q.all()]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
