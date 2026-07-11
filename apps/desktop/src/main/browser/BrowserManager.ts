import { BrowserContext, chromium, Page } from 'playwright'
import path from 'path'

export class BrowserManager {
  private context?: BrowserContext
  private page?: Page

  async open(url: string): Promise<void> {
    const userDataDir = path.join(process.cwd(), 'user-data')

    if (!this.context) {
      this.context = await chromium.launchPersistentContext(userDataDir, {
        headless: false
      })
    }

    this.page = await this.context.newPage()

    await this.page?.goto(url)
  }

  getPage(): Page {
    if (!this.page) {
      throw new Error('Page is not initialized')
    }

    return this.page
  }
}

export const browserManager = new BrowserManager()
