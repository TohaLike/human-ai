import { prisma } from '../database/prisma'
import { CreatePendingReplyInput, GeneratedReplyRecord, ReplyStatus } from './types'

function toRecord(reply: {
  id: string
  conversationId: string
  sourceMessageId: number
  text: string
  status: ReplyStatus
  createdAt: Date
  updatedAt: Date
}): GeneratedReplyRecord {
  return {
    id: reply.id,
    conversationId: reply.conversationId,
    sourceMessageId: reply.sourceMessageId,
    text: reply.text,
    status: reply.status,
    createdAt: reply.createdAt,
    updatedAt: reply.updatedAt
  }
}

export class ReplyRepository {
  async create(data: CreatePendingReplyInput): Promise<GeneratedReplyRecord> {
    const reply = await prisma.generatedReply.create({
      data: {
        conversationId: data.conversationId,
        sourceMessageId: data.sourceMessageId,
        text: data.text
      }
    })

    return toRecord(reply)
  }

  async findById(id: string): Promise<GeneratedReplyRecord | null> {
    const reply = await prisma.generatedReply.findUnique({ where: { id } })
    return reply ? toRecord(reply) : null
  }

  async updateStatus(id: string, status: ReplyStatus): Promise<GeneratedReplyRecord> {
    const reply = await prisma.generatedReply.update({
      where: { id },
      data: { status }
    })

    return toRecord(reply)
  }

  async updateText(id: string, text: string): Promise<GeneratedReplyRecord> {
    const reply = await prisma.generatedReply.update({
      where: { id },
      data: { text, status: 'PENDING' }
    })

    return toRecord(reply)
  }

  async findPending(conversationId?: string): Promise<GeneratedReplyRecord[]> {
    const replies = await prisma.generatedReply.findMany({
      where: {
        status: 'PENDING',
        ...(conversationId ? { conversationId } : {})
      },
      orderBy: { createdAt: 'desc' }
    })

    return replies.map(toRecord)
  }

  async findPendingBySourceMessage(
    sourceMessageId: number
  ): Promise<GeneratedReplyRecord | null> {
    const reply = await prisma.generatedReply.findFirst({
      where: {
        sourceMessageId,
        status: 'PENDING'
      },
      orderBy: { createdAt: 'desc' }
    })

    return reply ? toRecord(reply) : null
  }
}
