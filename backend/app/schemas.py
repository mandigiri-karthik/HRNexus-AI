"""The shape of the JSON each endpoint accepts and returns."""

from pydantic import BaseModel, EmailStr, Field, field_validator


class SignUpRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8)

    @field_validator("name")
    @classmethod
    def name_is_not_blank(cls, name):
        if not name.strip():
            raise ValueError(" Sorry Name cannot be blank.")
        return name.strip()

    @field_validator("password")
    @classmethod
    def password_fits_bcrypt(cls, password):
        if len(password.encode()) > 72:
            raise ValueError("Password is too long.")
        return password


class LogInRequest(BaseModel):
    email: EmailStr
    password: str


class GoogleLogInRequest(BaseModel):
    credential: str


class UserResponse(BaseModel):
    id: str
    name: str
    email: str


class AuthResponse(BaseModel):
    token: str
    user: UserResponse

class TextIntakeRequest(BaseModel):
    text: str = Field(min_length=1, max_length=5000)

    @field_validator("text")
    @classmethod
    def text_is_not_blank(cls, text):
        if not text.strip():
            raise ValueError("Please write something about yourself.")
        return text.strip()


class IntakeResponse(BaseModel):
    source: str
    text: str

