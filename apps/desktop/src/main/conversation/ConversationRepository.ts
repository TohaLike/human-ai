import { prisma } from '../database/prisma'

export class ConversationRepository {
  constructor() {}

  async findByExternalId(platform: string, externalId: string) {
    return prisma.conversation.findUnique({
      where: {
        platform_externalId: {
          platform,
          externalId
        }
      }
    })
  }

  async create(data: { platform: string; externalId: string; title?: string }) {
    return prisma.conversation.create({
      data
    })
  }
}
