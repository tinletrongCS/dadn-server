from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime

from database import get_db
from dependencies.auth_deps import get_current_user
from models.domain_models import User
from schemas.domain_schemas import SensorDataResponse, MessageResponse, DevicePayload
from services import sensor_service

router = APIRouter()

# UC1 - Thiết bị IoT gửi dữ liệu lên
@router.post("/data", response_model=MessageResponse)
async def receive_sensor_data(
    body: DevicePayload,
    db: Session = Depends(get_db)
) -> MessageResponse:
    return await sensor_service.receive_data(db, body)

# UC2 - Xem dữ liệu mới nhất của một thiết bị
@router.get("/{device_id}/latest", response_model=SensorDataResponse)
async def get_latest_sensor_data(
    device_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> SensorDataResponse:
    return await sensor_service.get_latest(db, device_id)

# UC2-1 - Xem lịch sử dữ liệu theo thời gian (cho biểu đồ)
@router.get("/{device_id}/history", response_model=list[SensorDataResponse])
async def get_sensor_history(
    device_id: int,
    from_time: datetime,
    to_time:   datetime,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> list[SensorDataResponse]:
    return await sensor_service.get_history(db, device_id, from_time, to_time)