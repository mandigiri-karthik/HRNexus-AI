"""Password hashing, login tokens (JWT) and Google token verification."""

from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token

from app.config import GOOGLE_CLIENT_ID, JWT_SECRET, TOKEN_LIFETIME_DAYS

JWT_ALGORITHM = "HS256"


def hash_password(password):
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password, password_hash):
    try:
        return bcrypt.checkpw(password.encode(), password_hash.encode())
    except ValueError:
        # bcrypt rejects passwords longer than 72 bytes; that can never be a match.
        return False


def create_token(user_id):
    expires_at = datetime.now(timezone.utc) + timedelta(days=TOKEN_LIFETIME_DAYS)
    return jwt.encode({"sub": user_id, "exp": expires_at}, JWT_SECRET, algorithm=JWT_ALGORITHM)


def read_token(token):
    """Return the user id inside a token, or None if it is invalid or expired."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.InvalidTokenError:
        return None
    return payload.get("sub")


def verify_google_token(credential):
    """Return Google's details for the user, or None if the token is not genuine."""
    try:
        info = id_token.verify_oauth2_token(
            credential, google_requests.Request(), GOOGLE_CLIENT_ID
        )
    except ValueError:
        return None
    if not info.get("email_verified"):
        return None
    return info
