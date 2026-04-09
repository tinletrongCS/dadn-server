from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime

from database import get_db
from dependencies.auth_deps import get_current_user
from models.domain_models import User
from schemas.domain_schemas import PaginatedLogResponse
from services import log_service

router = APIRouter()

# UC8 + UC8A: Xem & lọc lịch sử hoạt động 
@router.get("", response_model=PaginatedLogResponse)
async def get_logs(
    device_id:   Optional[int]      = Query(None, description="Lọc theo thiết bị"),
    action_type: Optional[str]      = Query(None, description="Loại sự kiện: ALERT_TEMP, MANUAL_CONTROL_PUMP..."),
    from_time:   Optional[datetime] = Query(None, description="Từ thời điểm (ISO 8601)"),
    to_time:     Optional[datetime] = Query(None, description="Đến thời điểm (ISO 8601)"),
    page:        int                = Query(1,  ge=1),
    limit:       int                = Query(20, ge=1, le=100),
    db:          Session            = Depends(get_db),
    current_user: User              = Depends(get_current_user),
):
    return await log_service.get_logs(
        db=db,
        current_user=current_user,
        device_id=device_id,
        action_type=action_type,
        from_time=from_time,
        to_time=to_time,
        page=page,
        limit=limit,
    )