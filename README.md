# dadn-server

## Kiến trúc tổng quan hệ thống
<img width="2050" height="1368" alt="image" src="https://github.com/user-attachments/assets/9868bee9-99c3-40a2-8d6f-583530e5bad6" />

## Hướng dẫn cấu hình

1. Clone repo:
```bash
git clone https://github.com/tinletrongCS/dadn-server.git
cd dadn-server/app
```

2. Copy environment template:
```bash
copy .env.example .env
```
(on Linux/macOS: `cp .env.example .env`)

3. Edit `app/.env` và `docker-compose.yml` nếu cần (DB credentials, connection info).

4. Run:
```bash
docker compose up -d --build
```

5. Open API:
- http://localhost:8000

6. Stop:
```bash
docker compose down
```

---

## Chú ý: Không được commit file .env 

- `app/.env` chứa secret (DB password, API keys) nên không đưa lên Git.
- Commit chỉ dùng `app/.env.example` với các key mẫu.
- Mỗi dev tự tạo file riêng trên local.

---



---

## File checklist

- `app/.env.example` (commit)
- `.gitignore` includes `.env`, `venv/`, `__pycache__/`
- `app/.env` (local only)

---

## Team onboarding

1. Clone
2. Copy `.env.example` → `.env`
3. Fill secret values
4. `docker compose up -d --build`

> File `.env` sẽ được gửi trong nhóm Zalo nội bộ 

## Chạy Docker 
```bash
docker-compose up -d --build
```

## Cấu trúc các module chính trong dự án 
```bash
app/
├── docker-compose.yml
├── Dockerfile
├── requirements.txt
├── dependencies.py
├── scripts.sql
├── database.py
├── main.py
├── core
│   ├── config.py
│   └── security.py
├── dependencies
│   └── auth_deps.py
├── models
│   └── domain_models.py
├── mqtt
│   └── client.py
├── routers
│   ├── auth.py
│   ├── control.py
│   ├── devices.py
│   ├── logs.py
│   ├── sensors.py
│   └── ws.py
├── schemas
│   └── domain_schemas.py
├── services
│   ├── control_service.py
│   ├── notification_service.py
│   └── threshold_service.py
└── websocket
    └── manager.py
```
