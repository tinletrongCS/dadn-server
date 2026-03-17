# dadn-server

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

## Local 

1. Tạo venv:
```bash
python -m venv venv
venv\Scripts\activate
```
2. Cài dependency:
```bash
pip install -r app/requirements.txt
```
3. Chạy app:
```bash
cd app
uvicorn main:app --reload
```

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
app/
├── core/                  # Thư mục chứa cấu hình lõi
│   ├── security.py        # Xử lý băm mật khẩu, tạo Token JWT
│   └── config.py          # Chứa các biến môi trường (SECRET_KEY, DB_URL)
├── models/                # Thư mục chứa cấu trúc Bảng DB (SQLAlchemy)
│   └── domain_models.py   # Bảng User, Device, SensorData, ActivityLog
├── schemas/               # Thư mục chứa cấu trúc JSON
│   └── domain_schemas.py  # Validate dữ liệu đầu vào/đầu ra
├── routers/               # Chứa các API
│   ├── auth.py            # API Đăng nhập (Module 5)
│   ├── devices.py         # API CRUD Thiết bị & Cài ngưỡng (Module 5 & 2)
│   ├── sensors.py         # API Nhận & Trả dữ liệu môi trường (Module 1)
│   ├── control.py         # API Bật/tắt thủ công & Tự động (Module 3)
│   └── logs.py            # API Xem lịch sử hoạt động (Module 4)
├── database.py            # Khởi tạo kết nối Neon.tech
├── main.py                # Khởi chạy app và nhúng các router vào
├── requirements.txt       
└── docker-compose.yml