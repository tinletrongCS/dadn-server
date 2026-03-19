# UC1 - Thiết bị IoT gửi dữ liệu lên (không cần auth hoặc dùng device token)
@router.post("/sensors/data")
async def receive_sensor_data(body: SensorDataCreateSchema,
                              db: Session = Depends(get_db)) -> MessageResponse:
    """
    Nhận dữ liệu JSON từ IoT gateway.
    Sau khi lưu => tự động gọi threshold_service.check_and_alert()
    """

# UC2 - Xem dữ liệu mới nhất của một thiết bị
@router.get("/sensors/{device_id}/latest")
async def get_latest_sensor_data(device_id: str,
                                 db: Session = Depends(get_db),
                                 current_user: User = Depends(get_current_user)) -> SensorDataResponse:
    """Trả về bản ghi cảm biến mới nhất của thiết bị"""

# UC2-1 - Xem lịch sử dữ liệu theo thời gian (cho biểu đồ)
@router.get("/sensors/{device_id}/history")
async def get_sensor_history(device_id: str,
                             from_time: datetime, to_time: datetime,
                             db: Session = Depends(get_db),
                             current_user: User = Depends(get_current_user)) -> list[SensorDataResponse]:
    """Trả về danh sách bản ghi cảm biến trong khoảng thời gian"""