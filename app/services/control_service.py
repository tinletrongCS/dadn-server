# app/services/control_service.py

import logging
from sqlalchemy.orm import Session
from fastapi import HTTPException

from models.domain_models import Device, User
from schemas.domain_schemas import ControlCommandSchema, ControlResponse, AckCommandSchema, MessageResponse
from websocket.manager import ConnectionManager, ws_manager
from repositories import device_repository, command_repository, log_repository
from core.config import settings
from mqtt.client import publish_command

logger = logging.getLogger(__name__)

def _decide_commands(device: Device, violations: list[tuple]) -> list[tuple[str, str]]:
    commands = []
    for field, value, vtype in violations:
        if field == "soil_moisture":
            commands.append(("pump", "on" if vtype == "min" else "off"))
        elif field == "temperature":
            commands.append(("fan", "on" if vtype == "max" else "off"))
    return commands


# Điều khiển thủ công (UC5)
async def manual_control(
    actuator: str,
    device_id: int,
    body: ControlCommandSchema,
    db: Session,
    current_user: User
) -> ControlResponse:
    device = device_repository.get_by_id(db, device_id)
    if not device:
        raise HTTPException(status_code=404, detail="Thiết bị không tồn tại")

    if device.mode == "auto" or device.mode == "AUTO":
        raise HTTPException(
            status_code=409,
            detail="Thiết bị đang ở chế độ tự động. Chuyển sang manual trước khi điều khiển thủ công.",
        )

    if body.action not in ("True", "False"):
        raise HTTPException(status_code=422, detail="action phải là 'True' hoặc 'False'")
    
    is_active = (body.action == "True")

    if actuator == "pump":
        device.pump_status = is_active
        feed_key = settings.AIO_FEED_PUMP
    else:
        device.fan_status = is_active
        feed_key = settings.AIO_FEED_FAN 
        
    cmd = command_repository.create(db, device_id, actuator, body.action, current_user.user_id, "manual")

    log_repository.create(
        db=db,
        user_id=current_user.user_id,
        device_id=device_id,
        action_type=f"MANUAL_CONTROL_{actuator.upper()}",
        description=(f"{current_user.username} {'bật' if body.action == 'True' else 'tắt'} {'quạt' if actuator == 'fan' else 'máy bơm'} thủ công"),
    )

    # Payload publish lên Ada là string kèm theo id thiết bị
    try:
        mqtt_payload = f"{device_id}-{body.action}"
        await publish_command(feed_key, mqtt_payload)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Gửi lệnh tới thiết bị thất bại: {e}")

    await ws_manager.broadcast({
        "type":       "STATE_UPDATE",
        "device_id":  device_id,
        "actuator":   actuator,
        "action":     body.action,
        "source":     "manual",
        "command_id": cmd.command_id,
    })

    return ControlResponse(
        device_id=device_id,
        actuator=actuator,
        action=body.action,
        status="pending",
        command_id=cmd.command_id,
    )


# Lấy lệnh chưa xử lý (UC6)
def get_pending_commands(db: Session, device_id: int) -> list:
    commands = command_repository.get_pending(db, device_id)
    return [
        {
            "command_id": cmd.command_id,
            "actuator":   cmd.actuator,
            "action":     cmd.action,
            "source":     cmd.source,
            "issued_at":  cmd.issued_at,
        }
        for cmd in commands
    ]


# Xác nhận lệnh (UC6 / UC6-1) 
async def acknowledge_command(db: Session, device_id: int, body: AckCommandSchema) -> MessageResponse:
    cmd = command_repository.get_by_id(db, body.command_id, device_id)
    if not cmd:
        raise HTTPException(status_code=404, detail="Lệnh không tồn tại")

    if body.success:
        device = device_repository.get_by_id(db, device_id)
        command_repository.mark_done(db, cmd, device)

        log_repository.create(
            db=db,
            user_id=None,
            device_id=device_id,
            action_type=f"AUTO_CONTROL_{cmd.actuator.upper()}",
            description=f"Thiết bị xác nhận {cmd.action} {cmd.actuator} thành công",
        )

        await ws_manager.broadcast({
            "type":      "STATE_UPDATE",
            "device_id": device_id,
            "actuator":  cmd.actuator,
            "status":    cmd.action == "on",
        })

        return MessageResponse(message="Xác nhận thành công")
    else:
        command_repository.mark_error(db, cmd, body.error_detail)

        await emergency_alert(
            device_id=device_id,
            error_detail=body.error_detail or "Thiết bị báo lỗi không xác định",
            db=db,
            ws_manager=ws_manager,
        )
        return MessageResponse(message="Đã ghi nhận lỗi và phát cảnh báo")


# Điều khiển tự động (UC6)
async def auto_control(
    device_id:  int,
    violations: list[tuple],
    db:         Session,
    ws_manager: ConnectionManager,
) -> None:
    device = device_repository.get_by_id(db, device_id)
    if not device:
        return

    commands = _decide_commands(device, violations)

    for actuator, action in commands:
        current_status = getattr(device, f"{actuator}_status")
        desired_status = (action == "on")
        if current_status == desired_status:
            logger.info(f"[AUTO] {actuator} đã ở trạng thái {action} - bỏ qua lệnh trùng lặp")
            continue

        cmd = command_repository.create(db, device_id, actuator, action, None, "auto")

        log_repository.create(
            db=db,
            user_id=None,
            device_id=device_id,
            action_type=f"AUTO_CONTROL_{actuator.upper()}",
            description=f"Tự động {action} {actuator} do vượt ngưỡng",
        )

        await ws_manager.broadcast({
            "type":      "STATE_UPDATE",
            "device_id": device_id,
            "actuator":  actuator,
            "action":    action,
            "source":    "auto",
            "command_id": cmd.command_id,
        })

        try:
            feed_key = f"{actuator}-control"
            mqtt_payload = f"{device_id}-{action.upper()}"
            await publish_command(feed_key, mqtt_payload)
        except Exception as e:
            logger.error(f"[AUTO] Publish MQTT thất bại: {e}")
            await emergency_alert(device_id, str(e), db, ws_manager)

        logger.info(f"[AUTO] Đã gửi lệnh {action.upper()} -> {actuator} (command_id={cmd.command_id})")


# Cảnh báo lỗi khẩn cấp (UC6-1)
async def emergency_alert(
    device_id:    int,
    error_detail: str,
    db:           Session,
    ws_manager:   ConnectionManager,
) -> None:
    log_repository.create(
        db=db,
        user_id=None,
        device_id=device_id,
        action_type="CONTROL_ERROR",
        description=error_detail,
    )

    await ws_manager.broadcast({
        "type":         "EMERGENCY",
        "device_id":    device_id,
        "error_detail": error_detail,
        "message":      f"Không thể điều khiển thiết bị {device_id}: {error_detail}",
    })

    logger.error(f"[EMERGENCY] device_id={device_id} --- {error_detail}")