from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {"status": "OK", "message": "IoT Smart Farm: Server is running"}
