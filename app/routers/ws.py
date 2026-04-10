from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from websocket.manager import ws_manager
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.websocket("")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    """
    URL: ws://localhost:8000/ws?client_id=123
    """
    await ws_manager.connect(client_id, websocket)
    logger.info(f"Client {client_id} connected to WebSocket")
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect(client_id, websocket)
        logger.info(f"Client {client_id} disconnected")
    except Exception as e:
        ws_manager.disconnect(client_id, websocket)
        logger.error(f"WebSocket error for client {client_id}: {e}")
