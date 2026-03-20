from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Smart Farm IoT Backend"
    
    DATABASE_URL: str
    # cấu hình bảo mật 
    SECRET_KEY: str = "secret" 
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # token hết hạn sau 7 ngày 

    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""

    # Cấu hình tới Adafruit
    AIO_USERNAME: str
    AIO_KEY: str
    AIO_FEED_SENSOR: str = "sensor-data"
    AIO_FEED_PUMP: str = "pump-control"
    AIO_FEED_FAN:  str = "fan-control"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()