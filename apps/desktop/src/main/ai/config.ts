export function isSelfChatTestMode(): boolean {
  return process.env.AI_TRIGGER_ON_OWN_MESSAGES === 'true'
}
