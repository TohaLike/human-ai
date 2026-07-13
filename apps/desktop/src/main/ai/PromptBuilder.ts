import { StyleProfileData } from '../analysis/StyleProfile'
import { ContextMessage, ConversationContext } from '../context/types'
import { isSelfChatTestMode } from './config'

export class PromptBuilder {
  build(context: ConversationContext): string {
    const interlocutorName = context.interlocutor.title ?? 'Собеседник'
    const selfChatTest = isSelfChatTestMode()
    const styleSection = this.buildStyleSection(context.styleProfile)
    const { text: newMessage, author: newMessageAuthor, excludeFromHistory } =
      this.getTriggerMessage(context.messages, interlocutorName, selfChatTest)
    const historyMessages = excludeFromHistory
      ? context.messages.slice(0, -1)
      : context.messages
    const historySection = this.buildHistorySection(historyMessages, interlocutorName)

    return [
      'Ты имитируешь ответ пользователя в переписке.',
      'Ответь на новое сообщение собеседника коротко и по существу, в стиле пользователя.',
      'Не начинай с приветствия, если собеседник не здоровается.',
      'Напиши только текст ответа, без пояснений.',
      '',
      styleSection,
      '',
      'История диалога:',
      '',
      historySection || 'Нет предыдущих сообщений.',
      '',
      'Новое сообщение:',
      '',
      `${newMessageAuthor}:\n${newMessage}`
    ].join('\n')
  }

  private buildStyleSection(profile: StyleProfileData | null): string {
    if (!profile) {
      return 'Стиль пользователя: данных пока нет, отвечай коротко и естественно.'
    }

    const words = profile.commonWords.slice(0, 10).join(', ') || 'нет данных'
    const emoji = profile.emojiUsage ? 'да' : 'нет'

    return [
      'Стиль пользователя:',
      `- средняя длина сообщений: ~${profile.averageMessageLength} символов`,
      `- использует emoji: ${emoji}`,
      `- характерные слова (используй естественно, не в каждом ответе): ${words}`
    ].join('\n')
  }

  private buildHistorySection(messages: ContextMessage[], interlocutorName: string): string {
    if (messages.length === 0) {
      return ''
    }

    return messages
      .map((message) => {
        const author = message.isMine ? 'Пользователь' : interlocutorName
        return `${author}:\n${message.text}`
      })
      .join('\n\n')
  }

  private getTriggerMessage(
    messages: ContextMessage[],
    interlocutorName: string,
    selfChatTest: boolean
  ): { text: string; author: string; excludeFromHistory: boolean } {
    const latest = messages.at(-1)

    if (selfChatTest && latest?.isMine) {
      return {
        text: latest.text,
        author: `${interlocutorName} (тест — считай это входящим сообщением)`,
        excludeFromHistory: true
      }
    }

    const incoming = [...messages].reverse().find((message) => !message.isMine)

    return {
      text: incoming?.text ?? latest?.text ?? '',
      author: interlocutorName,
      excludeFromHistory: false
    }
  }
}
