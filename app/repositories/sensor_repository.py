# app/repositories/sensor_repository.py

from datetime import datetime
from sqlalchemy.orm import Session
from models.domain_models import SensorData


def create(db: Session, device_id: int, payload) -> SensorData:
    record = SensorData(
        device_id       = device_id,
        temperature     = payload.sensor.temperature.value,
        air_humidity    = payload.sensor.air_humidity.value,
        soil_moisture   = payload.sensor.soil_moisture.value,
        light_intensity = int(payload.sensor.light_intensity.value),
        measured_at     = payload.timestamp,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def get_latest(db: Session, device_id: int) -> SensorData | None:
    return (
        db.query(SensorData)
        .filter(SensorData.device_id == device_id)
        .order_by(SensorData.measured_at.desc())
        .first()
    )


def get_history(
    db: Session,
    device_id: int,
    from_time: datetime,
    to_time: datetime,
) -> list[SensorData]:
    return (
        db.query(SensorData)
        .filter(
            SensorData.device_id  == device_id,
            SensorData.measured_at >= from_time,
            SensorData.measured_at <= to_time,
        )
        .order_by(SensorData.measured_at.asc())
        .all()
    )
