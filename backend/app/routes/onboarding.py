import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.onboarding.checklist import OnboardingChecklist
from app.ai.rag_chatbot import load_document_to_knowledge_base, ask_onboarding_question

router = APIRouter()
UPLOAD_DIR = "uploads/hr_docs"
os.makedirs(UPLOAD_DIR, exist_ok=True)

class ChatbotRequest(BaseModel):
    message: str

@router.post("/docs")
def upload_hr_document(file: UploadFile = File(...)):
    file_location = f"{UPLOAD_DIR}/{file.filename}"
    with open(file_location, "wb+") as file_object:
        shutil.copyfileobj(file.file, file_object)
        
    success = load_document_to_knowledge_base(file_location)
    if not success:
        return {"info": f"File '{file.filename}' saved, but failed to load into AI knowledge base."}
        
    return {"info": f"File '{file.filename}' successfully added to Onboarding AI knowledge base."}

@router.post("/chat")
def chatbot_interaction(request: ChatbotRequest):
    response = ask_onboarding_question(request.message)
    return {"reply": response}
@router.post("/checklist")
def create_checklist_item(employee_id: int, task: str, assignee: str, due_date: str, db: Session = Depends(get_db)):
    new_item = OnboardingChecklist(employee_id=employee_id, task=task, assignee=assignee, due_date=due_date)
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item

@router.get("/checklist/{employee_id}")
def get_checklist(employee_id: int, db: Session = Depends(get_db)):
    return db.query(OnboardingChecklist).filter(OnboardingChecklist.employee_id == employee_id).all()
