import { Locator, Page } from 'playwright'
import { platform } from 'os'
import { BrowserManager } from '../browser/BrowserManager'
import { prisma } from '../database/prisma'
import { GeneratedReplyRecord } from '../replies/types'

const INPUT_SELECTORS = [
  '[data-testid="mail_box_input"]',
  '.ConvoComposer__input [contenteditable="true"]',
  '.ConvoComposer__input',
  '.im_editable0',
  'div[role="textbox"]'
]

const SEND_BUTTON_SELECTORS = [
  '[data-testid="mail_box_send_button"]',
  '.ConvoComposer__button--send',
  'button.ConvoComposer__sendButton',
  '.ConvoComposer__sendButton'
]

export class VKSenderError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'VKSenderError'
  }
}

export class VKSender {
  constructor(private readonly browserManager: BrowserManager) {}

  async send(reply: GeneratedReplyRecord): Promise<void> {
    const conversation = await prisma.conversation.findUnique({
      where: { id: reply.conversationId }
    })

    if (!conversation) {
      throw new VKSenderError(`Conversation ${reply.conversationId} not found`)
    }

    const page = this.browserManager.getPage()
    await this.ensureChatOpen(page, conversation.externalId)

    const input = await this.findMessageInput(page)
    await this.submitMessage(page, input, reply.text)

    console.log('📤 VK message sent:', {
      peerId: conversation.externalId,
      text: reply.text
    })
  }

  private async ensureChatOpen(page: Page, externalId: string): Promise<void> {
    const chatPath = `/im/convo/${externalId}`
    const currentUrl = page.url()

    if (currentUrl.includes(chatPath)) {
      await this.waitForComposer(page)
      return
    }

    const chatUrl = `https://vk.com/im/convo/${externalId}?entrypoint=vkcom_right_column_menu`
    await page.goto(chatUrl, { waitUntil: 'domcontentloaded' })
    await this.waitForComposer(page)
  }

  private async waitForComposer(page: Page): Promise<void> {
    for (const selector of INPUT_SELECTORS) {
      const locator = page.locator(selector).last()
      try {
        await locator.waitFor({ state: 'visible', timeout: 3000 })
        return
      } catch {
        continue
      }
    }

    throw new VKSenderError('VK composer is not ready')
  }

  private async submitMessage(page: Page, input: Locator, text: string): Promise<void> {
    await input.scrollIntoViewIfNeeded()
    await input.click()

    const selectAllShortcut = platform() === 'darwin' ? 'Meta+a' : 'Control+a'
    await page.keyboard.press(selectAllShortcut)
    await page.keyboard.press('Backspace')

    try {
      await input.fill(text)
    } catch {
      await input.pressSequentially(text, { delay: 2 })
    }

    const sentViaButton = await this.clickSendButton(page)
    if (!sentViaButton) {
      await input.press('Enter')
    }

    await page.waitForTimeout(100)

    const remainingText = (await input.innerText()).trim()
    if (remainingText === text || remainingText.length > 0) {
      await this.clickSendButton(page)
      await input.press('Enter')
      await page.waitForTimeout(100)

      const retryRemainingText = (await input.innerText()).trim()
      if (retryRemainingText === text || retryRemainingText.length > 0) {
        throw new VKSenderError('Message was typed but not sent')
      }
    }
  }

  private async clickSendButton(page: Page): Promise<boolean> {
    for (const selector of SEND_BUTTON_SELECTORS) {
      const button = page.locator(selector).first()
      const count = await button.count()

      if (count === 0) {
        continue
      }

      try {
        await button.waitFor({ state: 'visible', timeout: 2000 })
        await button.click({ timeout: 2000 })
        return true
      } catch {
        continue
      }
    }

    return false
  }

  private async findMessageInput(page: Page): Promise<Locator> {
    for (const selector of INPUT_SELECTORS) {
      const locator = page.locator(selector).last()
      const count = await locator.count()

      if (count > 0) {
        await locator.waitFor({ state: 'visible', timeout: 5000 })
        return locator
      }
    }

    throw new VKSenderError('VK message input not found')
  }
}
