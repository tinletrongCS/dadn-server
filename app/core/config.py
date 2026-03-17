from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Smart Farm IoT Backend"
    
    DATABASE_URL: str
    # cấu hình bảo mật cho module 5 
    SECRET_KEY: str = "bda3d10300dbfbd5c9089f896158033051fd7b0b4790a8203ec83f77cb59eec7" 
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # token hết hạn sau 7 ngày 

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

# Khởi tạo một object settings duy nhất để dùng chung cho toàn dự án
settings = Settings()