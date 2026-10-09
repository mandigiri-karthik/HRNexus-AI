"""User storage in PostgreSQL. This is the only file that runs SQL on the users table."""

import uuid

from psycopg.errors import UniqueViolation

from app.db import pool


def normalize_email(email):
    return email.strip().lower()


def find_user_by_email(email):
    with pool.connection() as conn:
        return conn.execute(
            "SELECT * FROM users WHERE email = %s", (normalize_email(email),)
        ).fetchone()


def find_user_by_id(user_id):
    with pool.connection() as conn:
        return conn.execute("SELECT * FROM users WHERE id = %s", (user_id,)).fetchone()


def create_user(name, email, password_hash=None, provider="password"):
    """Save a new user. Returns None if the email is already registered."""
    try:
        with pool.connection() as conn:
            return conn.execute(
                """
                INSERT INTO users (id, name, email, password_hash, provider)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING *
                """,
                (uuid.uuid4().hex, name.strip(), normalize_email(email), password_hash, provider),
            ).fetchone()
    except UniqueViolation:
        return None
