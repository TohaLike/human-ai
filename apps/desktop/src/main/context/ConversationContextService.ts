import { StyleAnalysisSettingsRepository } from '../analysis/StyleAnalysisSettingsRepository'
import { StyleProfileData } from '../analysis/StyleProfile'
import { StyleProfileRepository } from '../analysis/StyleProfileRepository'
import { prisma } from '../database/prisma'
import { ContextBuilder } from './ContextBuilder'
import { ConversationContext } from './types'

const MESSAGE_LIMIT = 30

export class ConversationContextService {
  constructor(
    private readonly builder: ContextBuilder,
    private readonly styleProfileRepository: StyleProfileRepository,
    private readonly settingsRepository: StyleAnalysisSettingsRepository
  ) {}

  async getContext(conversationId: string): Promise<ConversationContext> {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId }
    })

    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`)
    }

    const messagesDesc = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { date: 'desc' },
      take: MESSAGE_LIMIT,
      select: { text: true, isMine: true, date: true }
    })

    const messages = [...messagesDesc].reverse()
    const styleProfile = await this.resolveStyleProfile(conversationId)

    return this.builder.build({
      conversation: {
        id: conversation.id,
        platform: conversation.platform,
        externalId: conversation.externalId,
        title: conversation.title ?? undefined
      },
      messages,
      styleProfile
    })
  }

  private async resolveStyleProfile(
    conversationId: string
  ): Promise<StyleProfileData | null> {
    const settings = await this.settingsRepository.get()
    const scope = settings.useGlobalMessages ? null : conversationId
    const record = await this.styleProfileRepository.findByScope(scope)

    if (!record) {
      return null
    }

    return record.data as unknown as StyleProfileData
  }
}
