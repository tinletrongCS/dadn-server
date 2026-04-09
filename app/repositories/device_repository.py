# app/repositories/device_repository.py

from sqlalchemy.orm import Session
from models.domain_models import Device


def get_all(db: Session) -> list[Device]:
    return db.query(Device).all()


def get_by_id(db: Session, device_id) -> Device | None:
    return db.query(Device).filter(Device.device_id == device_id).first()


def get_by_name(db: Session, name: str) -> Device | None:
    return db.query(Device).filter(Device.name == name).first()


def create(db: Session, data: dict) -> Device:
    device = Device(**data)
    db.add(device)
    db.commit()
    db.refresh(device)
    return device


def update_name(db: Session, device: Device, name: str) -> Device:
    device.name = name
    db.commit()
    db.refresh(device)
    return device


def delete(db: Session, device: Device) -> None:
    db.delete(device)
    db.commit()


def update_threshold(db: Session, device: Device, data: dict) -> Device:
    for key, value in data.items():
        setattr(device, key, value)
    db.commit()
    db.refresh(device)
    return device


def update_mode(db: Session, device: Device, mode: str) -> Device:
    device.mode = mode.lower()
    db.commit()
    db.refresh(device)
    return device


def update_status_from_payload(db: Session, device: Device, payload) -> None:
    """Cập nhật trạng thái device từ payload IoT gửi lên."""
    device.pump_status = payload.status.pump
    device.fan_status = payload.status.fan
    device.mode = payload.status.mode
    device.last_seen = payload.timestamp

    # Cập nhật ngưỡng nếu DB đang NULL
    s = payload.sensor
    if device.temp_min  is None: device.temp_min  = s.temperature.MIN
    if device.temp_max  is None: device.temp_max  = s.temperature.MAX
    if device.humid_min is None: device.humid_min = s.air_humidity.MIN
    if device.humid_max is None: device.humid_max = s.air_humidity.MAX
    if device.soil_min  is None: device.soil_min  = s.soil_moisture.MIN
    if device.soil_max  is None: device.soil_max  = s.soil_moisture.MAX
    if device.light_min is None: device.light_min = s.light_intensity.MIN
    if device.light_max is None: device.light_max = s.light_intensity.MAX

    db.commit()
