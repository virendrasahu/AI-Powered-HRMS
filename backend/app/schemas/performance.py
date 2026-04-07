from pydantic import BaseModel
from typing import Optional
from datetime import date

class PromotionCycleBase(BaseModel):
    name: str
    start_date: date
    end_date: date

class PromotionCycleCreate(PromotionCycleBase):
    pass

class PromotionCycle(PromotionCycleBase):
    id: int

    class Config:
        from_attributes = True

class PerformanceReviewBase(BaseModel):
    employee_id: int
    cycle_id: int

class PerformanceReviewCreate(PerformanceReviewBase):
    pass

class PerformanceReviewUpdateSelf(BaseModel):
    self_rating: int
    self_comments: str

class PerformanceReviewUpdateManager(BaseModel):
    manager_rating: int
    manager_comments: str

class PerformanceReview(PerformanceReviewBase):
    id: int
    self_rating: Optional[int] = None
    self_comments: Optional[str] = None
    manager_rating: Optional[int] = None
    manager_comments: Optional[str] = None
    
    ai_perf_summary: Optional[str] = None
    ai_rating_mismatch: Optional[str] = None
    ai_suggestions: Optional[str] = None

    class Config:
        from_attributes = True
