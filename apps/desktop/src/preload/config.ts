import { ipcRenderer } from 'electron'
import type { AppConfig, AppConfigUpdate } from '../main/config/types'

export const configApi = {
  get(): Promise<AppConfig> {
    return ipcRenderer.invoke('config:get')
  },

  save(update: AppConfigUpdate): Promise<AppConfig> {
    return ipcRenderer.invoke('config:save', update)
  },

  launchChat(chatUrl?: string): Promise<AppConfig> {
    return ipcRenderer.invoke('config:launch-chat', chatUrl)
  }
}
