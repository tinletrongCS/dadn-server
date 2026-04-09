# app/services/log_service.py

from typing import Optional
from datetime import datetime
from sqlalchemy.orm import Session
from models.domain_models import User
from schemas.domain_schemas import PaginatedLogResponse
from repositories import log_repository

async def get_logs(
    db: Session,
    current_user: User,
    device_id: Optional[int] = None,
    action_type: Optional[str] = None,
    from_time: Optional[datetime] = None,
    to_time: Optional[datetime] = None,
    page: int = 1,
    limit: int = 20,
) -> PaginatedLogResponse:
    is_admin = (current_user.role_id == 1)
    
    items, total = log_repository.get_paginated(
        db=db,
        current_user_id=current_user.user_id,
        is_admin=is_admin,
        device_id=device_id,
        action_type=action_type,
        from_time=from_time,
        to_time=to_time,
        page=page,
        limit=limit,
    )

    return PaginatedLogResponse(
        items=items,
        total=total,
        page=page,
        limit=limit,
    )
