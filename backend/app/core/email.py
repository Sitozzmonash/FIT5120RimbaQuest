from __future__ import annotations

import logging
import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import httpx

logger = logging.getLogger(__name__)

BREVO_API_URL = "https://api.brevo.com/v3/smtp/email"


def _text_content(code: str) -> str:
    return (
        f"Hello,\n\n"
        f"Your RimbaQuest password reset verification code is:\n\n"
        f"    {code}\n\n"
        f"This code will expire in 15 minutes.\n\n"
        f"If you did not request a password reset, please ignore this email.\n\n"
        f"- The RimbaQuest Team"
    )


def _html_content(code: str) -> str:
    return f"""
    <html>
      <body style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.6;">
        <div style="max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
          <h2 style="color: #0A4D26; margin-top: 0;">RimbaQuest Password Reset</h2>
          <p>Hello,</p>
          <p>You requested to reset your password. Use the verification code below to complete the reset:</p>
          <div style="background-color: #E8F6EE; padding: 16px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <span style="font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #0A4D26;">{code}</span>
          </div>
          <p style="font-size: 14px; color: #6b7280;">This code will expire in 15 minutes.</p>
          <p style="font-size: 14px; color: #6b7280;">If you did not request this, you can safely ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="font-size: 12px; color: #9ca3af; margin-bottom: 0;">The RimbaQuest Team</p>
        </div>
      </body>
    </html>
    """


def _brevo_sender() -> tuple[str, str]:
    """Resolve the validated Brevo sender. Falls back to the SMTP_FROM address."""
    name = os.getenv("BREVO_SENDER_NAME") or "RimbaQuest Team"
    email = os.getenv("BREVO_SENDER_EMAIL") or os.getenv("SMTP_FROM") or os.getenv("SMTP_USER") or ""
    # SMTP_FROM may carry a display name like "Team <addr>"; keep only the address.
    if "<" in email and email.endswith(">"):
        email = email[email.index("<") + 1 : -1]
    return name, email.strip()


def _send_via_brevo(to_email: str, code: str) -> bool:
    """Deliver through Brevo's HTTPS API.

    Render cannot reach smtp.gmail.com (outbound SMTP is blocked, surfacing as
    "Network is unreachable"), but its HTTPS egress works, so the reset email is
    sent over port 443 instead of SMTP.
    """
    api_key = os.getenv("BREVO_API_KEY")
    sender_name, sender_email = _brevo_sender()
    if not sender_email:
        logger.error("Brevo send skipped: no BREVO_SENDER_EMAIL configured.")
        return False
    payload = {
        "sender": {"name": sender_name, "email": sender_email},
        "to": [{"email": to_email}],
        "subject": "RimbaQuest - Password Reset Verification Code",
        "textContent": _text_content(code),
        "htmlContent": _html_content(code),
    }
    try:
        response = httpx.post(
            BREVO_API_URL,
            headers={
                "api-key": api_key,
                "accept": "application/json",
                "content-type": "application/json",
            },
            json=payload,
            timeout=20,
        )
        response.raise_for_status()
        return True
    except httpx.HTTPStatusError as exc:
        logger.error(
            "Brevo rejected the password reset email to %s: %s %s",
            to_email,
            exc.response.status_code,
            exc.response.text[:300],
        )
        return False
    except httpx.HTTPError as exc:
        logger.error("Failed to send password reset email to %s via Brevo: %s", to_email, exc)
        return False


def _send_via_smtp(to_email: str, code: str) -> bool:
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port_raw = os.getenv("SMTP_PORT", "587")
    smtp_user = os.getenv("SMTP_USER")
    smtp_password = os.getenv("SMTP_PASSWORD")
    smtp_from = os.getenv("SMTP_FROM") or smtp_user or "support@rimbaquest.com"

    try:
        smtp_port = int(smtp_port_raw)
    except ValueError:
        smtp_port = 587

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "RimbaQuest - Password Reset Verification Code"
        msg["From"] = smtp_from
        msg["To"] = to_email
        msg.attach(MIMEText(_text_content(code), "plain"))
        msg.attach(MIMEText(_html_content(code), "html"))

        with smtplib.SMTP(smtp_host, smtp_port, timeout=15) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.sendmail(smtp_from, [to_email], msg.as_string())
        return True
    except Exception as exc:
        logger.error("Failed to send password reset email to %s via SMTP: %s", to_email, exc)
        return False


def email_provider_configured() -> bool:
    """True when a real delivery channel is configured (not dev simulation)."""
    return bool(os.getenv("BREVO_API_KEY") or (
        os.getenv("SMTP_HOST") and os.getenv("SMTP_USER") and os.getenv("SMTP_PASSWORD")
    ))


def send_password_reset_email(to_email: str, code: str) -> bool:
    """Send a password reset email with the 6-character code.

    Delivery order: Brevo HTTPS API, then SMTP, then a logged dev simulation.
    Returns True only when the message was actually accepted for delivery (or
    simulated in development with no provider configured).
    """
    if os.getenv("BREVO_API_KEY"):
        return _send_via_brevo(to_email, code)
    if os.getenv("SMTP_HOST") and os.getenv("SMTP_USER") and os.getenv("SMTP_PASSWORD"):
        return _send_via_smtp(to_email, code)

    print(f"[DEV EMAIL SIMULATION] Password reset code for {to_email}: {code}")
    logger.info("[DEV EMAIL SIMULATION] Password reset code for %s: %s", to_email, code)
    return True
