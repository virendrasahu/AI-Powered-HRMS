from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
import json

from app.database import get_db
from app.models.employee import Employee
from app.models.leave import Leave
# from app.dependencies import get_current_user
from app.ai.gemini_client import generate_analytics_insights

router = APIRouter()

@router.get("/summary")
def get_analytics_summary(db: Session = Depends(get_db)):
    headcount = db.query(Employee).count()
    depts = db.query(Employee.department, func.count(Employee.id)).group_by(Employee.department).all()
    headcount_by_dept = {dept: count for dept, count in depts if dept}
    
    total_leaves = db.query(Leave).count()
    
    stats = {
        "total_headcount": headcount,
        "department_distribution": headcount_by_dept,
        "total_leaves_applied": total_leaves,
    }

    # Generate AI insights with safe fallback
    ai_insights = generate_analytics_insights(stats)

    return {
        "headcount": headcount,
        "headcount_by_department": headcount_by_dept,
        "total_leaves_applied": total_leaves,
        "ai_insights_summary": ai_insights
    }
