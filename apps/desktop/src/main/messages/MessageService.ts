import { Message } from './Message'
import { MessageRepository } from './MessageRepository'
import { ConversationService } from '../conversation/ConversationService'

const VK_PLATFORM = 'vk'

export class MessageService {
  constructor(
    private readonly repository: MessageRepository,
    private readonly conversationService: ConversationService
  ) {}

  async onMessage(message: Message) {
    const conversation = await this.conversationService.findOrCreate(
      VK_PLATFORM,
      String(message.peerId)
    )

    await this.repository.create(message, conversation.id)

    console.log('💾 Saved message:', message)
  }
}
