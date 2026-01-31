# Spark/backend/main.py
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select, SQLModel, Field
from database import get_session, engine 
from typing import Optional, List
from datetime import datetime, date

# 1. Initialize the API App
app = FastAPI()

# 2. CORS Setup (Allows React to talk to Python)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Define Models (Must match Database Schema)
class Patient(SQLModel, table=True):
    __tablename__ = "patients"
    id: Optional[str] = Field(default=None, primary_key=True)
    full_name: str
    risk_score: int

class Referral(SQLModel, table=True):
    __tablename__ = "referrals"
    id: Optional[str] = Field(default=None, primary_key=True)
    patient_id: str
    specialty: str
    status: str
    priority: str
    is_urgent: bool
    requires_transport: bool
    appointment_date: Optional[datetime]

# 4. Health Check Endpoint
@app.get("/")
def health_check():
    return {"status": "active", "service": "Clearwater Loop Backend"}

# 5. Dashboard Endpoint (The "Winner" Logic)
@app.get("/dashboard")
def get_dashboard(session: Session = Depends(get_session)):
    """
    Returns referrals sorted by RISK SCORE (Critical first), then Priority.
    """
    # Fetch all referrals and their patients
    statement = select(Referral, Patient).where(Referral.patient_id == Patient.id)
    results = session.exec(statement).all()
    
    dashboard_data = []
    for referral, patient in results:
        # DYNAMIC RISK ADJUSTMENT
        # If a patient has MISSED an appointment, their risk skyrockets temporarily
        current_risk = patient.risk_score
        if referral.status == "NO_SHOW" or referral.status == "MISSED":
            current_risk = 100 # Force to top of list
            
        dashboard_data.append({
            **referral.dict(),
            "patient_name": patient.full_name,
            "risk_score": current_risk
        })
        
    # Sort: Risk Score (Desc) -> Priority (High>Low)
    return sorted(dashboard_data, key=lambda x: x['risk_score'], reverse=True)