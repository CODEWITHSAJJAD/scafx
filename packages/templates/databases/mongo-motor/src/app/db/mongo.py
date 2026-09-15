import os
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "{{projectName}}")


class DatabaseManager:
    client: AsyncIOMotorClient | None = None
    db: AsyncIOMotorDatabase | None = None


db_manager = DatabaseManager()


async def connect_database() -> None:
    db_manager.client = AsyncIOMotorClient(MONGODB_URI)
    db_manager.db = db_manager.client[DATABASE_NAME]


async def close_database() -> None:
    if db_manager.client:
        db_manager.client.close()


def get_database() -> AsyncIOMotorDatabase:
    if db_manager.db is None:
        raise RuntimeError("Database client not initialized")
    return db_manager.db
