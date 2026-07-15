import { prisma } from '../database/prisma'
import { Message } from './Message'

export class MessageRepository {
  async create(message: Message, conversationId: string) {
    return prisma.message.upsert({
      where: { id: message.id },
      update: {
        conversationId,
        text: message.text,
        date: message.date,
        isMine: message.isMine
      },
      create: {
        id: message.id,
        conversationId,
        text: message.text,
        date: message.date,
        isMine: message.isMine
      }
    })
  }
}
