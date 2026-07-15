import { ElectronAPI } from '@electron-toolkit/preload'
import { BrowserAPI } from '../main/browser/types'
import { GeneratedReplyRecord } from '../main/replies/types'

interface SystemAPI {
  ping(): Promise<string>
}

interface RepliesAPI {
  pending(conversationId?: string): Promise<GeneratedReplyRecord[]>
  approve(id: string): Promise<GeneratedReplyRecord>
  reject(id: string): Promise<GeneratedReplyRecord>
  send(id: string): Promise<GeneratedReplyRecord>
  approveAndSend(id: string): Promise<GeneratedReplyRecord>
}

declare global {
  interface Window {
    electron: ElectronAPI
    system: SystemAPI
    browser: BrowserAPI
    replies: RepliesAPI
  }
}
