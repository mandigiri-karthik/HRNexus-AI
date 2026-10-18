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
AWS_REGION = os.environ["AWS_REGION"]
BEDROCK_MODEL_ID = os.environ["BEDROCK_MODEL_ID"]
# Optional: without it, CVs are not screened (fine for local development and CI).
BEDROCK_GUARDRAIL_ID = os.getenv("BEDROCK_GUARDRAIL_ID")
BEDROCK_GUARDRAIL_VERSION = os.getenv("BEDROCK_GUARDRAIL_VERSION", "1")

# Optional: without them, job search is switched off (fine for CI); the endpoint says so.
ADZUNA_APP_ID = os.getenv("ADZUNA_APP_ID")
ADZUNA_APP_KEY = os.getenv("ADZUNA_APP_KEY")
TYPESAFE_API_KEY = os.getenv("TYPESAFE_API_KEY")
JEV_MODEL = os.getenv("JEV_MODEL", "jev-latest")

# Optional, with defaults that suit local development.
TOKEN_LIFETIME_DAYS = int(os.getenv("TOKEN_LIFETIME_DAYS", "7"))
FRONTEND_ORIGINS = [
    origin.strip()
    for origin in os.getenv("FRONTEND_ORIGINS", "http://localhost:8080").split(",")
]
