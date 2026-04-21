from fastapi import APIRouter, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from database import get_db
from schemas.domain_schemas import TokenResponse, UserResponse, UserResponseMe, UserCreate, MessageResponse
from services import auth_service, log_service
from dependencies.auth_deps import get_current_user
from models.domain_models import User

router = APIRouter()

# Đăng ký 
# Done
@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(user_in: UserCreate, db: Session = Depends(get_db)):
    return await auth_service.register(db, user_in)

# Đăng nhập 
# Done
@router.post("/login", response_model=TokenResponse)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    return await auth_service.login(db, form_data.username, form_data.password)

# Lấy thông tin user hiện tại - Khi bấm vào xem tài khoản 
# Done 
@router.get("/me", response_model=UserResponseMe)
async def read_current_user(current_user: User = Depends(get_current_user)):
    return current_user


# Đăng xuất 
@router.post("/logout", response_model=MessageResponse)
async def logout(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return await auth_service.logout(db, current_user)