"""The PostgreSQL connection pool and table setup."""

from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool

from app.config import DATABASE_URL

# A small set of open connections that requests borrow and return.
# dict_row makes each result row a dict, e.g. {"id": ..., "email": ...}.
pool = ConnectionPool(DATABASE_URL, open=False, kwargs={"row_factory": dict_row})

CREATE_USERS_TABLE = """
CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY,
    name          TEXT NOT NULL,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT,
    provider      TEXT NOT NULL DEFAULT 'password',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
)
"""


def open_db():
    pool.open()
    with pool.connection() as conn:
        conn.execute(CREATE_USERS_TABLE)


def close_db():
    pool.close()
