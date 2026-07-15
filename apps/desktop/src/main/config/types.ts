export interface AppConfig {
  vkChatUrl: string
  openRouterApiKey: string
  openRouterModel: string
  aiTriggerOnOwnMessages: boolean
  aiAutoSend: boolean
  aiReplyDelayMs: number
  aiReplyDebounceMs: number
  aiTemperature: number
  aiMaxTokens: number
}

export type AppConfigUpdate = Partial<AppConfig>
