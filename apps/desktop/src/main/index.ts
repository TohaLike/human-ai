import 'dotenv/config'
import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { registerBrowserIPC } from './ipc/browser'
import { registerConfigIPC } from './ipc/config'
import { BrowserController } from './browser/BrowserController'
import { BrowserManager } from './browser/BrowserManager'
import { ConfigService } from './config/ConfigService'
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
import { MessageAnalyzer } from './analysis/MessageAnalyzer'
import { StyleProfileRepository } from './analysis/StyleProfileRepository'
import { StyleAnalysisSettingsRepository } from './analysis/StyleAnalysisSettingsRepository'
import { StyleProfileService } from './analysis/StyleProfileService'
import { ContextBuilder } from './context/ContextBuilder'
import { ConversationContextService } from './context/ConversationContextService'
import { AIService } from './ai/AIService'
import { OpenRouterProvider } from './ai/OpenRouterProvider'
import { PromptBuilder } from './ai/PromptBuilder'
import { ReplyRepository } from './replies/ReplyRepository'
import { ReplyService } from './replies/ReplyService'
import { VKSender } from './vk/VKSender'

const browserManager = new BrowserManager()
const browserController = new BrowserController(browserManager)
const configService = new ConfigService()
const messageBus = new MessageBus()

let listenerStarted = false

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 980,
    height: 820,
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

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

async function launchChatSession(url: string): Promise<void> {
  await browserController.open(url)

  if (!listenerStarted) {
    const listener = new VKLongPollListener(
      browserManager.getPage(),
      new VKMessageParser(),
      messageBus
    )
    listener.start()
    listenerStarted = true
    console.log('👂 VK listener started')
  }

  console.log('🌐 Chat opened:', url)
}

app.whenReady().then(async () => {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  configService.load()

  ipcMain.handle('system:ping', async () => {
    console.log('📡 Ping received from Renderer')
    return 'pong'
  })

  registerBrowserIPC(browserController, launchChatSession)
  registerConfigIPC(configService, launchChatSession)

  const styleProfileRepository = new StyleProfileRepository()
  const styleAnalysisSettingsRepository = new StyleAnalysisSettingsRepository()

  const styleProfileService = new StyleProfileService(
    styleProfileRepository,
    new MessageAnalyzer(),
    styleAnalysisSettingsRepository
  )

  const conversationContextService = new ConversationContextService(
    new ContextBuilder(),
    styleProfileRepository,
    styleAnalysisSettingsRepository
  )

  const aiService = new AIService(new PromptBuilder(), new OpenRouterProvider())
  const replyService = new ReplyService(new ReplyRepository())
  const vkSender = new VKSender(browserManager)

  if (is.dev) {
    ipcMain.handle('replies:pending', async (_, conversationId?: string) => {
      return replyService.getPendingReplies(conversationId)
    })

    ipcMain.handle('replies:approve', async (_, id: string) => {
      return replyService.approveReply(id)
    })

    ipcMain.handle('replies:reject', async (_, id: string) => {
      return replyService.rejectReply(id)
    })

    ipcMain.handle('replies:send', async (_, id: string) => {
      return replyService.sendApprovedReply(id, vkSender)
    })

    ipcMain.handle('replies:approve-and-send', async (_, id: string) => {
      return replyService.approveAndSendReply(id, vkSender)
    })
  }

  const messageQueue = new MessageQueue()
  const messageWorker = new MessageWorker(
    new MessageProcessor(
      styleProfileService,
      conversationContextService,
      aiService,
      replyService,
      vkSender
    )
  )

  const messageService = new MessageService(
    new MessageRepository(),
    new ConversationService(new ConversationRepository()),
    messageQueue
  )

  messageBus.on('message', async (message) => {
    try {
      await messageService.onMessage(message)
    } catch (error) {
      console.error('❌ Failed to handle VK message:', error)
    }
  })

  app.on('before-quit', async () => {
    await messageWorker.close()
    await messageQueue.close()
  })

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
