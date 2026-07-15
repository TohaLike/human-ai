import { contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { systemApi } from '../main/ipc/system'
import { browserApi } from './browser'
import { repliesApi } from './replies'

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)

    contextBridge.exposeInMainWorld('system', systemApi)

    contextBridge.exposeInMainWorld('browser', browserApi)

    contextBridge.exposeInMainWorld('replies', repliesApi)
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
}
