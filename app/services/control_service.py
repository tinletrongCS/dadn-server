# app/services/control_service.py

import logging
from sqlalchemy.orm import Session

from models.domain_models import Device, PendingCommand, ActivityLog
from websocket.manager import ConnectionManager
from services.threshold_service import write_log

logger = logging.getLogger(__name__)


# ── Ánh xạ violation → lệnh actuator ─────────────────────
def _decide_commands(
    device:     Device,
    violations: list[tuple]
) -> list[tuple[str, str]]:
    """
    Trả về list (actuator, action) cần thực thi.
    Logic mặc định:
      soil_moisture < min  → bật bơm (pump on)
      soil_moisture > max  → tắt bơm (pump off)
      temperature   > max  → bật quạt (fan on)
      temperature   < min  → tắt quạt (fan off)
    """
    commands = []
    for field, value, vtype in violations:
        if field == "soil_moisture":
            commands.append(("pump", "on" if vtype == "min" else "off"))
        elif field == "temperature":
            commands.append(("fan", "on" if vtype == "max" else "off"))
    return commands


# ── Điều khiển tự động (UC6) ──────────────────────────────
async def auto_control(
    device_id:  int,
    violations: list[tuple],
    db:         Session,
    ws_manager: ConnectionManager,
) -> None:
    """
    UC6: Tự động bật/tắt actuator khi phát hiện vi phạm ngưỡng.
    Flow:
      1. Quyết định lệnh từ violations
      2. Kiểm tra trạng thái hiện tại tránh spam
      3. INSERT pending_commands
      4. Ghi ActivityLog (UC6A)
      5. Push STATE_UPDATE qua WebSocket (UC6B)
      6. Publish MQTT lên Adafruit feed
    """
    device = db.query(Device).filter(
        Device.device_id == device_id
    ).first()
    if not device:
        return

    commands = _decide_commands(device, violations)

    for actuator, action in commands:
        # Kiểm tra thiết bị đã đúng trạng thái chưa → tránh spam
        current_status = getattr(device, f"{actuator}_status")
        desired_status = (action == "on")
        if current_status == desired_status:
            logger.info(
                f"[AUTO] {actuator} đã ở trạng thái {action} "
                f"— bỏ qua lệnh trùng lặp"
            )
            continue

        # INSERT pending_commands
        cmd = PendingCommand(
            device_id=device_id,
            actuator=actuator,
            action=action,
            issued_by=None,      # hệ thống tự động
            source="auto",
            status="pending",
        )
        db.add(cmd)
        db.commit()
        db.refresh(cmd)

        # UC6A: Ghi ActivityLog
        write_log(
            db=db,
            user_id=None,
            device_id=device_id,
            action_type=f"AUTO_CONTROL_{actuator.upper()}",
            description=f"Tự động {action} {actuator} do vượt ngưỡng",
        )

        # UC6B: Push STATE_UPDATE lên WebSocket
        await ws_manager.broadcast({
            "type":      "STATE_UPDATE",
            "device_id": device_id,
            "actuator":  actuator,
            "action":    action,
            "source":    "auto",
            "command_id": cmd.command_id,
        })

        # Publish MQTT lên Adafruit feed
        try:
            from mqtt.client import publish_command
            feed_key = f"{actuator}-control"   # pump-control | fan-control
            await publish_command(feed_key, action.upper())
        except Exception as e:
            logger.error(f"[AUTO] Publish MQTT thất bại: {e}")
            await emergency_alert(device_id, str(e), db, ws_manager)

        logger.info(
            f"[AUTO] Đã gửi lệnh {action.upper()} → {actuator} "
            f"(command_id={cmd.command_id})"
        )


# ── Cảnh báo lỗi khẩn cấp (UC6-1) ───────────────────────
async def emergency_alert(
    device_id:    int,
    error_detail: str,
    db:           Session,
    ws_manager:   ConnectionManager,
) -> None:
    """
    UC6-1: Broadcast EMERGENCY khi lệnh điều khiển thất bại.
    Được gọi từ:
      - auto_control() khi publish MQTT lỗi
      - POST /control/{id}/ack khi thiết bị báo thất bại
    """
    # Ghi log lỗi
    write_log(
        db=db,
        user_id=None,
        device_id=device_id,
        action_type="CONTROL_ERROR",
        description=error_detail,
    )

    # Broadcast EMERGENCY tới toàn bộ client WebSocket
    await ws_manager.broadcast({
        "type":         "EMERGENCY",
        "device_id":    device_id,
        "error_detail": error_detail,
        "message":      f"Không thể điều khiển thiết bị {device_id}: {error_detail}",
    })

    logger.error(f"[EMERGENCY] device_id={device_id} — {error_detail}")