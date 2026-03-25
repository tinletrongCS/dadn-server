from sqlalchemy import (
    Column,
    Integer,
    BigInteger,
    String,
    Boolean,
    Float,
    TIMESTAMP,
    Text,
    ForeignKey,
    func,
)
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import text

Base = declarative_base()


class User(Base):
    __tablename__ = "user"

    user_id = Column(PG_UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    role_id = Column(Integer, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())  

    def __repr__(self):
        return f"<User(username={self.username!r}, user_id={self.user_id})>"


class Device(Base):
    __tablename__ = "device"

    device_id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False, unique=True)
    mode = Column(String(20), default='manual')
    pump_status = Column(Boolean, default=False)
    fan_status = Column(Boolean, default=False)
    temp_min = Column(Float, nullable=True)
    temp_max = Column(Float, nullable=True)
    humid_min = Column(Float, nullable=True)
    humid_max = Column(Float, nullable=True)
    soil_min = Column(Float, nullable=True)
    soil_max = Column(Float, nullable=True)
    light_min = Column(Integer, nullable=True)
    light_max = Column(Integer, nullable=True)
    last_seen = Column(TIMESTAMP(timezone=True), nullable=True) 

    sensor_data = relationship("SensorData", back_populates="device", cascade="all, delete-orphan")
    activity_logs = relationship("ActivityLog", back_populates="device", cascade="all, delete-orphan")
    pending_commands = relationship("PendingCommand", back_populates="device", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Device(id={self.device_id}, name={self.name!r})>"


class SensorData(Base):
    __tablename__ = "sensor_data"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    device_id = Column(Integer, ForeignKey('device.device_id', ondelete='CASCADE'), nullable=False)
    temperature = Column(Float, nullable=False)
    air_humidity = Column(Float, nullable=False)
    soil_moisture = Column(Float, nullable=False)
    light_intensity = Column(Integer, nullable=False)
    measured_at = Column(TIMESTAMP(timezone=True), nullable=False)  
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())  

    device = relationship("Device", back_populates="sensor_data")

    def __repr__(self):
        return f"<SensorData(id={self.id}, device_id={self.device_id})>"


class ActivityLog(Base):
    __tablename__ = "activity_log"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(PG_UUID(as_uuid=True), ForeignKey('user.user_id', ondelete='SET NULL'), nullable=True)
    device_id = Column(Integer, ForeignKey('device.device_id', ondelete='CASCADE'), nullable=True)
    action_type = Column(String(50), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())  

    user = relationship("User")
    device = relationship("Device", back_populates="activity_logs")

    def __repr__(self):
        return f"<ActivityLog(id={self.id}, action_type={self.action_type!r})>"


class OtpToken(Base):
    __tablename__ = "otp_tokens"

    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(255), nullable=False, index=True)
    otp_code = Column(String(10), nullable=False)
    expires_at = Column(TIMESTAMP(timezone=True), nullable=False)  
    used = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now()) 


class PendingCommand(Base):
    __tablename__ = "pending_commands"

    command_id = Column(BigInteger, primary_key=True, autoincrement=True)
    device_id = Column(Integer, ForeignKey("device.device_id", ondelete="CASCADE"), nullable=False)  
    actuator = Column(String(20), nullable=False)
    action = Column(String(10), nullable=False)
    issued_by = Column(PG_UUID(as_uuid=True), ForeignKey("user.user_id", ondelete="SET NULL"), nullable=True)  
    source = Column(String(20), default="manual")
    status = Column(String(20), default="pending")
    error_detail = Column(Text, nullable=True)
    issued_at = Column(TIMESTAMP(timezone=True), server_default=func.now())  
    acked_at = Column(TIMESTAMP(timezone=True), nullable=True)  

    device = relationship("Device", back_populates="pending_commands")
    issued_by_user = relationship("User")

class UserDevice(Base):
    __tablename__ = "user_device"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(PG_UUID(as_uuid=True), ForeignKey("user.user_id"), unique=True, nullable=False)
    device_id = Column(Integer, ForeignKey("device.device_id"), unique=True, nullable=False)
    
    # Hiện máy đang có ai dùng không 
    is_active = Column(Boolean, default=False) 
    temp_min = Column(Float, nullable=True)
    temp_max = Column(Float, nullable=True)
    humid_min = Column(Float, nullable=True)
    humid_max = Column(Float, nullable=True)
    soil_min = Column(Float, nullable=True)
    soil_max = Column(Float, nullable=True)
    light_min = Column(Integer, nullable=True)
    light_max = Column(Integer, nullable=True)
