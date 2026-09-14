import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.api import router as api_router
from app.routes.health import router as health_router


def create_app() -> FastAPI:
    app = FastAPI(
        title="{{projectName}}",
        version="0.1.0",
        description="FastAPI service scaffolded by scafx",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health_router, prefix="", tags=["Health"])
    app.include_router(api_router, prefix="/api", tags=["API"])

    return app


app = create_app()

if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
