# UC5 - Điều khiển thủ công
@router.post("/control/{device_id}/pump")
async def control_pump(device_id: str, body: ControlCommandSchema,
                       db: Session = Depends(get_db),
                       current_user: User = Depends(get_current_user)) -> ControlResponse:
    """
    Bật/tắt máy bơm thủ công.
    Kiểm tra nếu đang ở auto mode => cảnh báo.
    Gọi ghi log UC5A sau khi thực thi.
    """

@router.post("/control/{device_id}/fan")
async def control_fan(device_id: str, body: ControlCommandSchema,
                      db: Session = Depends(get_db),
                      current_user: User = Depends(get_current_user)) -> ControlResponse:
    """Bật/tắt quạt thủ công, ghi log"""

# UC6 - Điều khiển tự động (gọi nội bộ từ threshold_service, không expose trực tiếp)
# Nhưng cần endpoint để IoT device polling lệnh
@router.get("/control/{device_id}/pending-commands")
async def get_pending_commands(device_id: str,
                               db: Session = Depends(get_db)) -> list[CommandResponse]:
    """IoT device polling để lấy lệnh đang chờ thực thi"""

@router.post("/control/{device_id}/ack")
async def acknowledge_command(device_id: str, body: AckCommandSchema,
                              db: Session = Depends(get_db)) -> MessageResponse:
    """
    IoT device báo đã thực thi lệnh (thành công hay thất bại).
    Nếu thất bại => kích hoạt UC6-1 Cảnh báo lỗi khẩn cấp.
    """