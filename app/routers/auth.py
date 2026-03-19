from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db 
from models.domain_models import User
# UC9 - Đăng nhập
@router.post("/login")
async def login(form: LoginSchema, db: Session = Depends(get_db)) -> TokenResponse:
    """Xác thực username/password, trả về JWT token"""

# UC9B - Đăng xuất
@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user)) -> MessageResponse:
    """Thu hồi/vô hiệu hóa token hiện tại"""

# UC9-1 - Quên mật khẩu (gửi OTP)
@router.post("/forgot-password")
async def forgot_password(body: ForgotPasswordSchema, db: Session = Depends(get_db)) -> MessageResponse:
    """Kiểm tra email, gửi mã OTP về email đã đăng ký"""

# UC9-1 - Xác nhận OTP + đặt mật khẩu mới
@router.post("/reset-password")
async def reset_password(body: ResetPasswordSchema, db: Session = Depends(get_db)) -> MessageResponse:
    """Xác thực OTP và cập nhật mật khẩu mới (đã hash)"""