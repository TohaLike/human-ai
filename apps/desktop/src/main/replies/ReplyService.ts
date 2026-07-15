import { VKSender } from '../vk/VKSender'
import { ReplyRepository } from './ReplyRepository'
import { CreatePendingReplyInput, GeneratedReplyRecord } from './types'

export class ReplyService {
  constructor(private readonly repository: ReplyRepository) {}

  async createPendingReply(input: CreatePendingReplyInput): Promise<GeneratedReplyRecord> {
    const existing = await this.repository.findPendingBySourceMessage(input.sourceMessageId)

    const reply = existing
      ? await this.repository.updateText(existing.id, input.text)
      : await this.repository.create(input)

    console.log('📝 Generated reply created:', {
      id: reply.id,
      status: reply.status,
      text: reply.text
    })

    return reply
  }

  async approveReply(id: string): Promise<GeneratedReplyRecord> {
    const reply = await this.repository.updateStatus(id, 'APPROVED')
    console.log('✅ Reply approved:', { id: reply.id, text: reply.text })
    return reply
  }

  async rejectReply(id: string): Promise<GeneratedReplyRecord> {
    const reply = await this.repository.updateStatus(id, 'REJECTED')
    console.log('🚫 Reply rejected:', { id: reply.id, text: reply.text })
    return reply
  }

  async getPendingReplies(conversationId?: string): Promise<GeneratedReplyRecord[]> {
    return this.repository.findPending(conversationId)
  }

  async sendApprovedReply(id: string, vkSender: VKSender): Promise<GeneratedReplyRecord> {
    const reply = await this.repository.findById(id)

    if (!reply) {
      throw new Error(`Reply ${id} not found`)
    }

    if (reply.status !== 'APPROVED') {
      throw new Error(`Reply ${id} must be APPROVED before send (current: ${reply.status})`)
    }

    await vkSender.send(reply)

    const sent = await this.repository.updateStatus(id, 'SENT')
    console.log('✅ Reply sent:', { id: sent.id, status: sent.status, text: sent.text })

    return sent
  }

  async approveAndSendReply(id: string, vkSender: VKSender): Promise<GeneratedReplyRecord> {
    await this.approveReply(id)
    return this.sendApprovedReply(id, vkSender)
  }
}
