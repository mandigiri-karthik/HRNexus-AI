"""Settings for the backend, read once from environment variables (see .env.example)."""

import os
from pathlib import Path

from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BACKEND_DIR / ".env")
DATABASE_URL = os.environ["DATABASE_URL"]
# Required. The app refuses to start without them.
JWT_SECRET = os.environ["JWT_SECRET"]
GOOGLE_CLIENT_ID = os.environ["GOOGLE_CLIENT_ID"]

# Optional, with defaults that suit local development.
TOKEN_LIFETIME_DAYS = int(os.getenv("TOKEN_LIFETIME_DAYS", "7"))
FRONTEND_ORIGINS = [
    origin.strip()
    for origin in os.getenv("FRONTEND_ORIGINS", "http://localhost:8080").split(",")
]
