import { ipcMain } from 'electron'
import { ConfigService } from '../config/ConfigService'
import { AppConfigUpdate } from '../config/types'

type LaunchChatHandler = (url: string) => Promise<void>

export function registerConfigIPC(
  configService: ConfigService,
  onLaunchChat: LaunchChatHandler
): void {
  ipcMain.handle('config:get', async () => {
    return configService.get()
  })

  ipcMain.handle('config:save', async (_, update: AppConfigUpdate) => {
    return configService.save(update)
  })

  ipcMain.handle('config:launch-chat', async (_, chatUrl?: string) => {
    const config = configService.get()
    const url = (typeof chatUrl === 'string' ? chatUrl : config.vkChatUrl).trim()

    if (!url) {
      throw new Error('Укажи ссылку на чат VK')
    }

    if (url !== config.vkChatUrl) {
      configService.save({ vkChatUrl: url })
    } else {
      configService.applyToEnv()
    }

    await onLaunchChat(url)
    return configService.get()
  })
}
