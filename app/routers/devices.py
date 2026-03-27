from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from models.domain_models import Device, ActivityLog, User
from dependencies.auth_deps import get_current_user, require_admin, get_device_or_404
from schemas.domain_schemas import DeviceResponse, DeviceStatusResponse, MessageResponse, DeviceCreateUpdate
from mqtt.client import publish_command
from core.config import settings

router = APIRouter()

class DeviceCreate(BaseModel):
    device_id: str 
    name: str
    mode: Optional[str] = "manual"
    temp_min: Optional[float] = None
    temp_max: Optional[float] = None
    humid_min: Optional[float] = None
    humid_max: Optional[float] = None
    soil_min: Optional[float] = None
    soil_max: Optional[float] = None
    light_min: Optional[int] = None
    light_max: Optional[int] = None

class DeviceUpdate(BaseModel):
    name: str

class ThresholdUpdate(BaseModel):
    temp_min: Optional[float] = None
    temp_max: Optional[float] = None
    humid_min: Optional[float] = None
    humid_max: Optional[float] = None
    soil_min: Optional[float] = None
    soil_max: Optional[float] = None
    light_min: Optional[int] = None
    light_max: Optional[int] = None

class ModeUpdate(BaseModel):
    mode: str  # Chỉ nhận "auto" hoặc "manual"



# Lưu vào bảng activity_log
def log_activity(db: Session, user_id, device_id: str, action_type: str, desc: str):
    log = ActivityLog(user_id=user_id, device_id=device_id, action_type=action_type, description=desc)
    db.add(log)
    db.commit()



# 1. Xem danh sách thiết bị (UC10A) 
@router.get("", response_model=List[DeviceResponse])
async def get_all_devices(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    devices = db.query(Device).all()
    return devices

# 2. Thêm thiết bị mới (UC10B) - CHỈ ADMIN 
@router.post("", response_model=DeviceResponse, status_code=status.HTTP_201_CREATED)
async def create_device(
    device_in: DeviceCreateUpdate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(require_admin)
):
    if db.query(Device).filter(Device.name == device_in.name).first():
        raise HTTPException(status_code=400, detail="Mã thiết bị này đã tồn tại")
    
    new_device = Device(**device_in.model_dump())
    db.add(new_device)
    db.commit()
    db.refresh(new_device)
    
    log_activity(db, current_user.user_id, new_device.device_id, "DEVICE_CREATED", f"Admin thêm thiết bị {new_device.name}")
    return new_device

# 3. Xem chi tiết 1 thiết bị (UC10A)
@router.get("/{device_id}", response_model=DeviceResponse)
async def get_device(
    device_id: str,
    device: Device = Depends(get_device_or_404),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)):
    log_activity(db, current_user.user_id, device_id, "DEVICE_DETAILS_VIEWED", f"{current_user.full_name} " f"xem t/tin chi tiết thiết bị {device.name}")
    return device

# 4. Chỉnh sửa thông tin cơ bản (UC10C) - CHỈ ADMIN
@router.put("/{device_id}", response_model=DeviceResponse)
async def update_device(
    device_id: str, 
    device_in: DeviceUpdate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(require_admin)
):
    device = db.query(Device).filter(Device.device_id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Không tìm thấy thiết bị")
    
    device.name = device_in.name
    db.commit()
    db.refresh(device)
    log_activity(db, current_user.user_id, device_id, "DEVICE_UPDATED", f"Cập nhật tên thiết bị thành {device.name}")
    return device

# 5. Xóa thiết bị (UC10D) - CHỈ ADMIN
@router.delete("/{device_id}", response_model=MessageResponse)
async def delete_device(
    device_id: str, 
    device: Device = Depends(get_device_or_404),
    db: Session = Depends(get_db), 
    current_user: User = Depends(require_admin)
):   
    db.delete(device)
    db.commit()
    log_activity(db, current_user.user_id, device_id, "DEVICE_DELETED", "Đã xóa thiết bị khỏi hệ thống")
    return {"message": "Xóa thiết bị thành công"}

# 6. Xem trạng thái nhanh (UC2)
@router.get("/{device_id}/status", response_model=DeviceStatusResponse)
async def get_device_status(
    device_id: str, db: Session = Depends(get_db), 
    device: Device = Depends(get_device_or_404),
    current_user: User = Depends(get_current_user),
    ):
    log_activity(db, current_user.user_id, device_id, "DEVICE_STATUS_VIEWED", f"{current_user.full_name} " f"xem trạng thái thiết bị {device.name}")
    return device

# 7. Cài đặt ngưỡng cảnh báo (UC3)
@router.patch("/{device_id}/threshold", response_model=DeviceResponse)
async def update_threshold(
    device_id: str, 
    thresholds: ThresholdUpdate, 
    device: Device = Depends(get_device_or_404),
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    update_data = thresholds.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(device, key, value)
        
    db.commit()
    db.refresh(device)
    log_activity(db, current_user.user_id, device_id, "THRESHOLD_UPDATE", "Cập nhật ngưỡng môi trường")
    return device

# 8. Chuyển đổi Auto / Manual (UC5/UC6)
@router.patch("/{device_id}/mode", response_model=DeviceStatusResponse)
async def change_mode(
    device_id: str, 
    mode_in: ModeUpdate,
    device: Device = Depends(get_device_or_404), 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)):
    if mode_in.mode not in ["auto", "manual"]:
        raise HTTPException(status_code=400, detail="Mode chỉ được là 'auto' hoặc 'manual'")
        
    device.mode = mode_in.mode.lower()
    db.commit()
    db.refresh(device)
    log_activity(db, current_user.user_id, device_id, "MODE_CHANGE", f"Người dùng {current_user.full_name} chuyển chế độ sang {device.mode}")
    try:
        await publish_command(settings.AIO_FEED_MODE, mode_in.mode)
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"Gửi lệnh tới thiết bị thất bại: {e}"
        )
    return device