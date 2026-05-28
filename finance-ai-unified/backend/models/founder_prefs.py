from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime
from database import Base

class FounderPreference(Base):
    __tablename__ = "founder_preferences"
    
    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, index=True, nullable=False)  # e.g., "risk_appetite", "growth_focus"
    value = Column(String, nullable=False)  # e.g., "conservative", "aggressive"
    description = Column(String, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
