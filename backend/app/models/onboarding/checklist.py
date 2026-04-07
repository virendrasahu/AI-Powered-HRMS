from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from app.database import Base

class OnboardingChecklist(Base):
    __tablename__ = "onboarding_checklists"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"))
    task = Column(String)
    assignee = Column(String)
    due_date = Column(String)
    status = Column(String, default="Pending") # Pending, In-Progress, Done
