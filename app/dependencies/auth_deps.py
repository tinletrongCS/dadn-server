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

# dùng kiểm tra thiết bị từ device_id có tồn tại hay không 
async def get_device_or_404(device_id: str, db: Session = Depends(get_db)) -> Device:
    device = db.query(Device).filter(Device.device_id == device_id).first()
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail=f"Không tìm thấy thiết bị mang mã {device_id}"
        )
    return device

# Đảm bảo rằng người dùng hiện tại nếu muốn thao tác thì phải có quyền admin 
# hoặc đã lựa chọn thiết bị này trước đó 
async def require_active_device(
    device_id: int,
    current_user: User = Depends(get_current_user),
    db:  Session = Depends(get_db)
) -> Device:
    """Dependency đảm bảo người dùng hiện tại đã chọn (active) thiết bị này."""
    from repositories import user_device_repository
    device = await get_device_or_404(str(device_id), db)

    if current_user.role_id == 1:
        return device

    user_device = user_device_repository.get_by_user_and_device(db, current_user.user_id, device_id)
    if not user_device or not user_device.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bạn chưa chọn hoặc không có quyền thao tác trên thiết bị này"
        )
    return device

