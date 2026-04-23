from typing import List, Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from database import get_db
from models.domain_models import Device, User
from dependencies.auth_deps import get_current_user, require_admin, get_device_or_404, require_active_device
from schemas.domain_schemas import (
    DeviceResponse, DeviceStatusResponse, MessageResponse, 
    DeviceCreateUpdate, DeviceUpdate, ThresholdUpdate, ModeUpdate, ActiveDeviceResponse,
    UserDeviceResponse
)
from services import device_service

router = APIRouter()


# 1. Xem danh sách thiết bị (UC10A) 
# Done
@router.get("", response_model=List[DeviceResponse])
async def get_all_devices(
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)):
    return await device_service.get_all_devices(db, current_user)

# 1.1 Xem danh sách thiết bị đang hoạt động kèm người đang thao tác 
# CHỈ ADMIN
@router.get("/active", response_model=List[ActiveDeviceResponse])
async def get_active_device(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    return await device_service.get_active_device(db, current_user)
    
# 2. Thêm thiết bị mới (UC10B) 
# CHỈ ADMIN 
# Done
@router.post("", response_model=DeviceResponse, status_code=status.HTTP_201_CREATED)
async def create_device(
    device_in: DeviceCreateUpdate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(require_admin)
):
    return await device_service.create_device(db, device_in, current_user)

# 12. Lấy dữ liệu ngưỡng trong user_device cho người dùng hiện tại (nếu admin thì lấy tất cả)
# Done
@router.get("/user-threshold", response_model=List[UserDeviceResponse])
async def get_user_threshold(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role_id == 1:
        return await device_service.get_all_user_threshold(db)
    return await device_service.get_user_threshold(db, current_user)

# 3. Xem chi tiết 1 thiết bị (UC10A)
# Done
@router.get("/{device_id}", response_model=DeviceResponse)
async def get_device(
    device_id: str,
    device: Device = Depends(get_device_or_404),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await device_service.get_device(db, device, current_user)

# 4. Chỉnh sửa thông tin cơ bản (UC10C) 
# CHỈ ADMIN
# Done
@router.put("/{device_id}", response_model=DeviceResponse)
async def update_device(
    device_id: str, 
    device_in: DeviceUpdate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(require_admin)
):
    return await device_service.update_device(db, device_id, device_in, current_user)

# 5. Xóa thiết bị (UC10D) 
# CHỈ ADMIN
# Done
@router.delete("/{device_id}", response_model=MessageResponse)
async def delete_device(
    device_id: str, 
    device: Device = Depends(get_device_or_404),
    db: Session = Depends(get_db), 
    current_user: User = Depends(require_admin)
):   
    await device_service.delete_device(db, device, current_user)
    return {"message": "Xóa thiết bị thành công"}

# 6. Xem trạng thái nhanh (UC2)
# Done
@router.get("/{device_id}/status", response_model=DeviceStatusResponse)
async def get_device_status(
    device_id: str, 
    db: Session = Depends(get_db), 
    device: Device = Depends(get_device_or_404),
    current_user: User = Depends(get_current_user),
):
    return await device_service.get_device_status(db, device, current_user)

# 7. Cài đặt ngưỡng cảnh báo (UC3)
# Done
@router.patch("/{device_id}/threshold", response_model=DeviceResponse)
async def update_threshold(
    device_id: str, 
    thresholds: ThresholdUpdate, 
    device: Device = Depends(require_active_device),
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    return await device_service.update_threshold(db, device, thresholds, current_user)

# 8. Chuyển đổi Auto / Manual (UC5/UC6)
# Done
@router.patch("/{device_id}/mode", response_model=DeviceStatusResponse)
async def change_mode(
    device_id: str, 
    mode_in: ModeUpdate,
    device: Device = Depends(require_active_device), 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    return await device_service.change_mode(db, device, mode_in, current_user)

# 9. Chọn thiết bị trước khi thao tác 
# Done 
@router.post("/{device_id}/select")
async def select_device(
    device_id: str,
    device: Device = Depends(get_device_or_404),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await device_service.select_device(db, device, current_user)

# 10. Bỏ chọn thiết bị
# Done
@router.post("/{device_id}/deselect")
async def deselect_device(
    device_id: str,
    device: Device = Depends(get_device_or_404),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await device_service.deselect_device(db, device, current_user)

# 11. API này quan trọng - khi làm giao diện cần chú ý
# Nếu thiết bị đang có người sử dụng thì các nút điều khiển/chọn/... sẽ bị làm mờ 
# ko cho bấm 
# Done 
@router.get("/{device_id}/check-active")
async def check_active_device(
    device_id: str,
    device: Device = Depends(get_device_or_404),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await device_service.check_active_device(db, device, current_user)
