# app/services/device_service.py

from fastapi import HTTPException
from sqlalchemy.orm import Session
from models.domain_models import Device, User
from schemas.domain_schemas import DeviceCreateUpdate, DeviceUpdate, ThresholdUpdate, ModeUpdate
from repositories import device_repository, log_repository, user_device_repository
from mqtt.client import publish_command
from core.config import settings

def _log_action(db: Session, user: User, device_id: str, action_type: str, desc: str):
    log_repository.create(db, user.user_id, device_id, action_type, desc)


async def get_all_devices(db: Session, current_user: User) -> list[Device]:
    return device_repository.get_all(db)


async def create_device(db: Session, device_in: DeviceCreateUpdate, current_user: User) -> Device:
    if device_repository.get_by_name(db, device_in.name):
        raise HTTPException(status_code=400, detail="Mã thiết bị này đã tồn tại")
    
    new_device = device_repository.create(db, device_in.model_dump())
    _log_action(db, current_user, new_device.device_id, "DEVICE_CREATED", f"Admin thêm thiết bị {new_device.name}")
    return new_device


async def get_device(db: Session, device: Device, current_user: User) -> Device:
    _log_action(db, current_user, device.device_id, "DEVICE_DETAILS_VIEWED", f"{current_user.username} xem t/tin chi tiết thiết bị {device.name}")
    return device


async def update_device(db: Session, device_id: str, device_in: DeviceUpdate, current_user: User) -> Device:
    device = device_repository.get_by_id(db, device_id)
    if not device:
        raise HTTPException(status_code=404, detail="Không tìm thấy thiết bị")
    
    updated_device = device_repository.update_name(db, device, device_in.name)
    _log_action(db, current_user, device_id, "DEVICE_UPDATED", f"Cập nhật tên thiết bị thành {updated_device.name}")
    return updated_device


async def delete_device(db: Session, device: Device, current_user: User) -> None:
    device_id = device.device_id
    device_repository.delete(db, device)
    _log_action(db, current_user, device_id, "DEVICE_DELETED", "Đã xóa thiết bị khỏi hệ thống")


async def get_device_status(db: Session, device: Device, current_user: User) -> Device:
    _log_action(db, current_user, device.device_id, "DEVICE_STATUS_VIEWED", f"{current_user.username} xem trạng thái thiết bị {device.name}")
    return device


async def update_threshold(db: Session, device: Device, thresholds: ThresholdUpdate, current_user: User) -> Device:
    update_data = thresholds.model_dump(exclude_unset=True)
    
    user_device = user_device_repository.get_by_user_and_device(db, current_user.user_id, device.device_id)
    if not user_device:
        raise HTTPException(status_code=403, detail="Chưa chọn thiết bị nên không thể cài ngưỡng")
        
    updated_user_device = user_device_repository.update_thresholds(db, user_device, update_data)
    
    for k, v in update_data.items():
        setattr(device, k, getattr(updated_user_device, k))
        
    _log_action(db, current_user, device.device_id, "THRESHOLD_UPDATE", f"{current_user.username} cập nhật ngưỡng môi trường cá nhân cho thiết bị {device.name}")
    return device


async def change_mode(db: Session, device: Device, mode_in: ModeUpdate, current_user: User) -> Device:
    if mode_in.mode not in ["auto", "manual"]:
        raise HTTPException(status_code=400, detail="Mode chỉ được là 'auto' hoặc 'manual'")
        
    updated_device = device_repository.update_mode(db, device, mode_in.mode)
    _log_action(db, current_user, device.device_id, "MODE_CHANGE", f"Người dùng {current_user.username} chuyển chế độ sang {updated_device.mode}")
    
    try:
        await publish_command(settings.AIO_FEED_MODE, mode_in.mode)
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"Gửi lệnh tới thiết bị thất bại: {e}"
        )
    return updated_device


async def select_device(db: Session, device: Device, current_user: User) -> dict:
    device_id = device.device_id
    user_id = current_user.user_id
    
    # Kiểm tra chiếm quyền độc quyền
    active_record = user_device_repository.get_active_global_for_device(db, device_id)
    if active_record and active_record.user_id != current_user.user_id:
        raise HTTPException(
            status_code=400,
            detail="Thiết bị này đang được điều khiển bởi một người khác."
        )
    
    user_device_repository.deactivate_all_for_user(db, user_id)
    
    user_device = user_device_repository.get_by_user_and_device(db, user_id, device_id)
    if not user_device:
        user_device = user_device_repository.create(db, user_id, device_id)
        
    user_device_repository.set_active_status(db, user_device, True)
    
    _log_action(db, current_user, device.device_id, "DEVICE_SELECTED", f"Người dùng {current_user.username} đã chọn thiết bị {device.name} để thao tác")
    return {"message": f"Đã chọn thiết bị {device.name} thành công", "is_active": True}

async def deselect_device(db: Session, device: Device, current_user: User) -> dict:
    device_id = device.device_id
    user_id = current_user.user_id
    # set trạng thái đã chọn về False hết trước khi chọn 
    user_device_repository.deactivate_all_for_user(db, user_id)
    
    user_device = user_device_repository.get_by_user_and_device(db, user_id, device_id)
    if not user_device:
        user_device = user_device_repository.create(db, user_id, device_id)
    
    # Muốn tắt thì phải là người đang chọn 
    active_record = user_device_repository.get_active_global_for_device(db, device_id)
    if active_record and active_record.user_id != current_user.user_id:
        raise HTTPException(
            status_code=400,
            detail="Thiết bị này đang được điều khiển bởi một người khác."
        )
    user_device_repository.set_active_status(db, user_device, False)
    
    _log_action(db, current_user, device.device_id, "DEVICE_DESELECTED", f"Người dùng {current_user.username} đã bỏ chọn thao tác thiết bị {device.name} ")
    return {"message": f"Đã bỏ chọn thiết bị {device.name} thành công", "is_active": False}

async def check_active_device(db: Session, device: Device, current_user: User) -> dict:
    user_device = user_device_repository.get_by_user_and_device(db, current_user.user_id, device.device_id)
    is_active = user_device.is_active if user_device else False
    return {"device_id": device.device_id, "is_active": is_active}
