import os
from tortoise import Tortoise

TORTOISE_ORM = {
    "connections": {
        "default": os.getenv("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/app_db")
    },
    "apps": {
        "models": {
            "models": ["app.models.user", "aerich.models"],
            "default_connection": "default",
        },
    },
}

async def init_db():
    await Tortoise.init(config=TORTOISE_ORM)
    await Tortoise.generate_schemas()
