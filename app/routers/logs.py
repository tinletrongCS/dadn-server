# UC8 - Xem lịch sử hoạt động
@router.get("/logs")
async def get_activity_logs(device_id: str | None = None,
                            from_time: datetime | None = None,
                            to_time: datetime | None = None,
                            action_type: str | None = None,
                            page: int = 1, limit: int = 20,
                            db: Session = Depends(get_db),
                            current_user: User = Depends(get_current_user)) -> PaginatedLogResponse:
    """
    UC8 + UC8A: Lấy danh sách log, hỗ trợ filter theo
    device_id, khoảng thời gian, loại action.
    """

# UC7 - Ghi log (internal, không expose ra ngoài — gọi nội bộ)
def write_log(db: Session, user_id: UUID | None,
              device_id: str | None,
              action_type: str,
              description: str) -> ActivityLog:
    """Hàm internal dùng chung cho mọi UC cần ghi log"""