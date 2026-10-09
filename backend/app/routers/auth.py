"""Sign up, log in, Google sign-in and "who am I?"."""

from fastapi import APIRouter, Depends, HTTPException

from app import store
from app.dependencies import get_current_user
from app.schemas import (
    AuthResponse,
    GoogleLogInRequest,
    LogInRequest,
    SignUpRequest,
    UserResponse,
)
from app.security import create_token, hash_password, verify_google_token, verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])


def auth_response(user):
    return {"token": create_token(user["id"]), "user": user}


@router.post("/signup", response_model=AuthResponse)
def sign_up(body: SignUpRequest):
    user = store.create_user(body.name, body.email, hash_password(body.password))
    if not user:
        raise HTTPException(409, "An account with this email already exists. Please log in.")
    return auth_response(user)


@router.post("/login", response_model=AuthResponse)
def log_in(body: LogInRequest):
    user = store.find_user_by_email(body.email)
    # The same message for "no such email" and "wrong password", so nobody can
    # use this endpoint to find out which emails are registered.
    if (
        not user
        or not user["password_hash"]
        or not verify_password(body.password, user["password_hash"])
    ):
        raise HTTPException(401, "Incorrect email or password.")
    return auth_response(user)


@router.post("/google", response_model=AuthResponse)
def google_log_in(body: GoogleLogInRequest):
    info = verify_google_token(body.credential)
    if not info:
        raise HTTPException(401, "Google sign-in failed. Please try again.")
    email = info["email"]
    # The first Google sign-in creates the account; later ones find it.
    user = store.find_user_by_email(email) or store.create_user(
        info.get("name") or email, email, provider="google"
    )
    if not user:
        user = store.find_user_by_email(email)
    return auth_response(user)


@router.get("/me", response_model=UserResponse)
def me(user=Depends(get_current_user)):
    return user
