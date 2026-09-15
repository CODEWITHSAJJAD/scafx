from dataclasses import dataclass
from datetime import datetime

@dataclass
class UserModel:
    id: str
    username: str
    email: str
    created_at: datetime = datetime.utcnow()
