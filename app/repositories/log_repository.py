# app/repositories/log_repository.py

from datetime import datetime
from typing import Optional
from uuid import UUID

from sqlalchemy.orm import Session
from models.domain_models import ActivityLog


def create(
    db: Session,
    user_id,            # UUID | None
    device_id,          # int | None
    action_type: str,
    description: str,
) -> ActivityLog:
    log = ActivityLog(
        user_id=user_id,
        device_id=device_id,
        action_type=action_type,
        description=description,
    )
    db.add(log)
    db.commit()
    return log


def get_paginated(
    db: Session,
    current_user_id,
    is_admin: bool,
    device_id: Optional[int] = None,
    action_type: Optional[str] = None,
    from_time: Optional[datetime] = None,
    to_time: Optional[datetime] = None,
    page: int = 1,
    limit: int = 20,
) -> tuple[list[ActivityLog], int]:
    query = db.query(ActivityLog)

    # Phân quyền — user thường chỉ thấy log có user_id của mình
    # hoặc log tự động (user_id=NULL) liên quan thiết bị của mình
    if not is_admin:
        query = query.filter(
            (ActivityLog.user_id == current_user_id) |
            (ActivityLog.user_id == None)
        )

    if device_id is not None:
        query = query.filter(ActivityLog.device_id == device_id)
    if action_type:
        query = query.filter(ActivityLog.action_type == action_type)
    if from_time:
        query = query.filter(ActivityLog.created_at >= from_time)
    if to_time:
        query = query.filter(ActivityLog.created_at <= to_time)

    total = query.count()
    items = (
        query
        .order_by(ActivityLog.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )
    return items, total
