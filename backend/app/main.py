from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base

from app.routes import auth, employees, recruitment, leave, performance, onboarding, analytics, extra

# Create DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI HRMS API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

@app.get("/")
def read_root():
    return {"message": "Welcome to the AI HRMS API"}

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(employees.router, prefix="/api/employees", tags=["employees"])
app.include_router(recruitment.router, prefix="/api/recruitment", tags=["recruitment"])
app.include_router(leave.router, prefix="/api/leave", tags=["leave"])
app.include_router(performance.router, prefix="/api/performance", tags=["performance"])
app.include_router(onboarding.router, prefix="/api/onboarding", tags=["onboarding"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["analytics"])
app.include_router(extra.router, prefix="/api/extra", tags=["extra"])
