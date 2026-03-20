# app/websocket/manager.py

from fastapi import WebSocket
from typing import Dict, List


class ConnectionManager:
    def __init__(self):
        self.active: Dict[str, List[WebSocket]] = {}

    async def connect(self, client_id: str, ws: WebSocket):
        await ws.accept()
        self.active.setdefault(client_id, []).append(ws)

    def disconnect(self, client_id: str, ws: WebSocket):
        if client_id in self.active:
            self.active[client_id].remove(ws)
            if not self.active[client_id]:
                del self.active[client_id]

    async def send_to(self, client_id: str, payload: dict):
        """Gửi tới 1 client cụ thể."""
        for ws in self.active.get(client_id, []):
            try:
                await ws.send_json(payload)
            except Exception:
                pass

    async def broadcast(self, payload: dict):
        """Gửi tới TẤT CẢ clients đang kết nối."""
        for sockets in self.active.values():
            for ws in sockets:
                try:
                    await ws.send_json(payload)
                except Exception:
                    pass


ws_manager = ConnectionManager()