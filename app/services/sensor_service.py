# app/services/sensor_service.py

from datetime import datetime
from fastapi import HTTPException
from sqlalchemy.orm import Session
from models.domain_models import SensorData
from schemas.domain_schemas import DevicePayload, MessageResponse
from repositories import device_repository, sensor_repository
from services.threshold_service import check_and_alert
from websocket.manager import ws_manager

async def receive_data(db: Session, body: DevicePayload) -> MessageResponse:
    device = device_repository.get_by_name(db, body.device_source)

    if not device:
        raise HTTPException(
            status_code=404,
            detail=f"Device '{body.device_source}' chưa đăng ký trong hệ thống"
        )

    # Lưu sensor_data
    record = sensor_repository.create(db, device.device_id, body)

    # Cập nhật trạng thái device
    device_repository.update_status_from_payload(db, device, body)

    # Kiểm tra ngưỡng → cảnh báo → auto control
    await check_and_alert(device.device_id, record, device, db, ws_manager)

    return MessageResponse(message="Dữ liệu đã được lưu thành công")


async def get_latest(db: Session, device_id: int) -> SensorData:
    record = sensor_repository.get_latest(db, device_id)
    if not record:
        raise HTTPException(status_code=404, detail="Chưa có dữ liệu cảm biến")
    return record


async def get_history(
    db: Session,
    device_id: int,
    from_time: datetime,
    to_time: datetime
) -> list[SensorData]:
    return sensor_repository.get_history(db, device_id, from_time, to_time)
