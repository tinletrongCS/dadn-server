from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

# Định nghĩa json 
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

    class Config:
        allow_population_by_field_name = True
        schema_extra = {
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
