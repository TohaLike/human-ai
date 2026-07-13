import { Job, Worker } from 'bullmq'
import { MessageProcessor } from '../processors/MessageProcessor'
import { MESSAGE_QUEUE_NAME, MessageJobData } from './MessageQueue'
import { getRedisOptions } from './redis'

export class MessageWorker {
  private readonly worker: Worker<MessageJobData>

  constructor(private readonly processor: MessageProcessor) {
    this.worker = new Worker<MessageJobData>(
      MESSAGE_QUEUE_NAME,
      async (job) => this.handleJob(job),
      { connection: getRedisOptions() }
    )

    this.worker.on('failed', (job, error) => {
      console.error(`❌ Job ${job?.id} failed:`, error.message)
    })

    this.worker.on('error', (error) => {
      console.error('❌ Worker error:', error)
    })
  }

  private async handleJob(job: Job<MessageJobData>): Promise<void> {
    try {
      await this.processor.process(job.data.messageId)
    } catch (error) {
      console.error(`❌ Failed to process message ${job.data.messageId}:`, error)
      throw error
    }
  }

  async close(): Promise<void> {
    await this.worker.close()
  }
}
