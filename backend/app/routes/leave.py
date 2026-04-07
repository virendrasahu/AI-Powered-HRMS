from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
import json

from app.database import get_db
from app.models.leave import Leave, Attendance
from app.schemas.leave import LeaveCreate, LeaveUpdateStatus, Leave as LeaveSchema, AttendanceCreate, Attendance as AttendanceSchema
# from app.dependencies import get_current_user
from app.ai.gemini_client import model

router = APIRouter()

@router.post("/", response_model=LeaveSchema)
def apply_leave(leave: LeaveCreate, db: Session = Depends(get_db)):
    new_leave = Leave(**leave.model_dump())
    db.add(new_leave)
    db.commit()
    db.refresh(new_leave)
    return new_leave

@router.get("/", response_model=list[LeaveSchema])
def get_all_leaves(db: Session = Depends(get_db)):
    return db.query(Leave).all()

@router.patch("/{leave_id}/status", response_model=LeaveSchema)
def update_leave_status(leave_id: int, status_update: LeaveUpdateStatus, db: Session = Depends(get_db)):
    leave = db.query(Leave).filter(Leave.id == leave_id).first()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave not found")
    leave.status = status_update.status
    db.commit()
    db.refresh(leave)
    return leave

@router.get("/employee/{employee_id}/balance")
def get_leave_balance(employee_id: int, db: Session = Depends(get_db)):
    # Simple logic: assume 20 days standard quota
    total_approved = db.query(func.sum(Leave.end_date - Leave.start_date)).filter(Leave.employee_id == employee_id, Leave.status == "Approved").scalar()
    # Note: SQLite date diffing needs more care in prod but this simulates the concept.
    return {"employee_id": employee_id, "used_leaves_est": total_approved or 0, "total_quota": 20}

@router.post("/attendance", response_model=AttendanceSchema)
def mark_attendance(att: AttendanceCreate, db: Session = Depends(get_db)):
    new_att = Attendance(**att.model_dump())
    db.add(new_att)
    db.commit()
    db.refresh(new_att)
    return new_att

@router.get("/employee/{employee_id}/risk")
def predict_leave_risk(employee_id: int, db: Session = Depends(get_db)):
    # AI Feature: Detect unusual leave patterns
    leaves = db.query(Leave).filter(Leave.employee_id == employee_id).all()
    leave_data = [{"start": str(l.start_date), "end": str(l.end_date), "reason": l.reason} for l in leaves]
    
    prompt = f"""
    Analyze the following leave history for an employee:
    {json.dumps(leave_data)}
    
    Based on this data, does the employee show an unusual leave pattern that creates a team availability risk? 
    Reply strictly in JSON:
    {{"risk_level": "Low/Medium/High", "reason": "short explanation"}}
    """
    try:
        response = model.generate_content(prompt)
        text = response.text.strip()
        if text.startswith("```json"): text = text[7:-3]
        elif text.startswith("```"): text = text[3:-3]
        return json.loads(text)
    except Exception as e:
        return {"risk_level": "Unknown", "reason": str(e)}
