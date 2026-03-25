from datetime import datetime, timezone, timedelta
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict, model_serializer
from uuid import UUID

ICT = timezone(timedelta(hours=7))

def to_ict(dt: datetime) -> str:
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(ICT).isoformat()

# set timezone là tại TPHCM UTC+7 
class ICTBaseModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    @model_serializer(mode='wrap')
    def serialize_datetime(self, handler):
        result = handler(self)
        for key, val in result.items():
            if isinstance(val, datetime):
                result[key] = to_ict(val)
        return result

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
    # timestamp: datetime
    timestamp: Optional[datetime] = Field(default_factory=lambda: datetime.now(timezone.utc))
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
    email: str

class ResetPasswordSchema(BaseModel):
    email: str
    otp: str
    new_password: str


# 3. USER
class UserResponse(ICTBaseModel):
    user_id: UUID
    username: str
    full_name: str
    role_id: int
    is_active: bool
    created_at: datetime


# 4. DEVICE
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

class DeviceResponse(ICTBaseModel, DeviceCreateUpdate):
    device_id: int
    pump_status: bool
    fan_status: bool
    last_seen: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class DeviceStatusResponse(BaseModel):
    device_id: int
    mode: str
    pump_status: bool
    fan_status: bool
    last_seen: Optional[datetime] = None
    
# 5. SENSOR DATA VÀ ACTIVITY LOGS
class SensorDataResponse(ICTBaseModel):
    id: int
    device_id: int
    temperature: float
    air_humidity: float
    soil_moisture: float
    light_intensity: int
    measured_at: datetime

class ActivityLogResponse(ICTBaseModel):
    id: int
    user_id: Optional[UUID]
    device_id: Optional[int]
    action_type: str
    description: Optional[str]
    created_at: datetime

# 6. CONTROL
class ControlCommandSchema(BaseModel):
    action: str   # "True" | "False"

    model_config = ConfigDict(
        json_schema_extra={"example": {"action": "on"}}
    )

class ControlResponse(BaseModel):
    device_id:  int
    actuator:   str   # "pump" | "fan"
    action:     str
    status:     str   # "pending" | "done" | "error"
    command_id: int

class AckCommandSchema(BaseModel):
    command_id:   int
    success:      bool
    error_detail: Optional[str] = None

# 7. LOGS
class PaginatedLogResponse(BaseModel):
    items: List[ActivityLogResponse]
    total: int
    page:  int
    limit: int