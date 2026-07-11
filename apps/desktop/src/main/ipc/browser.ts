import { ipcMain } from 'electron'
import { BrowserController } from '../browser/BrowserController'

export function registerBrowserIPC(browserController: BrowserController) {
  ipcMain.handle('browser:open', (_, url: string) => {
    return browserController.open(url)
  })
}
