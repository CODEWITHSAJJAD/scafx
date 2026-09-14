from datetime import datetime
from pydantic import BaseModel, Field


class UserModel(BaseModel):
    email: str = Field(..., description="User email address")
    name: str | None = Field(None, description="User full name")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_schema_extra = {
            "example": {
                "email": "user@example.com",
                "name": "Jane Doe",
            }
        }
