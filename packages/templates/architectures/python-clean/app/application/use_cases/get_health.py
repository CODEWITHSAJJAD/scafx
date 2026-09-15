from datetime import datetime
from app.domain.entities.health import HealthRecord

class GetHealthUseCase:
    def __init__(self, service_name: str = "{{projectName}}"):
        self.service_name = service_name

    def execute(self) -> HealthRecord:
        return HealthRecord(
            status="healthy",
            service=self.service_name,
            timestamp=datetime.utcnow(),
        )
