# app/services/threshold_service.py

import logging
from sqlalchemy.orm import Session

from models.domain_models import Device, SensorData, ActivityLog
from websocket.manager import ConnectionManager

logger = logging.getLogger(__name__)


# Hàm ghi log nội bộ 
def write_log(
    db:          Session,
    user_id,               # UUID | None
    device_id:   int | None,
    action_type: str,
    description: str
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
def _detect_violations(device: Device, record: SensorData) -> list[tuple]:
    """
    Trả về list các (field, value, 'min'|'max') bị vi phạm.
    Ví dụ: [("temperature", 38.5, "max"), ("soil_moisture", 12.0, "min")]
    """
    checks = [
        ("temperature",     record.temperature,     device.temp_min,  device.temp_max),
        ("air_humidity",    record.air_humidity,     device.humid_min, device.humid_max),
        ("soil_moisture",   record.soil_moisture,    device.soil_min,  device.soil_max),
        ("light_intensity", record.light_intensity,  device.light_min, device.light_max),
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
    violations = _detect_violations(device, record)

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
        await ws_manager.broadcast({
            "type":       "ALERT",
            "device_id":  device_id,
            "field":      field,
            "value":      value,
            "threshold":  vtype,   # "min" | "max"
            "message":    description,
        })

        logger.warning(f"[THRESHOLD] {description} — device_id={device_id}")

    # UC6: Nếu auto mode → tự động điều khiển
    if device.mode == "auto":
        from services.control_service import auto_control
        await auto_control(device_id, violations, db, ws_manager)