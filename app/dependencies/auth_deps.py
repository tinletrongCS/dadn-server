from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from database import get_db
from models.domain_models import User, Device
from core.security import verify_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    payload = verify_token(token)
    user_id: str = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token không chứa user_id"
        )
    
    user = db.query(User).filter(User.user_id == user_id).first()
    if user is None or user.is_active == False:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Tài khoản không tồn tại hoặc đã bị khóa")
    return user 

async def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role_id != 1:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Không đủ quyền truy cập. Yêu cầu quyền Admin.")
    return current_user

async def get_device_or_404(device_id: str, db: Session = Depends(get_db)) -> Device:
    device = db.query(Device).filter(Device.device_id == device_id).first()
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail=f"Không tìm thấy thiết bị mang mã {device_id}"
        )
    return device

async def require_active_device(
    device_id: int,
    current_user: User = Depends(get_current_user),
    db:  Session = Depends(get_db)) -> Device:
    from repositories import user_device_repository
    device = await get_device_or_404(str(device_id), db)

    if current_user.role_id == 1:
        return device

    # Lấy ra phiên điều khiển của thiết bị này trên toàn hệ thống
    active_session = user_device_repository.get_active_global_for_device(db, device_id)

    # Nếu thiết bị đang có người dùng, nhưng lại KHÔNG PHẢI là người dùng hiện tại
    if active_session and active_session.user_id != current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cảnh báo: Thiết bị này đang được điều khiển bởi một người khác"
        )

    # Nếu thiết bị chưa ai sử dụng, hoặc chính User này có bản ghi nhưng đang là False
    if not active_session or active_session.user_id != current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cảnh báo: Bạn cần lựa chọn thiết bị này trước khi thao tác"
        )
    return device