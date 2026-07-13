import { Prisma } from '../../generated/prisma/client'
import { prisma } from '../database/prisma'
import { StyleProfileData } from './StyleProfile'

export class StyleProfileRepository {
  async findByScope(conversationId: string | null) {
    if (conversationId === null) {
      return prisma.styleProfile.findFirst({
        where: { conversationId: null }
      })
    }

    return prisma.styleProfile.findUnique({
      where: { conversationId }
    })
  }

  async save(data: StyleProfileData, conversationId: string | null) {
    const existing = await this.findByScope(conversationId)

    if (existing) {
      return prisma.styleProfile.update({
        where: { id: existing.id },
        data: { data: data as unknown as Prisma.InputJsonValue }
      })
    }

    return prisma.styleProfile.create({
      data: {
        conversationId,
        data: data as unknown as Prisma.InputJsonValue
      }
    })
  }
}
