import { StyleProfileService } from '../analysis/StyleProfileService'
import { AIService } from '../ai/AIService'
import { isSelfChatTestMode } from '../ai/config'
import { AIProviderError } from '../ai/types'
import { ConversationContextService } from '../context/ConversationContextService'
import { prisma } from '../database/prisma'

export class MessageProcessor {
  constructor(
    private readonly styleProfileService?: StyleProfileService,
    private readonly conversationContextService?: ConversationContextService,
    private readonly aiService?: AIService
  ) {}

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

    const shouldGenerateAiReply =
      !message.isMine || (message.isMine && isSelfChatTestMode())

    if (shouldGenerateAiReply && this.conversationContextService && this.aiService) {
      await this.generateAiReply(message.conversationId)
    }
  }

  private async generateAiReply(conversationId: string): Promise<void> {
    try {
      const context = await this.conversationContextService!.getContext(conversationId)
      await this.aiService!.generateReply(context)
    } catch (error) {
      if (error instanceof AIProviderError && error.code === 'MISSING_API_KEY') {
        console.warn('⚠️ AI skipped: OPENROUTER_API_KEY is not set')
        return
      }

      console.error('❌ Failed to generate AI reply:', error)
    }
  }
}
