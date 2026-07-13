import { Page } from 'playwright'
import { VKMessageParser } from './VKMessageParser'
import { MessageBus } from '../events/MessageBus'

export class VKLongPollListener {
  constructor(
    private page: Page,
    private parser: VKMessageParser,
    private messageBus: MessageBus
  ) {}

  start() {
    this.page.on('response', async (response) => {
      const url = response.url()

      if (!url.includes('ruim')) {
        return
      }

      try {
        const data = await response.json()

        if (!Array.isArray(data.updates)) {
          console.log('No updates')
          return
        }

        for (const update of data.updates) {
          const message = this.parser.parse(update)

          if (message) {
            this.messageBus.emit("message", message)
          }
        }
      } catch (error) {
        console.error('VK RUIM error:', error)
      }
    })
  }
}
