import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine
from mqtt.client import mqtt_subscribe_loop
from routers import auth, devices, sensors, control

# Cấu hình log để hiện chữ trên màn hình Docker
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Khởi tạo các bảng trong Database (nếu chưa có)
    Base.metadata.create_all(bind=engine)

    # 2. Đánh thức vòng lặp lắng nghe Adafruit IO chạy ngầm
    logger.info("=== ĐANG KHỞI ĐỘNG LUỒNG MQTT ===")
    mqtt_task = asyncio.create_task(mqtt_subscribe_loop())
    
    yield  
    
    # 3. Dọn dẹp sạch sẽ khi tắt server
    mqtt_task.cancel()
    try:
        await mqtt_task
    except asyncio.CancelledError:
        pass

# Khởi tạo App chính thức (đã gắn lifespan)
app = FastAPI(title="Smart Farm API", version="1.0.0", lifespan=lifespan)

# Cho phép Frontend (React/Vue) gọi API không bị chặn CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "OK", "message": "--- IoT Smart Farm: Server is running ==="}

# Đăng kí các router (Bao gồm cả control bạn vừa làm xong)
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(devices.router, prefix="/devices", tags=["Devices"])
app.include_router(sensors.router, prefix="/sensors", tags=["Sensors"])
app.include_router(control.router, prefix="/control", tags=["Control"])