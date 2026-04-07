import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
import PyPDF2

from app.database import get_db
from app.models.recruitment import JobPosting, Candidate
from app.schemas.recruitment import JobPostingCreate, JobPosting as JobPostingSchema, JobPostingWithCandidates, CandidateCreate, Candidate as CandidateSchema, CandidateUpdateStage
# from app.dependencies import get_current_user
from app.ai.gemini_client import score_resume_against_job

router = APIRouter()
UPLOAD_DIR = "uploads/resumes"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/jobs", response_model=JobPostingSchema)
def create_job_posting(job: JobPostingCreate, db: Session = Depends(get_db)):
    new_job = JobPosting(**job.model_dump())
    db.add(new_job)
    db.commit()
    db.refresh(new_job)
    return new_job

@router.get("/jobs", response_model=list[JobPostingWithCandidates])
def get_jobs(db: Session = Depends(get_db)):
    return db.query(JobPosting).all()

@router.post("/candidates", response_model=CandidateSchema)
def add_candidate(candidate: CandidateCreate, db: Session = Depends(get_db)):
    new_cand = Candidate(**candidate.model_dump())
    db.add(new_cand)
    db.commit()
    db.refresh(new_cand)
    return new_cand

@router.get("/candidates", response_model=list[CandidateSchema])
def get_candidates(db: Session = Depends(get_db)):
    return db.query(Candidate).all()

@router.post("/candidates/{cand_id}/upload-resume")
def upload_candidate_resume(cand_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    cand = db.query(Candidate).filter(Candidate.id == cand_id).first()
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found")
        
    file_location = f"{UPLOAD_DIR}/{cand_id}_{file.filename}"
    with open(file_location, "wb+") as file_object:
        shutil.copyfileobj(file.file, file_object)
        
    cand.resume_path = file_location
    db.commit()
    return {"info": f"Resume '{file.filename}' saved"}

@router.post("/candidates/{cand_id}/score")
def score_candidate(cand_id: int, db: Session = Depends(get_db)):
    cand = db.query(Candidate).filter(Candidate.id == cand_id).first()
    if not cand or not cand.resume_path:
        raise HTTPException(status_code=404, detail="Candidate or resume not found")
    
    job = cand.job_posting
    if not job:
         raise HTTPException(status_code=404, detail="Job posting attached to candidate not found")
         
    try:
        resume_text = ""
        with open(cand.resume_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            for page in reader.pages:
                resume_text += page.extract_text() + "\n"
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not read resume: {str(e)}")
        
    ai_result = score_resume_against_job(resume_text, job.role, job.description, job.skills_required)
    
    cand.ai_score = ai_result.get("score")
    cand.ai_strengths = ai_result.get("strengths")
    cand.ai_gaps = ai_result.get("gaps")
    if isinstance(ai_result.get("interview_questions"), list):
        cand.ai_interview_questions = "\n".join(ai_result.get("interview_questions"))
    else:
        cand.ai_interview_questions = str(ai_result.get("interview_questions"))
        
    db.commit()
    return cand

@router.patch("/candidates/{cand_id}/stage", response_model=CandidateSchema)
def update_candidate_stage(cand_id: int, stage_update: CandidateUpdateStage, db: Session = Depends(get_db)):
    cand = db.query(Candidate).filter(Candidate.id == cand_id).first()
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found")
    cand.stage = stage_update.stage
    db.commit()
    db.refresh(cand)
    return cand
