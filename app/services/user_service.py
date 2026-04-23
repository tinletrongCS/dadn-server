# app/services/user_service.py

from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from repositories import user_repository
from schemas.domain_schemas import UserUpdateFullName, UserAdminUpdate


async def get_all_users(db: Session):
    return user_repository.get_all(db)


async def get_user_by_id(db: Session, user_id: str):
    user = user_repository.get_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy người dùng")
    return user


async def update_my_profile(db: Session, current_user, data: UserUpdateFullName):
    full_name = data.full_name.strip()
    if not full_name:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Họ và tên không được để trống")
    updated = user_repository.update_full_name(db, current_user.user_id, full_name)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy người dùng")
    return updated


async def admin_update_user(db: Session, target_user_id: str, data: UserAdminUpdate):
    user = user_repository.get_by_id(db, target_user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy người dùng")
    
    full_name = data.full_name.strip() if data.full_name is not None else None
    if full_name is not None and not full_name:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Họ và tên không được để trống")
    
    if data.role_id is not None and data.role_id not in (1, 2):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="role_id chỉ được là 1 (admin) hoặc 2 (user)")
    
    updated = user_repository.admin_update(db, target_user_id, full_name, data.is_active, data.role_id)
    return updated


async def admin_toggle_status(db: Session, target_user_id: str, current_user_id: str):
    if str(target_user_id) == str(current_user_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Bạn không thể tự vô hiệu hóa tài khoản của mình")
    user = user_repository.get_by_id(db, target_user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy người dùng")
    updated = user_repository.update_status(db, target_user_id, not user.is_active)
    return updated


async def admin_delete_user(db: Session, target_user_id: str, current_user_id: str):
    if str(target_user_id) == str(current_user_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Bạn không thể xóa tài khoản của chính mình")
    user = user_repository.get_by_id(db, target_user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy người dùng")
    success = user_repository.delete(db, target_user_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Xóa người dùng thất bại")
    return {"message": f"Đã xóa người dùng '{user.username}' thành công"}
