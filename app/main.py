import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine
from mqtt.client import mqtt_subscribe_loop
from routers import auth, devices, sensors, control, logs, ws


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)

    logger.info("Đang khởi động luồng MQTT...")
    mqtt_task = asyncio.create_task(mqtt_subscribe_loop())
    
    yield  
    
    mqtt_task.cancel()
    try:
        await mqtt_task
    except asyncio.CancelledError:
        pass

app = FastAPI(title="Smart Farm API", version="1.0.0", lifespan=lifespan)

"""
    Cấu hình CORS cho phép FE gọi API 
"""
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "OK", "message": "--- IoT Smart Farm: Server is running ==="}

app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(devices.router, prefix="/devices", tags=["Devices"])
app.include_router(sensors.router, prefix="/sensors", tags=["Sensors"])
app.include_router(control.router, prefix="/control", tags=["Control"])
app.include_router(logs.router, prefix="/logs", tags=["Logs"])
app.include_router(ws.router, prefix="/ws", tags=["WebSocket"])