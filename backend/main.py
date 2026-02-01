from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select, SQLModel, Field
from database import get_session, engine 
from typing import Optional, List
from datetime import datetime
from sqlalchemy import Column, JSON
import resend
from supabase import create_client
import os

# 1. Initialize the API App
app = FastAPI()

# --- Supabase + Email Config (backend-only secrets) ---
SUPABASE_URL = os.getenv("SUPABASE_URL")
DATABASE_SERVICE_ROLE_KEY = os.getenv("DATABASE_SERVICE_ROLE_KEY")

RESEND_API_KEY = os.getenv("RESEND_API_KEY")
EMAIL_FROM = os.getenv("EMAIL_FROM")              # e.g. onboarding@resend.dev
EMAIL_TO_TEST = os.getenv("EMAIL_TO_TEST")        # your email for the internal/default notice

if not SUPABASE_URL or not DATABASE_SERVICE_ROLE_KEY:
    raise RuntimeError("Missing SUPABASE_URL or DATABASE_SERVICE_ROLE_KEY in backend .env")

if not RESEND_API_KEY:
    raise RuntimeError("Missing RESEND_API_KEY in backend .env")

if not EMAIL_FROM:
    raise RuntimeError("Missing EMAIL_FROM in backend .env")

supabase_admin = create_client(SUPABASE_URL, DATABASE_SERVICE_ROLE_KEY)

def _send_email(to: str, subject: str, html: str):
    resend.api_key = RESEND_API_KEY
    resend.Emails.send({
        "from": EMAIL_FROM,
        "to": to,
        "subject": subject,
        "html": html,
    })

# 2. CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Define Models
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

# 4. Pydantic Schemas (For validating incoming data)
class ReferralCreate(SQLModel):
    patient_id: str
    specialty: str
    priority: str
    notes: Optional[str] = None
    transportation_needed: bool = False

class PatientCreate(SQLModel):
    full_name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    medical_history: List[str] = [] 

# 5. Endpoints

@app.get("/")
def health_check():
    return {"status": "active", "service": "Clearwater Loop Backend"}

@app.get("/dashboard")
def get_dashboard(session: Session = Depends(get_session)):
    """
    Returns referrals sorted by RISK SCORE (Critical first), then Priority.
    """
    statement = select(Referral, Patient).where(Referral.patient_id == Patient.id)
    results = session.exec(statement).all()
    
    dashboard_data = []
    for referral, patient in results:
        # DYNAMIC RISK ADJUSTMENT
        current_risk = patient.risk_score
        if referral.status == "NO_SHOW" or referral.status == "MISSED":
            current_risk = 100 
            
        dashboard_data.append({
            **referral.dict(),
            "patient_name": patient.full_name,
            "risk_score": current_risk
        })
        
    return sorted(dashboard_data, key=lambda x: x['risk_score'], reverse=True)

@app.get("/referrals")
def get_referrals(session: Session = Depends(get_session)):
    return get_dashboard(session)

@app.post("/referrals")
def create_referral(referral_data: ReferralCreate, session: Session = Depends(get_session)):
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

@app.patch("/referrals/{ref_id}/status")
def update_status(ref_id: str, status_update: dict, session: Session = Depends(get_session)):
    referral = session.get(Referral, ref_id)
    if not referral:
        raise HTTPException(status_code=404, detail="Referral not found")
        
    new_status = status_update.get("status")
    referral.status = new_status
    
    # SAFETY NET LOGIC
    if new_status == "NO_SHOW" or new_status == "MISSED":
        referral.is_urgent = True
        # Notification logic would go here
        
    session.add(referral)
    session.commit()
    return {"ok": True, "status": new_status}

@app.post("/referrals/{ref_id}/no-show-email")
def trigger_no_show_email(ref_id: str, background_tasks: BackgroundTasks):
    """
    Called by the frontend AFTER it marks an appointment as NO_SHOW in Supabase.
    This endpoint:
      1) loads the referral from Supabase (to get patient_id + nurse notes)
      2) loads the patient from Supabase (to get email)
      3) emails the patient the nurse's message (notes)
      4) emails EMAIL_TO_TEST a default no-show notice (for testing / internal)
    """

    # 1) Load referral from Supabase
    ref_res = (
        supabase_admin
        .from_("referrals")
        .select("id, patient_id, specialty, notes")
        .eq("id", ref_id)
        .single()
        .execute()
    )
    ref = ref_res.data
    if not ref:
        raise HTTPException(status_code=404, detail="Referral not found in Supabase")

    patient_id = ref.get("patient_id")
    if not patient_id:
        raise HTTPException(status_code=400, detail="Referral missing patient_id")

    # 2) Load patient email from Supabase
    patient_res = (
        supabase_admin
        .from_("patients")
        .select("id, email, full_name")
        .eq("id", patient_id)
        .single()
        .execute()
    )
    patient = patient_res.data
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found in Supabase")

    patient_email = patient.get("email")
    if not patient_email:
        raise HTTPException(status_code=400, detail="Patient email missing")

    patient_name = patient.get("full_name") or "Patient"

    # 3) Nurse message (stored in referral.notes) + fallback
    nurse_msg = (ref.get("notes") or "").strip()
    if not nurse_msg:
        nurse_msg = "You missed your appointment. Please contact the clinic to reschedule."

    # Patient email
    subject_patient = "Missed appointment — please reschedule"
    html_patient = f"""
    <div style="font-family: Arial, sans-serif;">
      <p>Hi {patient_name},</p>
      <p>{nurse_msg}</p>
      <p>If you believe this is an error, please reply to this email.</p>
      <p>— Clinic Team</p>
    </div>
    """

    # Default/internal notice (to your test inbox)
    subject_internal = f"NO_SHOW recorded: {patient_name}"
    html_internal = f"""
    <div style="font-family: Arial, sans-serif;">
      <p><b>No-show recorded</b></p>
      <p>Patient: {patient_name}</p>
      <p>Referral ID: {ref_id}</p>
      <p>Specialty: {ref.get("specialty")}</p>
    </div>
    """

    # Send async
    background_tasks.add_task(_send_email, patient_email, subject_patient, html_patient)

    if EMAIL_TO_TEST:
        background_tasks.add_task(_send_email, EMAIL_TO_TEST, subject_internal, html_internal)

    return {"ok": True}

@app.post("/patients")
def create_patient(patient_data: PatientCreate, session: Session = Depends(get_session)):
    # 1. Calculate Initial Risk Score
    score = 10 
    if "Cardiac History" in patient_data.medical_history:
        score += 50
    if "Diabetic" in patient_data.medical_history:
        score += 20
    if "Respiratory Issue" in patient_data.medical_history:
        score += 30
        
    # 2. Save to DB
    new_patient = Patient(
        full_name=patient_data.full_name,
        phone=patient_data.phone,
        email=patient_data.email,
        address=patient_data.address,
        medical_history=patient_data.medical_history,
        risk_score=score
    )
    session.add(new_patient)
    session.commit()
    session.refresh(new_patient)
    return new_patient