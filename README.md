# dadn-server

## 🚀 Quick Start 

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

1. Tạo virtualenv:
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

## 📁 File checklist

- `app/.env.example` (commit)
- `.gitignore` includes `.env`, `venv/`, `__pycache__/`
- `app/.env` (local only)

---

## Team onboarding

1. Clone
2. Copy `.env.example` → `.env`
3. Fill secret values
4. `docker compose up -d --build`

> Nếu cần, share `.env` giá trị thật qua kênh an toàn nội bộ (Slack private, Teams, email bảo mật), không push lên Git.
