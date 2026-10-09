"""Creates the FastAPI app. Run with: uv run uvicorn app.main:app --reload"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import db
from app.config import FRONTEND_ORIGINS
from app.routers import auth


@asynccontextmanager
async def lifespan(app):
    db.open_db()
    yield
    db.close_db()


app = FastAPI(title="HRNexus AI API", lifespan=lifespan)


# Browsers only let the frontend call this API if its address is listed here.
app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
