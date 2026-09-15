import os
import json

class KafkaClient:
    def __init__(self, bootstrap_servers: str = None):
        self.bootstrap_servers = bootstrap_servers or os.getenv("KAFKA_BROKERS", "localhost:9092")

    def emit(self, topic: str, payload: dict):
        print(f"[Kafka] Emitting event to '{topic}' on {self.bootstrap_servers}: {json.dumps(payload)}")

    def subscribe(self, topic: str, handler):
        print(f"[Kafka] Subscribed to topic '{topic}'")

kafka_client = KafkaClient()
