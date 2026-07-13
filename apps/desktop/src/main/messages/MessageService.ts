import { Message } from './Message'

export class MessageService {
  async onMessage(message: Message) {
    console.log(message)
  }
}
