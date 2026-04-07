from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.performance import PromotionCycle, PerformanceReview
from app.schemas.performance import PromotionCycleCreate, PromotionCycle as PromotionCycleSchema, PerformanceReviewCreate, PerformanceReview as PerformanceReviewSchema, PerformanceReviewUpdateSelf, PerformanceReviewUpdateManager
# from app.dependencies import get_current_user
from app.ai.gemini_client import generate_performance_summary

router = APIRouter()

@router.post("/cycles", response_model=PromotionCycleSchema)
def create_cycle(cycle: PromotionCycleCreate, db: Session = Depends(get_db)):
    new_cycle = PromotionCycle(**cycle.model_dump())
    db.add(new_cycle)
    db.commit()
    db.refresh(new_cycle)
    return new_cycle

@router.post("/reviews", response_model=PerformanceReviewSchema)
def create_review(review: PerformanceReviewCreate, db: Session = Depends(get_db)):
    new_rev = PerformanceReview(**review.model_dump())
    db.add(new_rev)
    db.commit()
    db.refresh(new_rev)
    return new_rev

@router.patch("/reviews/{rev_id}/self", response_model=PerformanceReviewSchema)
def update_self_review(rev_id: int, review_update: PerformanceReviewUpdateSelf, db: Session = Depends(get_db)):
    rev = db.query(PerformanceReview).filter(PerformanceReview.id == rev_id).first()
    if not rev:
        raise HTTPException(status_code=404, detail="Review not found")
        
    rev.self_rating = review_update.self_rating
    rev.self_comments = review_update.self_comments
    db.commit()
    db.refresh(rev)
    return rev

@router.patch("/reviews/{rev_id}/manager", response_model=PerformanceReviewSchema)
def update_manager_review(rev_id: int, review_update: PerformanceReviewUpdateManager, db: Session = Depends(get_db)):
    rev = db.query(PerformanceReview).filter(PerformanceReview.id == rev_id).first()
    if not rev:
        raise HTTPException(status_code=404, detail="Review not found")
        
    rev.manager_rating = review_update.manager_rating
    rev.manager_comments = review_update.manager_comments
    
    # Generate AI summary now that both are filled
    if rev.self_rating and rev.manager_rating:
        ai_res = generate_performance_summary(
            rev.self_rating, rev.self_comments or "",
            rev.manager_rating, rev.manager_comments or ""
        )
        rev.ai_perf_summary = ai_res.get("summary")
        rev.ai_rating_mismatch = ai_res.get("rating_mismatch")
        if isinstance(ai_res.get("suggestions"), list):
            rev.ai_suggestions = "\n".join(ai_res.get("suggestions"))
        else:
            rev.ai_suggestions = str(ai_res.get("suggestions"))
            
    db.commit()
    db.refresh(rev)
    return rev

@router.get("/reviews/{rev_id}", response_model=PerformanceReviewSchema)
def get_review(rev_id: int, db: Session = Depends(get_db)):
    rev = db.query(PerformanceReview).filter(PerformanceReview.id == rev_id).first()
    if not rev:
        raise HTTPException(status_code=404, detail="Review not found")
    return rev
@router.get("/reviews", response_model=list[PerformanceReviewSchema])
def get_all_reviews(db: Session = Depends(get_db)):
    return db.query(PerformanceReview).all()

@router.get("/cycles", response_model=list[PromotionCycleSchema])
def get_all_cycles(db: Session = Depends(get_db)):
    return db.query(PromotionCycle).all()
