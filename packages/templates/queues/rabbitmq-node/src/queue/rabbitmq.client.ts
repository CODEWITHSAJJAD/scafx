/**
 * RabbitMQ AMQP Client & Message Publisher / Consumer
 */
export class RabbitMqClient {
  private url: string;

  constructor(url = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672') {
    this.url = url;
  }

  async publish(queueName: string, message: Record<string, unknown>): Promise<void> {
    console.log(`[RabbitMQ] Publishing to "${queueName}" ->`, JSON.stringify(message));
    // Implementation can hook amqplib.connect(this.url) here
  }

  async consume(queueName: string, onMessage: (msg: unknown) => void): Promise<void> {
    console.log(`[RabbitMQ] Subscribing to queue "${queueName}" on ${this.url}`);
  }
}

export const rabbitMq = new RabbitMqClient();
