# app/routers/control.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from dependencies.auth_deps import get_current_user, get_device_or_404
from models.domain_models import User, Device, PendingCommand
from schemas.domain_schemas import (
    ControlCommandSchema,
    ControlResponse,
    AckCommandSchema,
    MessageResponse,
)
from services.control_service import emergency_alert
from services.threshold_service import write_log
from websocket.manager import ws_manager
from mqtt.client import publish_command
from core.config import settings

router = APIRouter()


# UC5: Điều khiển thủ công máy bơm
@router.post("/{device_id}/pump", response_model=ControlResponse)
async def control_pump(
    device_id: int,
    body:      ControlCommandSchema,
    db:        Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await _manual_control(
        actuator="pump",
        device_id=device_id,
        body=body,
        db=db,
        current_user=current_user,
    )


# UC5: Điều khiển thủ công quạt 
@router.post("/{device_id}/fan", response_model=ControlResponse)
async def control_fan(
    device_id: int,
    body:      ControlCommandSchema,
    db:        Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await _manual_control(
        actuator="fan",
        device_id=device_id,
        body=body,
        db=db,
        current_user=current_user,
    )


# UC6: IoT polling lệnh đang chờ
@router.get("/{device_id}/pending")
async def get_pending_commands(
    device_id: int,
    db:        Session = Depends(get_db),
):
    """
    IoT gateway gọi endpoint này định kỳ để lấy lệnh chờ thực thi.
    Không cần user auth — thiết bị dùng device_id làm định danh.
    """
    commands = (
        db.query(PendingCommand)
        .filter(
            PendingCommand.device_id == device_id,
            PendingCommand.status   == "pending",
        )
        .order_by(PendingCommand.issued_at.asc())
        .all()
    )
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


# UC6 / UC6-1: IoT gửi ACK kết quả thực thi 
@router.post("/{device_id}/ack", response_model=MessageResponse)
async def acknowledge_command(
    device_id: int,
    body:      AckCommandSchema,
    db:        Session = Depends(get_db),
):
    """
    Thiết bị báo kết quả sau khi thực thi lệnh:
      - success=True  → cập nhật trạng thái device + ghi log + push WS
      - success=False → gọi emergency_alert() (UC6-1)
    """
    cmd = db.query(PendingCommand).filter(
        PendingCommand.command_id == body.command_id,
        PendingCommand.device_id  == device_id,
    ).first()

    if not cmd:
        raise HTTPException(status_code=404, detail="Lệnh không tồn tại")

    from datetime import datetime, timezone
    cmd.acked_at = datetime.now(timezone.utc)

    if body.success:
        # Cập nhật trạng thái thực tế của device
        device = db.query(Device).filter(
            Device.device_id == device_id
        ).first()
        if device:
            setattr(device, f"{cmd.actuator}_status", cmd.action == "on")

        cmd.status = "done"
        db.commit()

        # UC6A: Ghi log
        write_log(
            db=db,
            user_id=None,
            device_id=device_id,
            action_type=f"AUTO_CONTROL_{cmd.actuator.upper()}",
            description=f"Thiết bị xác nhận {cmd.action} {cmd.actuator} thành công",
        )

        # UC6B: Push STATE_UPDATE
        await ws_manager.broadcast({
            "type":      "STATE_UPDATE",
            "device_id": device_id,
            "actuator":  cmd.actuator,
            "status":    cmd.action == "on",
        })

        return MessageResponse(message="Xác nhận thành công")

    else:
        cmd.status       = "error"
        cmd.error_detail = body.error_detail
        db.commit()

        # UC6-1: Cảnh báo khẩn cấp
        await emergency_alert(
            device_id=device_id,
            error_detail=body.error_detail or "Thiết bị báo lỗi không xác định",
            db=db,
            ws_manager=ws_manager,
        )

        return MessageResponse(message="Đã ghi nhận lỗi và phát cảnh báo")


# Hàm dùng chung cho pump và fan
async def _manual_control(
    actuator:     str,
    device_id:    int,
    body:         ControlCommandSchema,
    db:           Session,
    current_user: User,) -> ControlResponse:

    # Kiểm tra device tồn tại
    device = db.query(Device).filter(
        Device.device_id == device_id
    ).first()
    if not device:
        raise HTTPException(status_code=404, detail="Thiết bị không tồn tại")

    # Cảnh báo nếu đang ở auto mode
    if device.mode == "auto" or device.mode == "AUTO":
        raise HTTPException(
            status_code=409,
            detail=(
                "Thiết bị đang ở chế độ tự động. "
                "Chuyển sang manual trước khi điều khiển thủ công."
            ),
        )

    # Validate action
    if body.action not in ("True", "False"):
        raise HTTPException(
            status_code=422,
            detail="action phải là 'True' hoặc 'False'"
        )
    
    # lấy trạng thái hiện tại muốn chuyển 
    is_active = (body.action == "True")

    if actuator == "pump":
        device.pump_status = is_active
        feed_key = settings.AIO_FEED_PUMP
    else:
        device.fan_status = is_active
        feed_key = settings.AIO_FEED_FAN 
    # INSERT pending_commands
    cmd = PendingCommand(
        device_id=device_id,
        actuator=actuator,
        action=body.action,
        issued_by=current_user.user_id,
        source="manual",
        status="pending",
    )
    db.add(cmd)
    db.commit()
    db.refresh(cmd)

    # UC5A: Ghi ActivityLog
    write_log(
        db=db,
        user_id=current_user.user_id,
        device_id=device_id,
        action_type=f"MANUAL_CONTROL_{actuator.upper()}",
        description=(
            f"{current_user.username} "
            f"{'bật' if body.action == 'True' else 'tắt'} {'quạt' if actuator == 'fan' else 'máy bơm'} thủ công"
        ),

    )

    # Publish MQTT lên Adafruit feed - lấy cái feed_key ở trên 
    try:
        await publish_command(feed_key, body.action)
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"Gửi lệnh tới thiết bị thất bại: {e}"
        )

    # UC5B: Push STATE_UPDATE qua WebSocket
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