import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, status

from core.security import verify_token
from websocket.manager import ws_manager

router = APIRouter()
logger = logging.getLogger(__name__)


@router.websocket("")
async def websocket_endpoint(
    websocket: WebSocket,
    client_id: str | None = None,
    token: str | None = None,
):
    """
    URL: ws://localhost:8000/ws?token=<access_token>
    Backward compatible URL: ws://localhost:8000/ws?client_id=123
    """
    if token:
        try:
            payload = verify_token(token)
            client_id = payload.get("sub")
        except Exception as exc:
            logger.warning("Invalid websocket token: %s", exc)
            await websocket.close(
                code=status.WS_1008_POLICY_VIOLATION,
                reason="Token WebSocket khong hop le",
            )
            return

    if not client_id:
        await websocket.close(
            code=status.WS_1008_POLICY_VIOLATION,
            reason="Thieu client_id hoac token",
        )
        return

    await ws_manager.connect(client_id, websocket)
    logger.info("Client %s connected to WebSocket", client_id)

    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_json({"type": "PONG"})
    except WebSocketDisconnect:
        ws_manager.disconnect(client_id, websocket)
        logger.info("Client %s disconnected", client_id)
    except Exception as e:
        ws_manager.disconnect(client_id, websocket)
        logger.error("WebSocket error for client %s: %s", client_id, e)
