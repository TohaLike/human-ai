import { ElectronAPI } from '@electron-toolkit/preload'
import { BrowserAPI } from '../main/browser/types'

interface SystemAPI {
  ping(): Promise<string>
}

declare global {
  interface Window {
    electron: ElectronAPI
    system: SystemAPI
    browser: BrowserAPI
  }
}
