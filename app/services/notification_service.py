from datetime import datetime, timezone
from typing import Any

from websocket.manager import ConnectionManager, ws_manager


def build_notification(
    notification_type: str,
    message: str,
    *,
    device_id: int | None = None,
    severity: str = "info",
    title: str | None = None,
    **extra: Any,
) -> dict[str, Any]:
    payload = {
        "type": notification_type,
        "severity": severity,
        "title": title or _default_title(notification_type, severity),
        "message": message,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    if device_id is not None:
        payload["device_id"] = device_id

    payload.update(extra)
    return payload


async def broadcast_notification(
    notification_type: str,
    message: str,
    *,
    manager: ConnectionManager = ws_manager,
    device_id: int | None = None,
    severity: str = "info",
    title: str | None = None,
    **extra: Any,
) -> dict[str, Any]:
    payload = build_notification(
        notification_type,
        message,
        device_id=device_id,
        severity=severity,
        title=title,
        **extra,
    )
    await manager.broadcast(payload)
    return payload


async def send_notification_to_user(
    user_id: str,
    notification_type: str,
    message: str,
    *,
    manager: ConnectionManager = ws_manager,
    device_id: int | None = None,
    severity: str = "info",
    title: str | None = None,
    **extra: Any,
) -> dict[str, Any]:
    payload = build_notification(
        notification_type,
        message,
        device_id=device_id,
        severity=severity,
        title=title,
        **extra,
    )
    await manager.send_to(user_id, payload)
    return payload


def _default_title(notification_type: str, severity: str) -> str:
    if notification_type == "ALERT":
        return "Cảnh báo ngưỡng môi trường"
    if notification_type == "EMERGENCY":
        return "Lõo điều khiển"
    if notification_type == "STATE_UPDATE":
        return "Cập nhật thiết bị"
    if severity == "success":
        return "Thành công"
    if severity == "warning":
        return "Cảnh báo"
    if severity == "error":
        return "Lỗi"
    return "Thông báo"
