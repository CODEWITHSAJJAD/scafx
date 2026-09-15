import os

class TaskWorker:
    def __init__(self, broker_url: str = None):
        self.broker_url = broker_url or os.getenv("REDIS_URL", "redis://localhost:6379/0")

    def dispatch(self, task_name: str, **kwargs):
        print(f"[Celery/Redis] Dispatching task '{task_name}' via {self.broker_url} with args: {kwargs}")

task_worker = TaskWorker()
