import io
import os
import shutil

import pandas as pd
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.ai.gemini_client import generate_employee_bio

from app.database import get_db
from app.models.employee import Employee
from app.schemas.employee import EmployeeCreate, EmployeeUpdate, Employee as EmployeeSchema, EmployeeCompletenessResponse

router = APIRouter()

UPLOAD_DIR = "uploads/employees"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/", response_model=EmployeeSchema)
def create_employee(employee: EmployeeCreate, db: Session = Depends(get_db)):
    # Check for duplicates by name or contact
    existing = db.query(Employee).filter(
        or_(Employee.name == employee.name, Employee.contact == employee.contact)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Employee with this name or contact already exists (Duplicate detection)")

    new_emp = Employee(**employee.model_dump())
    db.add(new_emp)
    db.commit()
    db.refresh(new_emp)
    return new_emp

@router.get("/", response_model=list[EmployeeSchema])
def get_employees(search: str = None, department: str = None, db: Session = Depends(get_db)):
    query = db.query(Employee)
    if search:
        query = query.filter(or_(
            Employee.name.ilike(f"%{search}%"),
            Employee.skills.ilike(f"%{search}%")
        ))
    if department:
        query = query.filter(Employee.department == department)
    return query.all()

@router.get("/{emp_id}", response_model=EmployeeSchema)
def get_employee(emp_id: int, db: Session = Depends(get_db)):
    emp = db.query(Employee).filter(Employee.id == emp_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    return emp

@router.post("/{emp_id}/upload-document")
def upload_employee_document(emp_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    emp = db.query(Employee).filter(Employee.id == emp_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
        
    file_location = f"{UPLOAD_DIR}/{emp_id}_{file.filename}"
    with open(file_location, "wb+") as file_object:
        shutil.copyfileobj(file.file, file_object)
        
    emp.document_path = file_location
    db.commit()
    return {"info": f"file '{file.filename}' saved at '{file_location}'"}

@router.post("/{emp_id}/generate-bio")
def generate_bio(emp_id: int, db: Session = Depends(get_db)):
    emp = db.query(Employee).filter(Employee.id == emp_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
        
    bio = generate_employee_bio(emp.name, emp.designation, emp.department, emp.skills)
    emp.bio = bio
    db.commit()
    return {"bio": bio}

@router.get("/{emp_id}/check-completeness", response_model=EmployeeCompletenessResponse)
def check_completeness(emp_id: int, db: Session = Depends(get_db)):
    emp = db.query(Employee).filter(Employee.id == emp_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
        
    missing = []
    if not emp.contact: missing.append("contact")
    if not emp.skills: missing.append("skills")
    if not emp.manager: missing.append("manager")
    if not emp.bio: missing.append("bio")
    if not emp.document_path: missing.append("document_path")
    
    return EmployeeCompletenessResponse(
        is_complete=len(missing) == 0,
        missing_fields=missing
    )
@router.get("/export/csv")
def export_employees_csv(db: Session = Depends(get_db)):
    emps = db.query(Employee).all()
    data = []
    for e in emps:
        data.append({
            "Name": e.name,
            "Designation": e.designation,
            "Department": e.department,
            "Joining Date": e.joining_date,
            "Manager": e.manager,
            "Contact": e.contact,
            "Skills": e.skills
        })
    df = pd.DataFrame(data)
    stream = io.StringIO()
    df.to_csv(stream, index=False)
    response = StreamingResponse(iter([stream.getvalue()]), media_type="text/csv")
    response.headers["Content-Disposition"] = "attachment; filename=employees_export.csv"
    return response

@router.delete("/{emp_id}")
def deactivate_employee(emp_id: int, db: Session = Depends(get_db)):
    emp = db.query(Employee).filter(Employee.id == emp_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    db.delete(emp)
    db.commit()
    return {"message": "Employee deleted (deactivated)"}
