# app/services/auth_service.py

from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from models.domain_models import User
from schemas.domain_schemas import UserCreate
from core.security import verify_password, create_access_token, get_password_hash
from repositories import user_repository, log_repository, device_repository

def _log_action(db: Session, user: User, device_id: str, action_type: str, desc: str):
    log_repository.create(db, user.user_id, device_id, action_type, desc)

async def register(db: Session, user_in: UserCreate):
    if user_repository.get_by_username(db, user_in.username):
        raise HTTPException(status_code=400, detail="Tên đăng nhập đã tồn tại")
    if user_repository.get_by_email(db, user_in.email):
        raise HTTPException(status_code=400, detail="Tài khoản email này đã được đăng ký")
    
    password_hash = get_password_hash(user_in.password)
    new_user = user_repository.create(
        db,
        user_in.username,
        user_in.email,
        password_hash,
        user_in.full_name,
        user_in.role_id,
    )
    return new_user

async def login(db: Session, username: str, password: str):
    user = user_repository.get_by_username(db, username)
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sai tên đăng nhập hoặc mật khẩu",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Ký token với nội dung (sub) là user_id
    access_token = create_access_token(data={"sub": str(user.user_id)})
    return {"access_token": access_token, "token_type": "bearer"}

async def logout(db: Session, current_user):
    if not user_repository.get_by_id(db, current_user.user_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy tài khoản")
    
    # Bỏ chọn tất cả các thiết bị hiện đang thao tác 
    device_repository.deselect_all(db, current_user.user_id)
    _log_action(db, current_user, None, "LOGOUT", f"Người dùng {current_user.username} đã đăng xuất")
    return {"message": "Đăng xuất thành công"}
