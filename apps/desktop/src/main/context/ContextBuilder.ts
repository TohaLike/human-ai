import { ContextBuilderInput, ConversationContext } from './types'

export class ContextBuilder {
  build(input: ContextBuilderInput): ConversationContext {
    return {
      conversation: input.conversation,
      interlocutor: {
        platform: input.conversation.platform,
        externalId: input.conversation.externalId,
        title: input.conversation.title
      },
      messages: input.messages,
      styleProfile: input.styleProfile
    }
  }
}
