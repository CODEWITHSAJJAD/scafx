from dataclasses import dataclass
from datetime import datetime

@dataclass(frozen=True)
class HealthRecord:
    status: str
    service: str
    timestamp: datetime
