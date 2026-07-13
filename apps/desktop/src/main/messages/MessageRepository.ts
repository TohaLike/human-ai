import { prisma } from '../database/prisma'
import { Message } from './Message'

export class MessageRepository {
  async create(message: Message) {
    return prisma.message.create({
      data: {
        id: message.id,
        peerId: message.peerId,
        text: message.text,
        date: message.date,
        isMine: message.isMine
      }
    })
  }
}
