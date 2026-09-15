from starlette.middleware.sessions import SessionMiddleware
from fastapi import FastAPI
import os

def setup_session_auth(app: FastAPI):
    app.add_middleware(
        SessionMiddleware,
        secret_key=os.getenv("SESSION_SECRET", "super-secret-session-key-32-chars-long"),
        session_cookie="session",
        max_age=86400,
        same_site="lax",
        https_only=os.getenv("ENV") == "production",
    )
