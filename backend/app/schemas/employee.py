from pydantic import BaseModel
from typing import Optional
from datetime import date

class EmployeeBase(BaseModel):
    name: str
    designation: str
    department: str
    joining_date: date
    manager: Optional[str] = None
    contact: str
    skills: str

class EmployeeCreate(EmployeeBase):
    pass

class EmployeeUpdate(BaseModel):
    name: Optional[str] = None
    designation: Optional[str] = None
    department: Optional[str] = None
    joining_date: Optional[date] = None
    manager: Optional[str] = None
    contact: Optional[str] = None
    skills: Optional[str] = None

class Employee(EmployeeBase):
    id: int
    bio: Optional[str] = None
    document_path: Optional[str] = None

    class Config:
        from_attributes = True

class EmployeeBioQuery(BaseModel):
    employee_id: int
    
class EmployeeCompletenessResponse(BaseModel):
    is_complete: bool
    missing_fields: list[str]
