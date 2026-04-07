import os
import json
import PyPDF2
from dotenv import load_dotenv
from app.ai.gemini_client import model

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

KNOWLEDGE_DB_PATH = "uploads/knowledge_db.json"

def get_knowledge():
    if os.path.exists(KNOWLEDGE_DB_PATH):
        with open(KNOWLEDGE_DB_PATH, "r") as f:
            return json.load(f)
    return {}

def save_knowledge(data):
    with open(KNOWLEDGE_DB_PATH, "w") as f:
        json.dump(data, f)

def extract_text(file_path: str) -> str:
    text = ""
    try:
        if file_path.endswith('.pdf'):
            with open(file_path, 'rb') as file:
                reader = PyPDF2.PdfReader(file)
                for page in reader.pages:
                    text += page.extract_text() + "\n"
        else:
            with open(file_path, 'r', encoding='utf-8') as file:
                text = file.read()
    except Exception as e:
        print(f"Error extracting text: {e}")
    return text

def load_document_to_knowledge_base(file_path: str):
    text = extract_text(file_path)
    if not text:
        return False
        
    db = get_knowledge()
    db[os.path.basename(file_path)] = text
    save_knowledge(db)
    return True

def ask_onboarding_question(question: str) -> str:
    if not GEMINI_API_KEY:
        return "System error: Gemini API key not configured."
        
    db = get_knowledge()
    if not db:
        return "Contact HR"
        
    # Combine knowledge base
    context = "\n---\n".join([f"Source: {k}\n{v}" for k, v in db.items()])
    
    prompt = f"""
    You are an internal HR Onboarding Assistant chatbot.
    Use the following retrieved context documents to answer the question.
    IMPORTANT CONSTRAINT: If you do not find the exact answer in the context provided,
    you MUST reply ONLY with the exact phrase: 'Contact HR'. Do not invent answers.
    Do not reply with 'I cannot find the answer', just say 'Contact HR'.
    
    Context:
    {context}
    
    Question: {question}
    """
    
    try:
        response = model.generate_content(prompt)
        answer = response.text.strip()
        
        # Fallback enforcement if the LLM ignores constraint
        if "don't know" in answer.lower() or "not mentioned" in answer.lower():
            return "Contact HR"
            
        return answer
    except Exception as e:
        print(f"Error in Gemini direct query: {e}")
        return "Contact HR"
