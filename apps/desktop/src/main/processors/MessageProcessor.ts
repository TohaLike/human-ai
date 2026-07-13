import { prisma } from '../database/prisma'
import { StyleProfileService } from '../analysis/StyleProfileService'

export class MessageProcessor {
  constructor(private readonly styleProfileService?: StyleProfileService) {}

  async process(messageId: number): Promise<void> {
    const message = await prisma.message.findUnique({
      where: { id: messageId }
    })

    if (!message) {
      throw new Error(`Message ${messageId} not found`)
    }

    if (message.processed) {
      console.log(`⏭ Message ${messageId} already processed`)
      return
    }

    console.log('Processing message:', {
      id: message.id,
      text: message.text,
      conversationId: message.conversationId
    })

    await prisma.message.update({
      where: { id: messageId },
      data: { processed: true }
    })

    if (message.isMine && this.styleProfileService) {
      await this.styleProfileService.analyzeUserStyle(message.conversationId)
    }
  }
}
