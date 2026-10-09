"""Reusable checks that endpoints can ask for."""

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app import store
from app.security import read_token

bearer = HTTPBearer(auto_error=False)


def get_current_user(credentials: HTTPAuthorizationCredentials | None = Depends(bearer)):
    """Work out who is calling from the `Authorization: Bearer <token>` header."""
    user_id = read_token(credentials.credentials) if credentials else None
    user = store.find_user_by_id(user_id) if user_id else None
    if not user:
        raise HTTPException(401, "Please log in again.")
    return user
