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
	password_hash = Column(String(255), nullable=False)
	full_name = Column(String(100), nullable=False)
	role_id = Column(Integer, nullable=False)  # 1: admin, 2: farmer
	is_active = Column(Boolean, default=True)
	created_at = Column(TIMESTAMP, server_default=func.now())

	def __repr__(self):
		return f"<User(username={self.username!r}, user_id={self.user_id})>"


class Device(Base):
	__tablename__ = "device"

	device_id = Column(Integer, primary_key=True)
	name = Column(String(100), nullable=False)
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
	last_seen = Column(TIMESTAMP, nullable=True)

	sensor_data = relationship("SensorData", back_populates="device", cascade="all, delete-orphan")
	activity_logs = relationship("ActivityLog", back_populates="device", cascade="all, delete-orphan")

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
	measured_at = Column(TIMESTAMP, nullable=False)
	created_at = Column(TIMESTAMP, server_default=func.now())

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
	created_at = Column(TIMESTAMP, server_default=func.now())

	user = relationship("User")
	device = relationship("Device", back_populates="activity_logs")

	def __repr__(self):
		return f"<ActivityLog(id={self.id}, action_type={self.action_type!r})>"

