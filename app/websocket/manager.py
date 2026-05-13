from typing import Dict, List

from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        self.active: Dict[str, List[WebSocket]] = {}

    async def connect(self, client_id: str, ws: WebSocket):
        await ws.accept()
        self.active.setdefault(client_id, []).append(ws)

    def disconnect(self, client_id: str, ws: WebSocket):
        if client_id not in self.active:
            return

        if ws in self.active[client_id]:
            self.active[client_id].remove(ws)

        if not self.active[client_id]:
            del self.active[client_id]

    async def send_to(self, client_id: str, payload: dict):
        """Send a payload to one connected client id."""
        disconnected: List[WebSocket] = []

        for ws in list(self.active.get(client_id, [])):
            try:
                await ws.send_json(payload)
            except Exception:
                disconnected.append(ws)

        for ws in disconnected:
            self.disconnect(client_id, ws)

    async def broadcast(self, payload: dict):
        """Send a payload to all connected clients."""
        disconnected: List[tuple[str, WebSocket]] = []

        for client_id, sockets in list(self.active.items()):
            for ws in list(sockets):
                try:
                    await ws.send_json(payload)
                except Exception:
                    disconnected.append((client_id, ws))

        for client_id, ws in disconnected:
            self.disconnect(client_id, ws)


ws_manager = ConnectionManager()
