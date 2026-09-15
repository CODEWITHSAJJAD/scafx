from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class WelcomeResponse(BaseModel):
    message: str
    stack: str
    framework: str


@router.get("/", response_model=WelcomeResponse)
async def welcome():
    return WelcomeResponse(
        message="Welcome to {{projectName}} API",
        stack="{{stack}}",
        framework="{{framework}}",
    )
