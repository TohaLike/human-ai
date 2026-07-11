import { ipcRenderer } from 'electron'

export const browserApi = {
  open(url: string): Promise<void> {
    return ipcRenderer.invoke('browser:open', url)
  }
}
