from sqlalchemy import Column, Integer, String, Text, ForeignKey, Date
from sqlalchemy.orm import relationship
from app.database import Base

class JobPosting(Base):
    __tablename__ = "job_postings"

    id = Column(Integer, primary_key=True, index=True)
    role = Column(String, index=True)
    description = Column(Text)
    skills_required = Column(String)
    experience = Column(String)
    
    candidates = relationship("Candidate", back_populates="job_posting")


class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, index=True)
    phone = Column(String)
    resume_path = Column(String)
    job_posting_id = Column(Integer, ForeignKey("job_postings.id"))
    stage = Column(String, default="Applied") # Applied, Screening, Interview, Offer, Hired, Rejected
    ai_score = Column(Integer, nullable=True) # AI scored against JD
    ai_strengths = Column(Text, nullable=True)
    ai_gaps = Column(Text, nullable=True)
    ai_interview_questions = Column(Text, nullable=True)

    job_posting = relationship("JobPosting", back_populates="candidates")
