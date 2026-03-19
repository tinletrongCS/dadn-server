from fastapi import FastAPI
from app.routers import auth
app = FastAPI()

@app.get("/")
def read_root():
    return {"status": "OK", "message": "--- IoT Smart Farm: Server is running ==="}

# Đăng kí router Xác thực 
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])