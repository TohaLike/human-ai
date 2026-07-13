import { prisma } from '../database/prisma'

export class MessageProcessor {
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
  }
}
