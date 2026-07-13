import {
  AnalyzableMessage,
  PunctuationStyle,
  StyleProfileData
} from './StyleProfile'

const STOP_WORDS = new Set(['и', 'в', 'на', 'я', 'ты'])
const EMOJI_REGEX = /\p{Extended_Pictographic}/u
const WORD_REGEX = /[^\p{L}\p{N}]/gu

export class MessageAnalyzer {
  analyze(messages: AnalyzableMessage[]): StyleProfileData {
    const texts = messages.map((message) => message.text)

    return {
      averageMessageLength: this.averageLength(texts),
      totalMessages: messages.length,
      commonWords: this.topWords(texts, 20),
      emojiUsage: texts.some((text) => EMOJI_REGEX.test(text)),
      punctuation: this.detectPunctuation(texts)
    }
  }

  private averageLength(texts: string[]): number {
    if (texts.length === 0) {
      return 0
    }

    const total = texts.reduce((sum, text) => sum + text.length, 0)
    return Math.round(total / texts.length)
  }

  private topWords(texts: string[], limit: number): string[] {
    const frequency = new Map<string, number>()

    for (const text of texts) {
      for (const word of text.toLowerCase().split(/\s+/)) {
        const cleaned = word.replace(WORD_REGEX, '')

        if (cleaned.length <= 2 || STOP_WORDS.has(cleaned)) {
          continue
        }

        frequency.set(cleaned, (frequency.get(cleaned) ?? 0) + 1)
      }
    }

    return [...frequency.entries()]
      .sort((left, right) => right[1] - left[1])
      .slice(0, limit)
      .map(([word]) => word)
  }

  private detectPunctuation(texts: string[]): PunctuationStyle {
    const joined = texts.join(' ')

    return {
      dots: joined.includes('.'),
      ellipsis: joined.includes('...'),
      exclamation: joined.includes('!'),
      question: joined.includes('?')
    }
  }
}
