from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    DATABASE_URL: Optional[str] = None
    JWT_SECRET_KEY: str = "dev-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days (10080 mins) instead of 1 day to prevent sudden logouts
    FRONTEND_URL: str = "http://localhost:3000"

    @property
    def database_url(self) -> str:
        if self.DATABASE_URL:
            # Fix driver prefix for async SQLAlchemy if provided as standard postgresql://
            url = self.DATABASE_URL
            if url.startswith("postgresql://"):
                url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
            elif url.startswith("postgres://"):
                url = url.replace("postgres://", "postgresql+asyncpg://", 1)
            return url
        
        # SQLite fallback for local development
        return "sqlite+aiosqlite:///./fingrow.db"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
