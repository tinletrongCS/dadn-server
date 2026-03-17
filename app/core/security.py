from passlib.context import CryptContext

# Hàm băm và xác thực mật khẩu 

pwd_context = CryptContext(schema=["brypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)