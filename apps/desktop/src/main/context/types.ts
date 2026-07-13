import { StyleProfileData } from '../analysis/StyleProfile'

export interface ContextMessage {
  text: string
  isMine: boolean
  date: Date
}

export interface ContextConversation {
  id: string
  platform: string
  externalId: string
  title?: string
}

export interface ContextInterlocutor {
  platform: string
  externalId: string
  title?: string
}

export interface ConversationContext {
  conversation: ContextConversation
  interlocutor: ContextInterlocutor
  messages: ContextMessage[]
  styleProfile: StyleProfileData | null
}

export interface ContextBuilderInput {
  conversation: ContextConversation
  messages: ContextMessage[]
  styleProfile: StyleProfileData | null
}
