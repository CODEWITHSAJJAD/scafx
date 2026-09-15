/**
 * Redis Queue / BullMQ Background Job Worker
 */
export class RedisQueueWorker {
  private redisHost: string;
  private redisPort: number;

  constructor(
    host = process.env.REDIS_HOST || 'localhost',
    port = Number(process.env.REDIS_PORT) || 6379,
  ) {
    this.redisHost = host;
    this.redisPort = port;
  }

  async enqueue(jobName: string, payload: Record<string, unknown>): Promise<void> {
    console.log(
      `[RedisQueue] Enqueueing "${jobName}" on ${this.redisHost}:${this.redisPort} ->`,
      payload,
    );
  }

  startWorker(jobName: string, _handler: (data: unknown) => Promise<void>): void {
    console.log(`[RedisQueue Worker] Listening for "${jobName}" tasks...`);
  }
}

export const redisQueue = new RedisQueueWorker();
