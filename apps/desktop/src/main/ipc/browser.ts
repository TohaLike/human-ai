import { ipcMain } from 'electron'
import { BrowserController } from '../browser/BrowserController'

type OpenHandler = (url: string) => Promise<void>

export function registerBrowserIPC(
  browserController: BrowserController,
  onOpen?: OpenHandler
): void {
  ipcMain.handle('browser:open', async (_, url: string) => {
    const target = typeof url === 'string' ? url.trim() : ''

    if (onOpen && target) {
      await onOpen(target)
      return
    }

    if (!target) {
      throw new Error('Укажи ссылку на чат')
    }

    await browserController.open(target)
  })
}
