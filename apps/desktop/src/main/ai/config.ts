export function isSelfChatTestMode(): boolean {
  return process.env.AI_TRIGGER_ON_OWN_MESSAGES === 'true'
}

export function isAutoSendEnabled(): boolean {
  return process.env.AI_AUTO_SEND === 'true'
}

export function getReplyDelayMs(): number {
  const value = Number(process.env.AI_REPLY_DELAY_MS ?? 400)
  return Number.isFinite(value) && value >= 0 ? value : 400
}

export function getReplyDebounceMs(): number {
  const value = Number(process.env.AI_REPLY_DEBOUNCE_MS ?? 800)
  return Number.isFinite(value) && value >= 0 ? value : 800
}

export function getTemperature(): number {
  const value = Number(process.env.AI_TEMPERATURE ?? 0.75)
  return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0.75
}

export function getMaxTokens(): number {
  const value = Number(process.env.AI_MAX_TOKENS ?? 120)
  return Number.isFinite(value) && value > 0 ? value : 120
}
