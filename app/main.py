from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {"status": "OK", "message": "Server is running"}
