import { ipcRenderer } from 'electron'

export const systemApi = {
  ping: (): Promise<string> => {
    return ipcRenderer.invoke('system:ping')
  }
}
