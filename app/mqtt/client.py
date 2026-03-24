import asyncio
import json
import logging
from datetime import datetime, timezone

import aiomqtt
from sqlalchemy.orm import Session

from core.config import settings
from database import SessionLocal
from models.domain_models import Device, SensorData
from schemas.domain_schemas import DevicePayload
from websocket.manager import ws_manager

logger = logging.getLogger(__name__)

# Thông tin kết nối Adafruit IO 
AIO_HOST = "io.adafruit.com"
AIO_PORT = 1883

def feed_topic(feed_key: str) -> str:
    return f"{settings.AIO_USERNAME}/feeds/{feed_key}"

TOPIC_SENSOR = feed_topic(settings.AIO_FEED_SENSOR)
TOPIC_PUMP   = feed_topic(settings.AIO_FEED_PUMP)
TOPIC_FAN    = feed_topic(settings.AIO_FEED_FAN)


async def handle_payload(raw: str):
    """Parse JSON từ Adafruit, lưu DB, kiểm tra ngưỡng."""
    try:
        data = DevicePayload.model_validate_json(raw)
    except Exception as e:
        logger.error(f"[MQTT] Parse lỗi: {e} | raw={raw}")
        return

    db: Session = SessionLocal()
    try:
        # 1. Tìm device theo name (map với device_source)
        device = db.query(Device).filter(Device.name == data.device_source).first()

        if not device:
            logger.warning(
                f"[MQTT] device_source '{data.device_source}' "
                f"chưa đăng ký trong DB - bỏ qua"
            )
            return

        record = SensorData(
            device_id       = device.device_id,
            temperature     = data.sensor.temperature.value,
            air_humidity    = data.sensor.air_humidity.value,
            soil_moisture   = data.sensor.soil_moisture.value,
            light_intensity = int(data.sensor.light_intensity.value),
            measured_at     = data.timestamp,
        )
        db.add(record)

        device.pump_status = data.status.pump
        device.fan_status  = data.status.fan
        device.mode        = data.status.mode
        device.last_seen   = data.timestamp

        # 4. Cập nhật ngưỡng — chỉ ghi nếu DB đang NULL
        #    (ưu tiên cài đặt từ Frontend, không ghi đè)
        s = data.sensor
        if device.temp_min  is None: device.temp_min  = s.temperature.MIN
        if device.temp_max  is None: device.temp_max  = s.temperature.MAX
        if device.humid_min is None: device.humid_min = s.air_humidity.MIN
        if device.humid_max is None: device.humid_max = s.air_humidity.MAX
        if device.soil_min  is None: device.soil_min  = s.soil_moisture.MIN
        if device.soil_max  is None: device.soil_max  = s.soil_moisture.MAX
        if device.light_min is None: device.light_min = s.light_intensity.MIN
        if device.light_max is None: device.light_max = s.light_intensity.MAX

        db.commit()
        db.refresh(record)

        # 5. Kiểm tra ngưỡng cảnh báo auto control
        from services.threshold_service import check_and_alert
        await check_and_alert(device.device_id, record, device, db, ws_manager)

    except Exception as e:
        db.rollback()
        logger.error(f"[MQTT] Lỗi xử lý payload: {e}")
    finally:
        db.close()


async def mqtt_subscribe_loop():
    """
    Kết nối Adafruit IO, subscribe feed cảm biến.
    Tự reconnect nếu mất kết nối.
    """
    while True:
        try:
            logger.info("[MQTT] Đang kết nối tới Adafruit IO...")
            async with aiomqtt.Client(
                hostname = AIO_HOST,
                port     = AIO_PORT,
                username = settings.AIO_USERNAME,
                password = settings.AIO_KEY,
            ) as client:
                await client.subscribe(TOPIC_SENSOR)
                logger.info(f"[MQTT] Subscribed: {TOPIC_SENSOR}")

                async with client.messages() as messages:
                    async for message in messages:
                        raw = message.payload.decode()
                        logger.info(f"[MQTT] Nhận: {raw}")
                        await handle_payload(raw)

        except aiomqtt.MqttError as e:
            logger.warning(f"[MQTT] Mất kết nối: {e} — thử lại sau 5s")
            await asyncio.sleep(5)   # tự reconnect

        except Exception as e:
            logger.error(f"[MQTT] Lỗi không xác định: {e} — thử lại sau 10s")
            await asyncio.sleep(10)


# Publish lệnh điều khiển xuống thiết bị 
async def publish_command(feed_key: str, value: str):
    """
    Publish lệnh lên Adafruit feed.
    Gọi từ /control endpoints khi user bấm bật/tắt.
    value: "True" hoặc "False"
    """
    topic = feed_topic(feed_key)
    try:
        async with aiomqtt.Client(
            hostname = AIO_HOST,
            port     = AIO_PORT,
            username = settings.AIO_USERNAME,
            password = settings.AIO_KEY,
        ) as client:
            await client.publish(topic, payload=value)
            logger.info(f"[MQTT] Published → {topic}: {value}")
    except aiomqtt.MqttError as e:
        logger.error(f"[MQTT] Publish thất bại: {e}")
        raise