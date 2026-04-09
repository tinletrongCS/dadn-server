# app/repositories/otp_repository.py

from datetime import datetime
from sqlalchemy.orm import Session
from models.domain_models import OtpToken

def create(db: Session, email: str, otp_code: str, expires_at: datetime) -> OtpToken:
    otp = OtpToken(
        email=email,
        otp_code=otp_code,
        expires_at=expires_at,
        used=False
    )
    db.add(otp)
    db.commit()
    db.refresh(otp)
    return otp

def get_valid_otp(db: Session, email: str, otp_code: str, current_time: datetime) -> OtpToken | None:
    return db.query(OtpToken).filter(
        OtpToken.email == email,
        OtpToken.otp_code == otp_code,
        OtpToken.used == False,
        OtpToken.expires_at > current_time
    ).first()

def mark_as_used(db: Session, otp: OtpToken) -> None:
    otp.used = True
    db.commit()
