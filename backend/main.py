# Spark/backend/main.py
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select, SQLModel, Field
from database import get_session, engine 
from typing import Optional, List
from datetime import datetime, date
from sqlalchemy import Column, JSON

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
    risk_score: int = 0
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    medical_history: List[str] = Field(default_factory=list, sa_column=Column(JSON))

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

# 1. Match the Frontend's "getReferrals" call
@app.get("/referrals")
def get_referrals(session: Session = Depends(get_session)):
    # Reuse the dashboard logic, just mapped to the correct URL
    return get_dashboard(session)

# 2. Match the Frontend's "updateReferralStatus" call
@app.patch("/referrals/{ref_id}/status")
def update_status(ref_id: str, status_update: dict, session: Session = Depends(get_session)):
    # Get the referral
    referral = session.get(Referral, ref_id)
    if not referral:
        raise HTTPException(status_code=404, detail="Referral not found")
        
    # Update status
    new_status = status_update.get("status")
    referral.status = new_status
    
    # SAFETY NET LOGIC (The "Winning Feature")
    if new_status == "NO_SHOW" or new_status == "MISSED":
        referral.is_urgent = True
        # TODO: This is where you call your NotificationService
        
    session.add(referral)
    session.commit()
    return {"ok": True, "status": new_status}

# 3. Match the Frontend's "createReferral" call
class ReferralCreate(SQLModel):
    patient_id: str
    specialty: str
    priority: str
    notes: Optional[str] = None
    transportation_needed: bool = False

@app.post("/referrals")
def create_referral(referral_data: ReferralCreate, session: Session = Depends(get_session)):
    # Create the DB Object
    new_ref = Referral(
        patient_id=referral_data.patient_id,
        specialty=referral_data.specialty,
        priority=referral_data.priority,
        status="CREATED",
        is_urgent=False,
        requires_transport=referral_data.transportation_needed
    )
    session.add(new_ref)
    session.commit()
    session.refresh(new_ref)
    return new_ref

# Spark/backend/main.py

class PatientCreate(SQLModel):
    full_name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    medical_history: List[str] = [] # e.g. ["Cardiac"]

@app.post("/patients")
def create_patient(patient_data: PatientCreate, session: Session = Depends(get_session)):
    # 1. Calculate Initial Risk Score
    score = 10 # Base score
    if "Cardiac" in patient_data.medical_history:
        score += 50
    if "Diabetic" in patient_data.medical_history:
        score += 20
        
    # 2. Save to DB
    new_patient = Patient(
        full_name=patient_data.full_name,
        phone=patient_data.phone,
        email=patient_data.email,
        address=patient_data.address,
        medical_history=patient_data.medical_history, # Ensure your DB supports JSON or Arrays
        risk_score=score
    )
    session.add(new_patient)
    session.commit()
    session.refresh(new_patient)
    return new_patient