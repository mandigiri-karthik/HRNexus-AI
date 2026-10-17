"""The PostgreSQL connection pools and table setup."""

from langgraph.checkpoint.postgres import PostgresSaver
from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool

from app.config import DATABASE_URL

# A small set of open connections that requests borrow and return.
# dict_row makes each result row a dict, e.g. {"id": ..., "email": ...}.
pool = ConnectionPool(DATABASE_URL, open=False, kwargs={"row_factory": dict_row})

# A separate pool for LangGraph, which needs autocommit and no prepared statements.
checkpoint_pool = ConnectionPool(
    DATABASE_URL, open=False, kwargs={"autocommit": True, "prepare_threshold": 0, "row_factory": dict_row}
)
# Keeps paused intake conversations in the database, so they survive restarts and deploys.
checkpointer = PostgresSaver(checkpoint_pool)

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

CREATE_PROFILES_TABLE = """
CREATE TABLE IF NOT EXISTS profiles (
    user_id    TEXT PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
    source     TEXT NOT NULL,
    data       JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
)
"""

CHECKPOINT_TABLES = ["checkpoints", "checkpoint_blobs", "checkpoint_writes", "checkpoint_migrations"]


def open_db():
    pool.open()
    with pool.connection() as conn:
        conn.execute(CREATE_USERS_TABLE)
        conn.execute(CREATE_PROFILES_TABLE)
        # Supabase publishes every table through its own web API unless this is on.
        conn.execute("ALTER TABLE users ENABLE ROW LEVEL SECURITY")
        conn.execute("ALTER TABLE profiles ENABLE ROW LEVEL SECURITY")

    checkpoint_pool.open()
    # Creates LangGraph's checkpoint tables, or upgrades them after a library update.
    checkpointer.setup()
    with pool.connection() as conn:
        for table in CHECKPOINT_TABLES:
            conn.execute(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY")


def close_db():
    checkpoint_pool.close()
    pool.close()
