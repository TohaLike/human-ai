import { Message } from './Message'
import { MessageRepository } from './MessageRepository'

export class MessageService {
  constructor(private readonly repository: MessageRepository) {}

  async onMessage(message: Message) {
    await this.repository.create(message)

    console.log('💾 Saved message:', message)
  }
}
