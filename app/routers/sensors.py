from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime

from database import get_db
from dependencies.auth_deps import get_current_user
from models.domain_models import User, SensorData, Device
from schemas.domain_schemas import SensorDataResponse, MessageResponse, DevicePayload
from services.threshold_service import check_and_alert
from websocket.manager import ws_manager


router = APIRouter()


# UC1 - Thiết bị IoT gửi dữ liệu lên
@router.post("/data", response_model=MessageResponse)
async def receive_sensor_data(
    body: DevicePayload,
    db: Session = Depends(get_db)
) -> MessageResponse:
    """
    Nhận dữ liệu JSON từ IoT gateway.
    Sau khi lưu => tự động gọi threshold_service.check_and_alert()
    """
    # Tìm device theo name (map với device_source)
    device = db.query(Device).filter(
        Device.name == body.device_source
    ).first()

    if not device:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=404,
            detail=f"Device '{body.device_source}' chưa đăng ký trong hệ thống"
        )

    # Lưu sensor_data
    record = SensorData(
        device_id       = device.device_id,
        temperature     = body.sensor.temperature.value,
        air_humidity    = body.sensor.air_humidity.value,
        soil_moisture   = body.sensor.soil_moisture.value,
        light_intensity = int(body.sensor.light_intensity.value),
        measured_at     = body.timestamp,
    )
    db.add(record)

    # Cập nhật trạng thái device
    device.pump_status = body.status.pump
    device.fan_status  = body.status.fan
    device.mode        = body.status.mode
    device.last_seen   = body.timestamp

    # Cập nhật ngưỡng nếu DB đang NULL
    s = body.sensor
    if device.temp_min  is None: device.temp_min  = s.temperature.MIN
    if device.temp_max  is None: device.temp_max  = s.temperature.MAX
    if device.humid_min is None: device.humid_min = s.air_humidity.MIN
    if device.humid_max is None: device.humid_max = s.air_humidity.MAX
    if device.soil_min  is None: device.soil_min  = s.soil_moisture.MIN
    if device.soil_max  is None: device.soil_max  = s.soil_moisture.MAX
    if device.light_min is None: device.light_min = s.light_intensity.MIN
    if device.light_max is None: device.light_max = s.light_intensity.MAX

    db.commit()
    db.refresh(record)

    # Kiểm tra ngưỡng → cảnh báo → auto control
    await check_and_alert(device.device_id, record, device, db, ws_manager)

    return MessageResponse(message="Dữ liệu đã được lưu thành công")


# UC2 - Xem dữ liệu mới nhất của một thiết bị
@router.get("/{device_id}/latest", response_model=SensorDataResponse)
async def get_latest_sensor_data(
    device_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> SensorDataResponse:
    """Trả về bản ghi cảm biến mới nhất của thiết bị"""
    record = (
        db.query(SensorData)
        .filter(SensorData.device_id == device_id)
        .order_by(SensorData.measured_at.desc())
        .first()
    )
    if not record:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Chưa có dữ liệu cảm biến")
    return record


# UC2-1 - Xem lịch sử dữ liệu theo thời gian (cho biểu đồ)
@router.get("/{device_id}/history", response_model=list[SensorDataResponse])
async def get_sensor_history(
    device_id: int,
    from_time: datetime,
    to_time:   datetime,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> list[SensorDataResponse]:
    """Trả về danh sách bản ghi cảm biến trong khoảng thời gian"""
    records = (
        db.query(SensorData)
        .filter(
            SensorData.device_id  == device_id,
            SensorData.measured_at >= from_time,
            SensorData.measured_at <= to_time,
        )
        .order_by(SensorData.measured_at.asc())
        .all()
    )
    return records