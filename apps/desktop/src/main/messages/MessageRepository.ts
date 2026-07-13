import { prisma } from '../database/prisma'
import { Message } from './Message'

export class MessageRepository {
  async create(message: Message, conversationId: string) {
    return prisma.message.create({
      data: {
        id: message.id,
        conversationId,
        text: message.text,
        date: message.date,
        isMine: message.isMine
      }
    })
  }
}
