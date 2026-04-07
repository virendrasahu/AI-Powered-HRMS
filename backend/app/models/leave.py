from sqlalchemy import Column, Integer, String, Date, ForeignKey
from app.database import Base

class Leave(Base):
    __tablename__ = "leaves"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"))
    start_date = Column(Date)
    end_date = Column(Date)
    leave_type = Column(String) # Sick, Casual, Earned
    reason = Column(String)
    status = Column(String, default="Pending") # Pending, Approved, Rejected

class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"))
    date = Column(Date)
    status = Column(String) # Present, Absent, Half-Day
