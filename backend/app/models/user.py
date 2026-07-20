from sqlalchemy import Column, Integer, String, Float, DateTime, func
from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    preferred_currency = Column(String(10), default="INR")
    monthly_income_target = Column(Float, default=0.0)
    monthly_savings_target = Column(Float, default=0.0)
    points = Column(Integer, default=0)
    profile_image = Column(String(500), nullable=True)
    notify_in_app = Column(Integer, default=1)  # boolean as int for SQLite
    notify_browser = Column(Integer, default=0)
    theme = Column(String(20), default="light")
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
