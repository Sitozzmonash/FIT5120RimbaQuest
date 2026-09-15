from __future__ import annotations

import logging
import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from dotenv import load_dotenv

from app.core.config import BACKEND_ROOT, REPOSITORY_ROOT

logger = logging.getLogger(__name__)


def _ensure_env_loaded() -> None:
    if not (os.getenv("SMTP_USER") and os.getenv("SMTP_PASSWORD") and os.getenv("SMTP_HOST")):
        load_dotenv(REPOSITORY_ROOT / ".env")
        load_dotenv(BACKEND_ROOT / ".env")


def send_password_reset_email(to_email: str, code: str) -> bool:
    """Send a password reset email with the 6-character code.

    If SMTP credentials are not configured, logs a simulated message
    and returns True for development mode.
    """
    _ensure_env_loaded()

    smtp_host = os.getenv("SMTP_HOST")
    smtp_port_raw = os.getenv("SMTP_PORT", "587")
    smtp_user = os.getenv("SMTP_USER")
    smtp_password = os.getenv("SMTP_PASSWORD")
    smtp_from = os.getenv("SMTP_FROM") or smtp_user or "support@rimbaquest.com"

    try:
        smtp_port = int(smtp_port_raw)
    except ValueError:
        smtp_port = 587

    # Check if SMTP is configured
    if not (smtp_host and smtp_user and smtp_password):
        print(f"[DEV EMAIL SIMULATION] Password reset code for {to_email}: {code}")
        logger.info("[DEV EMAIL SIMULATION] Password reset code for %s: %s", to_email, code)
        return True

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "RimbaQuest - Password Reset Verification Code"
        msg["From"] = smtp_from
        msg["To"] = to_email

        text_content = (
            f"Hello,\n\n"
            f"Your RimbaQuest password reset verification code is:\n\n"
            f"    {code}\n\n"
            f"This code will expire in 15 minutes.\n\n"
            f"If you did not request a password reset, please ignore this email.\n\n"
            f"- The RimbaQuest Team"
        )
        html_content = f"""
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

        msg.attach(MIMEText(text_content, "plain"))
        msg.attach(MIMEText(html_content, "html"))

        with smtplib.SMTP(smtp_host, smtp_port, timeout=15) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.sendmail(smtp_from, [to_email], msg.as_string())

        return True
    except Exception as exc:
        logger.exception("Failed to send password reset email to %s: %s", to_email, exc)
        return False
