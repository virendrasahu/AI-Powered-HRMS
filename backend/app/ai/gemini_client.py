import os
import google.generativeai as genai
from dotenv import load_dotenv
import json
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FuturesTimeout

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

# We use gemini-flash-latest as the fast standard model, but default to gemini-pro if older sdk
try:
    model = genai.GenerativeModel("gemini-flash-latest")
except Exception:
    model = genai.GenerativeModel("gemini-pro")

def generate_employee_bio(name: str, designation: str, department: str, skills: str) -> str:
    prompt = f"Write a short, professional, and engaging 3-sentence company bio for {name}, who is a {designation} in the {department} department. Their skills include: {skills}."
    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"Could not generate bio: {str(e)}"

def score_resume_against_job(resume_text: str, role: str, description: str, skills: str):
    prompt = f"""
    You are an expert ATS (Applicant Tracking System).
    Rate the following resume against the job description for the role of '{role}'.
    
    Job Description: {description}
    Required Skills: {skills}
    
    Resume Text: {resume_text}
    
    Please provide your response strictly as a JSON object with the following keys:
    - "score": an integer from 0 to 100 representing the match percentage.
    - "strengths": a short 1-2 sentence summary of their relevant strengths.
    - "gaps": a short 1-2 sentence summary of what they are lacking.
    - "interview_questions": 3 specific interview questions to evaluate their fit.
    
    Ensure the output is valid JSON without markdown formatting like ```json.
    """
    try:
        response = model.generate_content(prompt)
        text = response.text.strip()
        if text.startswith("```json"):
            text = text[7:-3].strip()
        elif text.startswith("```"):
            text = text[3:-3].strip()
            
        return json.loads(text)
    except Exception as e:
        return {
            "score": 0,
            "strengths": f"Error: {str(e)}",
            "gaps": "Error",
            "interview_questions": "Error"
        }

def generate_performance_summary(self_rating: int, self_comments: str, manager_rating: int, manager_comments: str):
    prompt = f"""
    Analyze the following performance review:
    Self Rating: {self_rating}/5
    Self Comments: {self_comments}
    
    Manager Rating: {manager_rating}/5
    Manager Comments: {manager_comments}
    
    Provide your response strictly as a JSON object with:
    - "summary": A professional synthesis (2 sentences) of the overall performance.
    - "rating_mismatch": "High", "Low", or "None" based on the difference between the two ratings and comments.
    - "suggestions": 2 actionable improvement suggestions for the employee.
    
    Ensure the output is valid JSON without markdown formatting like ```json.
    """
    try:
        response = model.generate_content(prompt)
        text = response.text.strip()
        if text.startswith("```json"):
            text = text[7:-3].strip()
        elif text.startswith("```"):
            text = text[3:-3].strip()
            
        return json.loads(text)
    except Exception as e:
        return {
            "summary": f"Could not generate summary: {str(e)}",
            "rating_mismatch": "Error",
            "suggestions": "Error",
        }


def generate_analytics_insights(stats: dict) -> str:
    """
    Generate an executive HR analytics summary.
    Always returns a meaningful string; falls back to heuristic text if Gemini fails.
    """
    stats_json = json.dumps(stats)
    prompt = f"""
You are an HR Analytics Expert.
You are given monthly HR statistics as JSON:
{stats_json}

Write a concise 2–3 sentence executive summary for the HR Director.
Focus on headcount, department mix, leave activity, and any notable risks or trends.
Keep the tone analytical and professional. Do NOT wrap the response in markdown.
"""
    try:
        # Hard timeout so dashboard/analytics never hang too long
        with ThreadPoolExecutor(max_workers=1) as executor:
            future = executor.submit(model.generate_content, prompt)
            try:
                response = future.result(timeout=5)
            except FuturesTimeout:
                future.cancel()
                raise TimeoutError("Gemini analytics generation timed out")

        text = (response.text or "").strip()
        if not text:
            raise ValueError("Empty response from model")
        return text
    except Exception as e:
        total_headcount = stats.get("total_headcount", 0)
        dept_dist = stats.get("department_distribution", {})
        total_leaves = stats.get("total_leaves_applied", 0)
        dept_count = len(dept_dist)
        return (
            "Based on current HR data, the organisation is operating with "
            f"{total_headcount} employees across {dept_count} departments and "
            f"{total_leaves} recorded leave events this period. "
            "Workforce utilisation appears stable, but leaders should continue to watch department-level trends "
            "to spot emerging capacity or attrition risks early."
        )
