import os
import resend

def send_no_show_email(*, patient_name: str, ref_id: str, specialty: str | None = None, new_status: str = "NO_SHOW"):
    resend.api_key = os.getenv("RESEND_API_KEY")
    email_to = os.getenv("EMAIL_TO_TEST")
    email_from = os.getenv("EMAIL_FROM", "onboarding@resend.dev")

    if not resend.api_key or not email_to:
        raise RuntimeError("Missing RESEND_API_KEY or EMAIL_TO_TEST")

    subject = f"[TEST] {new_status.replace('_',' ')} — {patient_name}"

    specialty_line = f"<p><strong>Specialty:</strong> {specialty}</p>" if specialty else ""

    html = f"""
    <h2>Status update detected</h2>
    <p>The following referral has been marked as <strong>{new_status.replace('_',' ')}</strong>.</p>
    <ul>
      <li><strong>Patient:</strong> {patient_name}</li>
      <li><strong>Referral ID:</strong> {ref_id}</li>
    </ul>
    {specialty_line}
    <p>This is a test notification.</p>
    """

    resend.Emails.send({
        "from": email_from,
        "to": email_to,
        "subject": subject,
        "html": html,
    })