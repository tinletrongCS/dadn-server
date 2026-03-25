# app/routers/logs.py

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
from uuid import UUID

from database import get_db
from dependencies.auth_deps import get_current_user
from models.domain_models import User, ActivityLog
from schemas.domain_schemas import ActivityLogResponse, PaginatedLogResponse

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
    """
    UC8: Xem lịch sử hoạt động.
    UC8A: Lọc theo device_id, action_type, khoảng thời gian.
    - Admin (role_id=1): thấy log của tất cả thiết bị.
    - User  (role_id=2): chỉ thấy log của thiết bị liên quan.
    """
    query = db.query(ActivityLog)

    # Phân quyền — user thường chỉ thấy log có user_id của mình
    # hoặc log tự động (user_id=NULL) liên quan thiết bị của mình
    if current_user.role_id != 1:
        query = query.filter(
            (ActivityLog.user_id == current_user.user_id) |
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

    return PaginatedLogResponse(
        items=items,
        total=total,
        page=page,
        limit=limit,
    )