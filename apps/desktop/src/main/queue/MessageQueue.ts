import { Queue } from 'bullmq'
import { getRedisOptions } from './redis'

export const MESSAGE_QUEUE_NAME = 'message-processing'

export type MessageJobData = {
  messageId: number
}

export class MessageQueue {
  private readonly queue: Queue

  constructor() {
    this.queue = new Queue(MESSAGE_QUEUE_NAME, {
      connection: getRedisOptions()
    })
  }

  async addMessage(messageId: number): Promise<void> {
    await this.queue.add(
      'process-message',
      { messageId },
      {
        jobId: `message-${messageId}`,
        removeOnComplete: true,
        removeOnFail: 100
      }
    )
  }

  async close(): Promise<void> {
    await this.queue.close()
  }
}
