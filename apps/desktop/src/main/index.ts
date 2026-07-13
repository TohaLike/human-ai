import 'dotenv/config'
import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { registerBrowserIPC } from './ipc/browser'
import { BrowserController } from './browser/BrowserController'
import { BrowserManager } from './browser/BrowserManager'
import { VKLongPollListener } from './vk/VKLongPollListener'
import { VKMessageParser } from './vk/VKMessageParser'
import { MessageBus } from './events/MessageBus'
import { MessageService } from './messages/MessageService'
import { MessageRepository } from './messages/MessageRepository'
import { ConversationService } from './conversation/ConversationService'
import { ConversationRepository } from './conversation/ConversationRepository'
import { MessageQueue } from './queue/MessageQueue'
import { MessageWorker } from './queue/MessageWorker'
import { MessageProcessor } from './processors/MessageProcessor'

const browserManager = new BrowserManager()
const browserController = new BrowserController(browserManager)

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(async () => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.handle('system:ping', async () => {
    console.log('📡 Ping received from Renderer')
    return 'pong'
  })

  registerBrowserIPC(browserController)

  createWindow()

  await browserController.open('')

  const messageBus = new MessageBus()

  const listener = new VKLongPollListener(
    browserManager.getPage(),
    new VKMessageParser(),
    messageBus
  )

  const messageQueue = new MessageQueue()
  const messageWorker = new MessageWorker(new MessageProcessor())

  const messageService = new MessageService(
    new MessageRepository(),
    new ConversationService(new ConversationRepository()),
    messageQueue
  )

  app.on('before-quit', async () => {
    await messageWorker.close()
    await messageQueue.close()
  })

  listener.start()

  messageBus.on('message', async (message) => {
    await messageService.onMessage(message)
  })

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
