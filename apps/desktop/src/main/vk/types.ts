export type VKUpdate = [
  type: number,
  localId: number,
  flags: number,
  messageId: number,
  peerId: number,
  timestamp: number,
  text: string,
  extra?: unknown,
  meta?: unknown,
  randomId?: number,
  conversationMessageId?: number,
  unknown?: number
]
