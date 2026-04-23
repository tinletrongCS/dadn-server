# app/routers/users.py

from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from database import get_db
from schemas.domain_schemas import (
    UserResponse, UserResponseMe,
    UserUpdateFullName, UserAdminUpdate,
    MessageResponse
)
from services import user_service
from dependencies.auth_deps import get_current_user, require_admin
from models.domain_models import User

router = APIRouter()


# ── Lấy danh sách tất cả người dùng (Admin only) ────────────────────────────
@router.get("", response_model=List[UserResponse])
async def list_users(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    return await user_service.get_all_users(db)


# ── Xem chi tiết user theo id (Admin only) ──────────────────────────────────
@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    return await user_service.get_user_by_id(db, user_id)


# ── Người dùng tự cập nhật họ tên ───────────────────────────────────────────
@router.patch("/me", response_model=UserResponseMe)
async def update_my_profile(
    data: UserUpdateFullName,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return await user_service.update_my_profile(db, current_user, data)


# ── Admin cập nhật user bất kỳ ──────────────────────────────────────────────
@router.patch("/{user_id}", response_model=UserResponse)
async def admin_update_user(
    user_id: str,
    data: UserAdminUpdate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    return await user_service.admin_update_user(db, user_id, data)


# ── Admin kích hoạt / vô hiệu hóa user ─────────────────────────────────────
@router.patch("/{user_id}/toggle-status", response_model=UserResponse)
async def toggle_user_status(
    user_id: str,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    return await user_service.admin_toggle_status(db, user_id, current_user.user_id)


# ── Admin xóa user ──────────────────────────────────────────────────────────
@router.delete("/{user_id}", response_model=MessageResponse)
async def delete_user(
    user_id: str,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    return await user_service.admin_delete_user(db, user_id, current_user.user_id)
