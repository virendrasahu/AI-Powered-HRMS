import os
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import simpleSplit

# from app.dependencies import get_current_user

router = APIRouter()

OUT_DIR = "uploads/exports"
os.makedirs(OUT_DIR, exist_ok=True)

class OfferLetterRequest(BaseModel):
    candidate_name: str
    role: str
    salary: str
    joining_date: str

class PayrollSummary(BaseModel):
    employee_id: int
    base_salary: float
    deductions: float
    net_salary: float
    month_year: str

@router.post("/generate-offer")
def generate_offer_letter(request: OfferLetterRequest):
    filename = f"{request.candidate_name.replace(' ', '_')}_Offer_Letter.pdf"
    filepath = os.path.join(OUT_DIR, filename)

    c = canvas.Canvas(filepath, pagesize=A4)
    width, height = A4
    left_margin = 60
    right_margin = 60
    max_text_width = width - left_margin - right_margin
    y = height - 70

    def draw_wrapped_paragraph(text: str, start_y: float, font_name: str = "Times-Roman", font_size: int = 12, line_gap: int = 16):
        c.setFont(font_name, font_size)
        lines = simpleSplit(text, font_name, font_size, max_text_width)
        current_y = start_y
        for line in lines:
            c.drawString(left_margin, current_y, line)
            current_y -= line_gap
        return current_y

    # Header
    c.setFont("Helvetica-Bold", 24)
    c.drawString(left_margin, y, "ARTH")
    c.setFont("Helvetica-Bold", 18)
    c.drawString(left_margin + 95, y + 2, "ARTH Human Resource Solutions")
    c.setFont("Helvetica", 10)
    c.drawRightString(width - right_margin, y + 5, "CIN: ARTH-HR-2026")
    c.line(left_margin, y - 12, width - right_margin, y - 12)
    y -= 45

    # Date and title
    letter_date = datetime.now().strftime("%B %d, %Y")
    c.setFont("Times-Roman", 12)
    c.drawString(left_margin, y, letter_date)
    y -= 28
    c.setFont("Times-Bold", 15)
    c.drawCentredString(width / 2, y, "Offer Letter")
    y -= 34

    # Body
    c.setFont("Times-Roman", 12)
    c.drawString(left_margin, y, f"Dear {request.candidate_name},")
    y -= 26

    y = draw_wrapped_paragraph(
        f"Congratulations! We are pleased to offer you the role of {request.role} at ARTH Human Resource Solutions.",
        y,
    )
    y -= 10

    y = draw_wrapped_paragraph(
        f"Your date of joining will be {request.joining_date}. Your annual compensation will be {request.salary}, subject to applicable company policies, statutory deductions, and tax regulations.",
        y,
    )
    y -= 10

    y = draw_wrapped_paragraph(
        "This offer is based on successful completion of pre-employment checks and your acceptance of all employment terms and conditions. Detailed appointment terms and policy documents will be shared at onboarding.",
        y,
    )
    y -= 10

    y = draw_wrapped_paragraph(
        "Please confirm your acceptance of this offer by replying in writing within 3 business days from the date of this letter.",
        y,
    )
    y -= 16

    y = draw_wrapped_paragraph(
        "We look forward to welcoming you to ARTH and wish you a successful career with us.",
        y,
    )
    y -= 28

    # Signature section
    c.setFont("Times-Roman", 12)
    c.drawString(left_margin, y, "For ARTH Human Resource Solutions")
    y -= 22
    c.setFont("Times-Bold", 12)
    c.drawString(left_margin, y, "HR Department")
    y -= 36

    c.setFont("Times-Bold", 12)
    c.drawString(left_margin, y, "Offer Acceptance")
    y -= 22
    c.setFont("Times-Roman", 12)
    c.drawString(left_margin, y, f"Name: {request.candidate_name}")
    c.drawString(left_margin + 290, y, "Date: __________________")
    y -= 24
    c.drawString(left_margin, y, "Signature: ___________________________")

    # Footer
    c.setFont("Helvetica", 9)
    c.drawString(left_margin, 38, "Registered Address: ARTH, Hyderabad, India")
    c.drawRightString(width - right_margin, 38, "hr@arth.example")
    c.save()
    
    return FileResponse(filepath, media_type='application/pdf', filename=filename)

@router.get("/payroll/{employee_id}")
def get_payroll_summary(employee_id: int, month_year: str):
    # This is a stub for the payroll feature as per requirements (COMPULSORY)
    # A real implementation would query a Payroll model
    base = 5000.0
    deduc = 300.0
    return PayrollSummary(
        employee_id=employee_id,
        base_salary=base,
        deductions=deduc,
        net_salary=base - deduc,
        month_year=month_year
    )
