import os
import time

class MicroserviceNode:
    def __init__(self, name: str = "{{projectName}}"):
        self.name = name
        self.start_time = time.time()
        self.instance_id = f"{name}-{os.getpid()}"

    def get_info(self) -> dict:
        return {
            "service": self.name,
            "instance_id": self.instance_id,
            "status": "online",
            "uptime_seconds": round(time.time() - self.start_time, 2),
        }

service_node = MicroserviceNode()
