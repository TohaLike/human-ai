import { GeneratedReplyRecord } from '../main/replies/types'
import { ipcRenderer } from 'electron'

export const repliesApi = {
  pending(conversationId?: string): Promise<GeneratedReplyRecord[]> {
    return ipcRenderer.invoke('replies:pending', conversationId)
  },

  approve(id: string): Promise<GeneratedReplyRecord> {
    return ipcRenderer.invoke('replies:approve', id)
  },

  reject(id: string): Promise<GeneratedReplyRecord> {
    return ipcRenderer.invoke('replies:reject', id)
  },

  send(id: string): Promise<GeneratedReplyRecord> {
    return ipcRenderer.invoke('replies:send', id)
  },

  approveAndSend(id: string): Promise<GeneratedReplyRecord> {
    return ipcRenderer.invoke('replies:approve-and-send', id)
  }
}
