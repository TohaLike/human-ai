import { Message } from './Message'
import { MessageRepository } from './MessageRepository'
import { ConversationService } from '../conversation/ConversationService'
import { MessageQueue } from '../queue/MessageQueue'

const VK_PLATFORM = 'vk'

export class MessageService {
  constructor(
    private readonly repository: MessageRepository,
    private readonly conversationService: ConversationService,
    private readonly messageQueue: MessageQueue
  ) {}

  async onMessage(message: Message) {
    const conversation = await this.conversationService.findOrCreate(
      VK_PLATFORM,
      String(message.peerId)
    )

    const saved = await this.repository.create(message, conversation.id)

    console.log('💾 Saved message:', message)

    await this.messageQueue.addMessage(saved.id)
  }
}
