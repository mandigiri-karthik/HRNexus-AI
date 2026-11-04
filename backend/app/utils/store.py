"""User storage in PostgreSQL. This is the only file that runs SQL on the users table."""

import uuid

from psycopg.errors import UniqueViolation
from psycopg.types.json import Jsonb

from app.db.db import pool


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
    
def save_profile(user_id, source, data):
    """Save the user's profile, replacing any earlier one."""
    with pool.connection() as conn:
        return conn.execute(
            """
            INSERT INTO profiles (user_id, source, data)
            VALUES (%s, %s, %s)
            ON CONFLICT (user_id) DO UPDATE
            SET source = EXCLUDED.source, data = EXCLUDED.data, updated_at = now()
            RETURNING *
            """,
            (user_id, source, Jsonb(data)),
        ).fetchone()

def find_profile(user_id):
    with pool.connection() as conn:
        return conn.execute("SELECT * FROM profiles WHERE user_id = %s", (user_id,)).fetchone()



def find_job_search(user_id):
    with pool.connection() as conn:
        return conn.execute("SELECT * FROM job_searches WHERE user_id = %s", (user_id,)).fetchone()


def claim_job_search(user_id):
    """Reserve the user's one job search. Returns False if they've already had it, or one is running.
    A run stuck as 'running' for over 10 minutes (e.g. the server restarted mid-search) can be claimed again."""
    with pool.connection() as conn:
        row = conn.execute(
            """
            INSERT INTO job_searches (user_id, status) VALUES (%s, 'running')
            ON CONFLICT (user_id) DO UPDATE SET searched_at = now()
            WHERE job_searches.status = 'running' AND job_searches.searched_at < now() - interval '10 minutes'
            RETURNING user_id
            """,
            (user_id,),
        ).fetchone()
    return row is not None


def finish_job_search(user_id, roles, jobs):
    """Store Scout's results and mark the search done."""
    with pool.connection() as conn:
        return conn.execute(
            """
            UPDATE job_searches SET status = 'done', roles = %s, jobs = %s, searched_at = now()
            WHERE user_id = %s
            RETURNING *
            """,
            (Jsonb(roles), Jsonb(jobs), user_id),
        ).fetchone()


def release_job_search(user_id):
    """Undo a claim after a failed run, so a failure doesn't use up the user's one search."""
    with pool.connection() as conn:
        conn.execute("DELETE FROM job_searches WHERE user_id = %s AND status = 'running'", (user_id,))
