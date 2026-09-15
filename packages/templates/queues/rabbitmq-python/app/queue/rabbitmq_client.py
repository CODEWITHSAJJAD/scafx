import os
import json

class RabbitMQClient:
    def __init__(self, amqp_url: str = None):
        self.amqp_url = amqp_url or os.getenv("RABBITMQ_URL", "amqp://guest:guest@localhost:5672/")

    def publish(self, queue_name: str, payload: dict):
        print(f"[RabbitMQ] Publishing message to {queue_name}: {json.dumps(payload)}")

    def consume(self, queue_name: str, callback):
        print(f"[RabbitMQ] Listening on queue: {queue_name}")

rabbitmq_client = RabbitMQClient()
