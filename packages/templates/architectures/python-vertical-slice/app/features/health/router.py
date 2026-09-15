from fastapi import APIRouter
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(prefix="/health", tags=["Health"])

class HealthResponse(BaseModel):
    status: str
    service: str
    timestamp: datetime

@router.get("", response_model=HealthResponse)
async def get_health():
    return HealthResponse(
        status="ok",
        service="{{projectName}}",
        timestamp=datetime.utcnow()
    )
