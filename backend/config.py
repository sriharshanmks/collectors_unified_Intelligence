import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "FIMMS - Collector's Unified Application"
    API_V1_STR: str = "/api/v1"
    
    # Database (PostgreSQL with pgvector in prod, or SQLite in local dev)
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./farmai.db")
    
    # JWT Auth
    SECRET_KEY: str = os.getenv("SECRET_KEY", "fimms-collector-super-secret-key-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # LLM Provider Configuration ('gemini' by default, switchable to 'bedrock')
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "gemini")
    
    # Google Gemini Settings
    GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY", None)
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
    GEMINI_EMBEDDING_MODEL: str = os.getenv("GEMINI_EMBEDDING_MODEL", "text-embedding-004")
    
    # AWS Region (Mumbai is ap-south-1)
    AWS_REGION: str = os.getenv("AWS_REGION", "ap-south-1")
    AWS_ACCESS_KEY_ID: Optional[str] = os.getenv("AWS_ACCESS_KEY_ID", None)
    AWS_SECRET_ACCESS_KEY: Optional[str] = os.getenv("AWS_SECRET_ACCESS_KEY", None)
    
    # Amazon Bedrock Settings
    BEDROCK_REGION: Optional[str] = os.getenv("BEDROCK_REGION", None)
    BEDROCK_MODEL_ID: str = os.getenv("BEDROCK_MODEL_ID", "anthropic.claude-3-haiku-20240307-v1:0")
    
    # Amazon S3 Bucket
    S3_BUCKET_NAME: Optional[str] = os.getenv("S3_BUCKET_NAME", None)
    S3_REGION: Optional[str] = os.getenv("S3_REGION", None)
    
    # NewsAPI
    NEWS_API_KEY: Optional[str] = os.getenv("NEWS_API_KEY", None)
    
    # Uploads Fallback Directory
    UPLOAD_DIR: str = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")

    @property
    def effective_bedrock_region(self) -> str:
        return self.BEDROCK_REGION or self.AWS_REGION

    @property
    def effective_s3_region(self) -> str:
        return self.S3_REGION or self.AWS_REGION

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
