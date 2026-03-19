# UC10A - Xem danh sách thiết bị
@router.get("/devices")
async def list_devices(db: Session = Depends(get_db),
                       current_user: User = Depends(get_current_user)) -> list[DeviceResponse]:
    """Trả về danh sách thiết bị thuộc quyền user (admin thấy tất cả)"""

# UC10B - Thêm thiết bị mới
@router.post("/devices")
async def create_device(body: DeviceCreateSchema,
                        db: Session = Depends(get_db),
                        current_user: User = Depends(require_admin)) -> DeviceResponse:
    """Tạo bản ghi thiết bị mới, ghi log UC7"""

# UC10C - Chỉnh sửa thông tin thiết bị
@router.put("/devices/{device_id}")
async def update_device(device_id: str, body: DeviceUpdateSchema,
                        db: Session = Depends(get_db),
                        current_user: User = Depends(get_current_user)) -> DeviceResponse:
    """Cập nhật thông tin thiết bị, ghi log UC7"""

# UC10D - Xóa thiết bị
@router.delete("/devices/{device_id}")
async def delete_device(device_id: str,
                        db: Session = Depends(get_db),
                        current_user: User = Depends(require_admin)) -> MessageResponse:
    """Soft delete hoặc hard delete thiết bị, ghi log UC7"""

# UC3 - Cài đặt ngưỡng cảnh báo (nằm trong device)
@router.patch("/devices/{device_id}/threshold")
async def set_threshold(device_id: str, body: ThresholdSchema,
                        db: Session = Depends(get_db),
                        current_user: User = Depends(get_current_user)) -> DeviceResponse:
    """Cập nhật các giá trị ngưỡng min/max cho device, ghi log"""

# Thay đổi chế độ auto/manual
@router.patch("/devices/{device_id}/mode")
async def set_device_mode(device_id: str, body: ModeSchema,
                          db: Session = Depends(get_db),
                          current_user: User = Depends(get_current_user)) -> DeviceResponse:
    """Chuyển device sang chế độ 'auto' hoặc 'manual'"""