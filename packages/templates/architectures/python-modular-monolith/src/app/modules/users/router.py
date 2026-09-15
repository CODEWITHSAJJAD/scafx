from fastapi import APIRouter

router = APIRouter(prefix="/users", tags=["Users Module"])

@router.get("/")
async def list_users():
    return [{"id": 1, "username": "admin", "module": "users"}]
