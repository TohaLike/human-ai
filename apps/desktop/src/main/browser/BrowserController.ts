import { BrowserManager } from './BrowserManager'

export class BrowserController {
  constructor(private browserManager: BrowserManager) {}

  async open(url: string): Promise<void> {
    return this.browserManager.open(url)
  }
}
