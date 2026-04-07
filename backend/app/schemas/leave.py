from pydantic import BaseModel
from typing import Optional
from datetime import date

class LeaveBase(BaseModel):
    employee_id: int
    start_date: date
    end_date: date
    leave_type: str
    reason: str

class LeaveCreate(LeaveBase):
    pass

class LeaveUpdateStatus(BaseModel):
    status: str

class Leave(LeaveBase):
    id: int
    status: str

    class Config:
        from_attributes = True

class AttendanceBase(BaseModel):
    employee_id: int
    date: date
    status: str

class AttendanceCreate(AttendanceBase):
    pass

class Attendance(AttendanceBase):
    id: int

    class Config:
        from_attributes = True
