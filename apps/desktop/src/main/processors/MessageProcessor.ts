import { StyleProfileService } from '../analysis/StyleProfileService'
import { AIService } from '../ai/AIService'
import {
  getReplyDebounceMs,
  getReplyDelayMs,
  isAutoSendEnabled,
  isSelfChatTestMode
} from '../ai/config'
import { AIProviderError } from '../ai/types'
import { ConversationContextService } from '../context/ConversationContextService'
import { prisma } from '../database/prisma'
import { ReplyService } from '../replies/ReplyService'
import { VKSender } from '../vk/VKSender'

export class MessageProcessor {
  private readonly replyTimers = new Map<string, NodeJS.Timeout>()

  constructor(
    private readonly styleProfileService?: StyleProfileService,
    private readonly conversationContextService?: ConversationContextService,
    private readonly aiService?: AIService,
    private readonly replyService?: ReplyService,
    private readonly vkSender?: VKSender
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
      isMine: message.isMine,
      conversationId: message.conversationId
    })

    await prisma.message.update({
      where: { id: messageId },
      data: { processed: true }
    })

    if (message.isMine && this.styleProfileService) {
      await this.styleProfileService.analyzeUserStyle(message.conversationId)
    }

    if (!message.text.trim()) {
      console.log('⏭ Skip AI: empty message text')
      return
    }

    if (message.isMine && (await this.isEchoOfSentReply(message))) {
      console.log('⏭ Skip AI: message matches a recently sent reply')
      return
    }

    const shouldGenerateAiReply =
      !message.isMine || (message.isMine && isSelfChatTestMode())

    if (
      shouldGenerateAiReply &&
      this.conversationContextService &&
      this.aiService &&
      this.replyService
    ) {
      this.scheduleDebouncedReply(message.conversationId, message.id)
    }
  }

  private scheduleDebouncedReply(conversationId: string, sourceMessageId: number): void {
    const existing = this.replyTimers.get(conversationId)
    if (existing) {
      clearTimeout(existing)
    }

    const debounceMs = getReplyDebounceMs()
    const timer = setTimeout(() => {
      this.replyTimers.delete(conversationId)
      void this.generateAiReplyForLatest(conversationId, sourceMessageId)
    }, debounceMs)

    this.replyTimers.set(conversationId, timer)

    if (debounceMs > 0) {
      console.log(`⏳ Debouncing reply for ${debounceMs}ms...`)
    }
  }

  private async generateAiReplyForLatest(
    conversationId: string,
    scheduledMessageId: number
  ): Promise<void> {
    const latestIncoming = await prisma.message.findFirst({
      where: {
        conversationId,
        isMine: false,
        text: { not: '' }
      },
      orderBy: { date: 'desc' }
    })

    if (!latestIncoming) {
      return
    }

    if (latestIncoming.id !== scheduledMessageId) {
      console.log('📨 Replying to newer message after debounce')
    }

    const existingReply = await prisma.generatedReply.findFirst({
      where: {
        sourceMessageId: latestIncoming.id,
        status: { in: ['PENDING', 'APPROVED', 'SENT'] }
      }
    })

    if (existingReply) {
      console.log(`⏭ Skip AI: reply already exists for message ${latestIncoming.id}`)
      return
    }

    await this.generateAiReply(conversationId, latestIncoming.id)
  }

  private async isEchoOfSentReply(message: {
    conversationId: string
    text: string
  }): Promise<boolean> {
    const sentReply = await prisma.generatedReply.findFirst({
      where: {
        conversationId: message.conversationId,
        status: 'SENT',
        text: message.text
      },
      orderBy: { updatedAt: 'desc' }
    })

    return sentReply !== null
  }

  private async generateAiReply(
    conversationId: string,
    sourceMessageId: number
  ): Promise<void> {
    const startedAt = Date.now()

    try {
      const contextStartedAt = Date.now()
      const context = await this.conversationContextService!.getContext(conversationId)
      console.log(`⏱ Context loaded in ${Date.now() - contextStartedAt}ms`)

      const aiStartedAt = Date.now()
      const text = await this.aiService!.generateReply(context, sourceMessageId)
      console.log(`⏱ AI generated in ${Date.now() - aiStartedAt}ms`)

      const pending = await this.replyService!.createPendingReply({
        conversationId,
        sourceMessageId,
        text
      })

      if (isAutoSendEnabled() && this.vkSender) {
        const delayMs = getReplyDelayMs()
        if (delayMs > 0) {
          console.log(`⏳ Waiting ${delayMs}ms before send...`)
          await new Promise((resolve) => setTimeout(resolve, delayMs))
        }

        const sendStartedAt = Date.now()
        console.log('🚀 Auto-send enabled, sending reply to VK...')
        await this.replyService!.approveAndSendReply(pending.id, this.vkSender)
        console.log(`⏱ VK send in ${Date.now() - sendStartedAt}ms`)
      }

      console.log(`⏱ Total reply pipeline: ${Date.now() - startedAt}ms`)
    } catch (error) {
      if (error instanceof AIProviderError && error.code === 'MISSING_API_KEY') {
        console.warn('⚠️ AI skipped: OPENROUTER_API_KEY is not set')
        return
      }

      console.error('❌ Failed to generate AI reply:', error)
    }
  }
}
