# app/repositories/command_repository.py

from datetime import datetime, timezone
from sqlalchemy.orm import Session
from models.domain_models import PendingCommand, Device


def get_pending(db: Session, device_id: int) -> list[PendingCommand]:
    return (
        db.query(PendingCommand)
        .filter(
            PendingCommand.device_id == device_id,
            PendingCommand.status   == "pending",
        )
        .order_by(PendingCommand.issued_at.asc())
        .all()
    )


def get_by_id(db: Session, command_id: int, device_id: int) -> PendingCommand | None:
    return db.query(PendingCommand).filter(
        PendingCommand.command_id == command_id,
        PendingCommand.device_id  == device_id,
    ).first()


def create(
    db: Session,
    device_id: int,
    actuator: str,
    action: str,
    issued_by,      # UUID | None
    source: str,
) -> PendingCommand:
    cmd = PendingCommand(
        device_id=device_id,
        actuator=actuator,
        action=action,
        issued_by=issued_by,
        source=source,
        status="pending",
    )
    db.add(cmd)
    db.commit()
    db.refresh(cmd)
    return cmd


def mark_done(db: Session, cmd: PendingCommand, device: Device) -> None:
    """Đánh dấu lệnh thành công, cập nhật trạng thái actuator trên device."""
    cmd.acked_at = datetime.now(timezone.utc)
    cmd.status   = "done"
    setattr(device, f"{cmd.actuator}_status", cmd.action == "on")
    db.commit()


def mark_error(db: Session, cmd: PendingCommand, error_detail: str) -> None:
    """Đánh dấu lệnh lỗi."""
    cmd.acked_at     = datetime.now(timezone.utc)
    cmd.status       = "error"
    cmd.error_detail = error_detail
    db.commit()
