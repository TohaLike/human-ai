import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { app } from 'electron'
import { AppConfig, AppConfigUpdate } from './types'

const DEFAULT_CONFIG: AppConfig = {
  vkChatUrl: '',
  openRouterApiKey: '',
  openRouterModel: 'openai/gpt-4o-mini',
  aiTriggerOnOwnMessages: false,
  aiAutoSend: true,
  aiReplyDelayMs: 400,
  aiReplyDebounceMs: 800,
  aiTemperature: 0.75,
  aiMaxTokens: 120
}

export class ConfigService {
  private config: AppConfig = { ...DEFAULT_CONFIG }
  private readonly filePath: string

  constructor(filePath?: string) {
    this.filePath = filePath ?? join(app.getPath('userData'), 'app-settings.json')
  }

  load(): AppConfig {
    const fromEnv = this.fromEnv()
    const fromFile = this.readFile()
    this.config = {
      ...DEFAULT_CONFIG,
      ...fromEnv,
      ...fromFile
    }
    this.applyToEnv(this.config)
    return this.get()
  }

  get(): AppConfig {
    return { ...this.config }
  }

  save(update: AppConfigUpdate): AppConfig {
    this.config = {
      ...this.config,
      ...this.normalize(update)
    }
    this.writeFile(this.config)
    this.applyToEnv(this.config)
    console.log('⚙️ Config saved')
    return this.get()
  }

  applyToEnv(config: AppConfig = this.config): void {
    process.env.VK_CHAT_URL = config.vkChatUrl
    process.env.OPENROUTER_API_KEY = config.openRouterApiKey
    process.env.OPENROUTER_MODEL = config.openRouterModel
    process.env.AI_TRIGGER_ON_OWN_MESSAGES = config.aiTriggerOnOwnMessages ? 'true' : 'false'
    process.env.AI_AUTO_SEND = config.aiAutoSend ? 'true' : 'false'
    process.env.AI_REPLY_DELAY_MS = String(config.aiReplyDelayMs)
    process.env.AI_REPLY_DEBOUNCE_MS = String(config.aiReplyDebounceMs)
    process.env.AI_TEMPERATURE = String(config.aiTemperature)
    process.env.AI_MAX_TOKENS = String(config.aiMaxTokens)
  }

  private fromEnv(): Partial<AppConfig> {
    return this.normalize({
      vkChatUrl: process.env.VK_CHAT_URL,
      openRouterApiKey: process.env.OPENROUTER_API_KEY,
      openRouterModel: process.env.OPENROUTER_MODEL,
      aiTriggerOnOwnMessages: process.env.AI_TRIGGER_ON_OWN_MESSAGES === 'true',
      aiAutoSend: process.env.AI_AUTO_SEND !== 'false',
      aiReplyDelayMs: Number(process.env.AI_REPLY_DELAY_MS),
      aiReplyDebounceMs: Number(process.env.AI_REPLY_DEBOUNCE_MS),
      aiTemperature: Number(process.env.AI_TEMPERATURE),
      aiMaxTokens: Number(process.env.AI_MAX_TOKENS)
    })
  }

  private normalize(input: AppConfigUpdate): Partial<AppConfig> {
    const next: Partial<AppConfig> = {}

    if (typeof input.vkChatUrl === 'string') {
      next.vkChatUrl = input.vkChatUrl.trim()
    }

    if (typeof input.openRouterApiKey === 'string') {
      next.openRouterApiKey = input.openRouterApiKey.trim()
    }

    if (typeof input.openRouterModel === 'string' && input.openRouterModel.trim()) {
      next.openRouterModel = input.openRouterModel.trim()
    }

    if (typeof input.aiTriggerOnOwnMessages === 'boolean') {
      next.aiTriggerOnOwnMessages = input.aiTriggerOnOwnMessages
    }

    if (typeof input.aiAutoSend === 'boolean') {
      next.aiAutoSend = input.aiAutoSend
    }

    if (typeof input.aiReplyDelayMs === 'number' && Number.isFinite(input.aiReplyDelayMs)) {
      next.aiReplyDelayMs = Math.max(0, Math.round(input.aiReplyDelayMs))
    }

    if (typeof input.aiReplyDebounceMs === 'number' && Number.isFinite(input.aiReplyDebounceMs)) {
      next.aiReplyDebounceMs = Math.max(0, Math.round(input.aiReplyDebounceMs))
    }

    if (typeof input.aiTemperature === 'number' && Number.isFinite(input.aiTemperature)) {
      next.aiTemperature = Math.min(1, Math.max(0, input.aiTemperature))
    }

    if (typeof input.aiMaxTokens === 'number' && Number.isFinite(input.aiMaxTokens)) {
      next.aiMaxTokens = Math.max(1, Math.round(input.aiMaxTokens))
    }

    return next
  }

  private readFile(): Partial<AppConfig> {
    if (!existsSync(this.filePath)) {
      return {}
    }

    try {
      const raw = readFileSync(this.filePath, 'utf8')
      return this.normalize(JSON.parse(raw) as AppConfigUpdate)
    } catch (error) {
      console.warn('⚠️ Failed to read settings file:', error)
      return {}
    }
  }

  private writeFile(config: AppConfig): void {
    mkdirSync(dirname(this.filePath), { recursive: true })
    writeFileSync(this.filePath, JSON.stringify(config, null, 2), 'utf8')
  }
}
