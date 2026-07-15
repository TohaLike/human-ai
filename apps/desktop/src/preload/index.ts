import { contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { systemApi } from '../main/ipc/system'
import { browserApi } from './browser'
import { repliesApi } from './replies'
import { configApi } from './config'

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('system', systemApi)
    contextBridge.exposeInMainWorld('browser', browserApi)
    contextBridge.exposeInMainWorld('replies', repliesApi)
    contextBridge.exposeInMainWorld('config', configApi)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.system = systemApi
  // @ts-ignore (define in dts)
  window.browser = browserApi
  // @ts-ignore (define in dts)
  window.replies = repliesApi
  // @ts-ignore (define in dts)
  window.config = configApi
}
