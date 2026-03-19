from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict
from uuid import UUID


# 1. PAYLOAD TỪ MẠCH YOLOBIT 
class SensorDetail(BaseModel):
    value: float
    unit: str
    MAX: Optional[float] = None
    MIN: Optional[float] = None

class Sensors(BaseModel):
    temperature: SensorDetail
    air_humidity: SensorDetail
    soil_moisture: SensorDetail
    light_intensity: SensorDetail

class Status(BaseModel):
    fan: bool
    mode: str
    pump: bool

class DevicePayload(BaseModel):
    device_source: str = Field(..., alias="device_source")
    timestamp: datetime
    sensor: Sensors
    status: Status

    model_config = ConfigDict(
        populate_by_name=True,
        json_schema_extra={
            "example": {
                "device_source": "YOLOFARM_001",
                "timestamp": "2026-03-17 12:34:56",
                "sensor": {
                    "temperature": {"value": 26.5, "unit": "°C", "MAX": 32, "MIN": 18},
                    "air_humidity": {"value": 60, "unit": "%", "MAX": 85, "MIN": 50},
                    "soil_moisture": {"value": 45, "unit": "%", "MAX": 80, "MIN": 30},
                    "light_intensity": {"value": 78, "unit": "%", "MAX": 85, "MIN": 75}
                },
                "status": {"fan": False, "mode": "auto", "pump": True}
            }
        }
    )

# 2. AUTHENTICATION (API Đăng nhập / Quên MK)

# DTO dùng đăng kí tài khoản 
class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    full_name: str
    role_id: int = 2  
    
class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class MessageResponse(BaseModel):
    message: str

class ForgotPasswordSchema(BaseModel):
    email: str  # Dùng email để gửi OTP

class ResetPasswordSchema(BaseModel):
    email: str
    otp: str
    new_password: str

# 3. USER (Trả dữ liệu người dùng)
class UserResponse(BaseModel):
    user_id: UUID
    username: str
    full_name: str
    role_id: int
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True) 

# 4. DEVICE (Quản lý Thiết bị)
class DeviceCreateUpdate(BaseModel):
    name: str
    mode: Optional[str] = "manual"
    temp_min: Optional[float] = None
    temp_max: Optional[float] = None
    humid_min: Optional[float] = None
    humid_max: Optional[float] = None
    soil_min: Optional[float] = None
    soil_max: Optional[float] = None
    light_min: Optional[int] = None
    light_max: Optional[int] = None

class DeviceResponse(DeviceCreateUpdate):
    device_id: str
    pump_status: bool
    fan_status: bool
    last_seen: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)

# 5. SENSOR DATA VÀ ACTIVITY LOGS
class SensorDataResponse(BaseModel):
    id: int
    device_id: str
    temperature: float
    air_humidity: float
    soil_moisture: float
    light_intensity: int
    measured_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ActivityLogResponse(BaseModel):
    id: int
    user_id: Optional[UUID]
    device_id: Optional[str]
    action_type: str
    description: Optional[str]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)