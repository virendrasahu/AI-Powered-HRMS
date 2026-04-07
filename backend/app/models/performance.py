from sqlalchemy import Column, Integer, String, Text, ForeignKey, Date
from sqlalchemy.orm import relationship
from app.database import Base

class PromotionCycle(Base):
    __tablename__ = "promotion_cycles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True) # e.g. H1 2024 Review
    start_date = Column(Date)
    end_date = Column(Date)

    reviews = relationship("PerformanceReview", back_populates="cycle")

class PerformanceReview(Base):
    __tablename__ = "performance_reviews"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"))
    cycle_id = Column(Integer, ForeignKey("promotion_cycles.id"))
    
    self_rating = Column(Integer, nullable=True) # e.g. 1-5
    self_comments = Column(Text, nullable=True)
    
    manager_rating = Column(Integer, nullable=True)
    manager_comments = Column(Text, nullable=True)

    ai_perf_summary = Column(Text, nullable=True)
    ai_rating_mismatch = Column(String, nullable=True)
    ai_suggestions = Column(Text, nullable=True)

    cycle = relationship("PromotionCycle", back_populates="reviews")
