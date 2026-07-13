export interface PunctuationStyle {
  dots: boolean
  ellipsis: boolean
  exclamation: boolean
  question: boolean
}

export interface StyleProfileData {
  averageMessageLength: number
  totalMessages: number
  commonWords: string[]
  emojiUsage: boolean
  punctuation: PunctuationStyle
}

export interface AnalyzableMessage {
  text: string
}
