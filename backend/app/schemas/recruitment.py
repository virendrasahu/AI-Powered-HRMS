from pydantic import BaseModel
from typing import Optional, List

class JobPostingBase(BaseModel):
    role: str
    description: str
    skills_required: str
    experience: str

class JobPostingCreate(JobPostingBase):
    pass

class JobPosting(JobPostingBase):
    id: int

    class Config:
        from_attributes = True

class CandidateBase(BaseModel):
    name: str
    email: str
    phone: str
    job_posting_id: int

class CandidateCreate(CandidateBase):
    pass

class CandidateUpdateStage(BaseModel):
    stage: str

class Candidate(CandidateBase):
    id: int
    stage: str
    resume_path: Optional[str] = None
    ai_score: Optional[int] = None
    ai_strengths: Optional[str] = None
    ai_gaps: Optional[str] = None
    ai_interview_questions: Optional[str] = None

    class Config:
        from_attributes = True

class JobPostingWithCandidates(JobPosting):
    candidates: List[Candidate] = []
