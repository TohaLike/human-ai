export type ReplyStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SENT'

export interface CreatePendingReplyInput {
  conversationId: string
  sourceMessageId: number
  text: string
}

export interface GeneratedReplyRecord {
  id: string
  conversationId: string
  sourceMessageId: number
  text: string
  status: ReplyStatus
  createdAt: Date
  updatedAt: Date
}
