import { BrowserManager } from '../browser/BrowserManager'
import { Message } from '../browser/types'

export class DOMService {
  constructor(private browserManager: BrowserManager) {}

  async getVKMessages(): Promise<Message[]> {
    const page = this.browserManager.getPage()

    return page.evaluate(() => {
      return [...document.querySelectorAll('article')]
        .map((article) => {
          const container = article.closest('[data-itemkey]')

          const id = container?.getAttribute('data-itemkey') ?? ''

          const text = article.querySelector('.MessageText')?.textContent?.trim() ?? ''

          const authorName = article.querySelector('.PeerTitle__title')?.textContent?.trim() ?? ''

          const timestamp = article
            .querySelector('.ConvoMessageBottomInfo__date')
            ?.textContent?.trim()

          const isOutgoing = article.classList.contains('ConvoHistory__messageBlock--out')

          return {
            id,

            author: {
              name: authorName
            },

            text,

            timestamp,

            isOutgoing,

            platform: 'vk' as const
          }
        })
        .filter((message) => message.text)
    })
  }
}
