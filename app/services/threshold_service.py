# app/services/threshold_service.py

import logging
from sqlalchemy.orm import Session

from models.domain_models import Device, SensorData, ActivityLog
from websocket.manager import ConnectionManager
from repositories import log_repository
from services.notification_service import broadcast_notification

logger = logging.getLogger(__name__)


# Hàm ghi log nội bộ 
def write_log(
    db:          Session,
    user_id,               # UUID | None
    device_id:   int | None,
    action_type: str,
    description: str
) -> ActivityLog:
    return log_repository.create(db, user_id, device_id, action_type, description)


# Kiểm tra một cặp min/max 
def _is_violated(value: float, mn, mx) -> str | None:
    """Trả về 'min' | 'max' | None."""
    if mn is not None and value < mn:
        return "min"
    if mx is not None and value > mx:
        return "max"
    return None


# So sánh toàn bộ sensor với ngưỡng của device
# ->> đổi lại: so sánh với ngưỡng của người dùng hiện tại đang đăng nhập vào dùng t/bị 
def _detect_violations(device: Device, record: SensorData, active_record=None) -> list[tuple]:
    """
    Trả về list các (field, value, 'min'|'max') bị vi phạm.
    Ví dụ: [("temperature", 38.5, "max"), ("soil_moisture", 12.0, "min")]
    """
    def get_threshold(field_name):
        # Lấy từ active_record nếu có, nếu không thì fallback về device
        if active_record and getattr(active_record, field_name) is not None:
            return getattr(active_record, field_name)
        return getattr(device, field_name)

    checks = [
        ("temperature",     record.temperature,     get_threshold("temp_min"),  get_threshold("temp_max")),
        ("air_humidity",    record.air_humidity,     get_threshold("humid_min"), get_threshold("humid_max")),
        ("soil_moisture",   record.soil_moisture,    get_threshold("soil_min"),  get_threshold("soil_max")),
        ("light_intensity", record.light_intensity,  get_threshold("light_min"), get_threshold("light_max")),
    ]
    violations = []
    for field, value, mn, mx in checks:
        vtype = _is_violated(value, mn, mx)
        if vtype:
            violations.append((field, value, vtype))
    return violations


# Hàm chính — gọi sau mỗi lần nhận sensor data 
async def check_and_alert(
    device_id:  int,
    record:     SensorData,
    device:     Device,
    db:         Session,
    ws_manager: ConnectionManager,
) -> None:
    """
    UC4: Kiểm tra ngưỡng sau khi nhận sensor data mới.
    Nếu vi phạm:
      1. Ghi ActivityLog
      2. Push ALERT qua WebSocket tới Frontend
      3. Nếu mode='auto' -> gọi auto_control()
    """
    from repositories import user_device_repository
    active_record = user_device_repository.get_active_global_for_device(db, device_id)
    
    violations = _detect_violations(device, record, active_record)

    if not violations:
        return  # tất cả trong ngưỡng an toàn

    for field, value, vtype in violations:
        action_type = f"ALERT_{field.upper()}"
        # description = (
        #     f"{field} = {value} vượt ngưỡng "
        #     f"{'tối thiểu' if vtype == 'min' else 'tối đa'}"
        # )

        description = (
            f"{field}"
            f"{'quá thấp' if vtype == 'min' else 'quá cao'}"
            f" so với ngưỡng {'tối thiểu' if vtype == 'min' else 'tối đa'}"
        )

        # UC7: Ghi log
        write_log(
            db=db,
            user_id=None,
            device_id=device_id,
            action_type=action_type,
            description=description,
        )

        # UC4-1: Push ALERT lên WebSocket
        await broadcast_notification(
            "ALERT",
            description,
            manager=ws_manager,
            device_id=device_id,
            severity="warning",
            field=field,
            value=value,
            threshold=vtype,
        )

        logger.warning(f"[THRESHOLD] {description} — device_id={device_id}")

    # UC6: Nếu auto mode → tự động điều khiển
    if device.mode == "auto":
        from services.control_service import auto_control
        await auto_control(device_id, violations, db, ws_manager)
