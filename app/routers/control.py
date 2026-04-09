from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from dependencies.auth_deps import get_current_user, require_active_device
from models.domain_models import User, Device
from schemas.domain_schemas import ControlCommandSchema, ControlResponse, AckCommandSchema, MessageResponse
from services import control_service

router = APIRouter()

# UC5: Điều khiển thủ công máy bơm
# Done
@router.post("/{device_id}/pump", response_model=ControlResponse)
async def control_pump(
    device_id: int,
    body:      ControlCommandSchema,
    db:        Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    device: Device = Depends(require_active_device),
):
    return await control_service.manual_control("pump", device_id, body, db, current_user)

# UC5: Điều khiển thủ công quạt 
# Done
@router.post("/{device_id}/fan", response_model=ControlResponse)
async def control_fan(
    device_id: int,
    body:      ControlCommandSchema,
    db:        Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    device: Device = Depends(require_active_device),
):
    return await control_service.manual_control("fan", device_id, body, db, current_user)

# UC6: IoT polling lệnh đang chờ
@router.get("/{device_id}/pending")
async def get_pending_commands(
    device_id: int,
    db:        Session = Depends(get_db),
):
    return control_service.get_pending_commands(db, device_id)

# UC6 / UC6-1: IoT gửi ACK kết quả thực thi 
@router.post("/{device_id}/ack", response_model=MessageResponse)
async def acknowledge_command(
    device_id: int,
    body:      AckCommandSchema,
    db:        Session = Depends(get_db),
):
    return await control_service.acknowledge_command(db, device_id, body)