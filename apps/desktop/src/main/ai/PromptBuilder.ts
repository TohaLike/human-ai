import { StyleProfileData } from '../analysis/StyleProfile'
import { ContextMessage, ConversationContext } from '../context/types'
import { getSystemPrompt, isSelfChatTestMode } from './config'
import { AIPrompt } from './AIProvider'
import { CapitalizationStyle, detectCapitalizationStyle } from './normalizeReply'

export class PromptBuilder {
  build(context: ConversationContext, sourceMessageId: number): AIPrompt {
    const interlocutorName = context.interlocutor.title ?? 'Собеседник'
    const selfChatTest = isSelfChatTestMode()
    const messages = context.messages.filter((message) => message.text.trim().length > 0)
    const capitalization = detectCapitalizationStyle(messages)
    const trigger = this.resolveTriggerMessage(
      messages,
      sourceMessageId,
      interlocutorName,
      selfChatTest
    )
    const historyMessages = messages.filter((message) => message.id !== trigger.id)
    const styleSection = this.buildStyleSection(context.styleProfile, capitalization)
    const historySection = this.buildHistorySection(historyMessages, interlocutorName)

    return {
      system: this.buildSystemPrompt(styleSection, capitalization),
      user: [
        'История диалога:',
        '',
        historySection || 'Нет предыдущих сообщений.',
        '',
        'Последнее сообщение собеседника:',
        '',
        `${trigger.author}:\n${trigger.text}`
      ].join('\n')
    }
  }

  private buildSystemPrompt(
    styleSection: string,
    capitalization: CapitalizationStyle
  ): string {
    const customPrompt = getSystemPrompt()

    // Custom persona from env replaces the default beta system rules entirely.
    if (customPrompt) {
      return [customPrompt, '', styleSection].join('\n')
    }

    return [
      'Ты пишешь ответ за пользователя в личной переписке VK.',
      'Пиши как в мессенджере: коротко, живо, без официоза и без странных вопросов.',
      'Отвечай только на последнее сообщение собеседника, не выдумывай новые темы.',
      'Если собеседник не здоровается — не начинай с приветствия.',
      'Если сообщение короткое или непонятное — ответь так же кратко и по делу.',
      'Никогда не ставь точку в конце ответа.',
      'Не пиши «книжные» предложения с точками внутри — лучше одна короткая фраза или вопрос.',
      'Знаки ? и ! можно оставлять, если они уместны.',
      capitalization === 'lower'
        ? 'Начинай сообщение со строчной буквы, как в обычном чате.'
        : 'Начинай сообщение с заглавной буквы, как обычно пишет пользователь.',
      'Не прыгай между стилями: регистр должен быть одинаковым во всём ответе.',
      'Верни только текст ответа, без кавычек и пояснений.',
      '',
      styleSection
    ].join('\n')
  }

  private buildStyleSection(
    profile: StyleProfileData | null,
    capitalization: CapitalizationStyle
  ): string {
    const casing =
      capitalization === 'lower'
        ? 'со строчной буквы'
        : 'с заглавной буквы'

    if (!profile || profile.totalMessages < 3) {
      return [
        'Стиль пользователя: мало данных, отвечай просто и по-человечески.',
        `- начинай ${casing}`,
        '- без точки в конце'
      ].join('\n')
    }

    const words = profile.commonWords.slice(0, 8).join(', ') || 'нет данных'
    const emoji = profile.emojiUsage ? 'иногда' : 'редко'

    return [
      'Стиль пользователя:',
      `- длина ответа: примерно ${Math.max(8, profile.averageMessageLength)} символов`,
      `- начинай ${casing}`,
      '- без точки в конце',
      `- emoji: ${emoji}`,
      `- характерные слова (используй уместно, не в каждом ответе): ${words}`
    ].join('\n')
  }

  private buildHistorySection(messages: ContextMessage[], interlocutorName: string): string {
    if (messages.length === 0) {
      return ''
    }

    const recent = messages.slice(-12)

    return recent
      .map((message) => {
        const author = message.isMine ? 'Пользователь' : interlocutorName
        return `${author}:\n${message.text}`
      })
      .join('\n\n')
  }

  private resolveTriggerMessage(
    messages: ContextMessage[],
    sourceMessageId: number,
    interlocutorName: string,
    selfChatTest: boolean
  ): { id: number; text: string; author: string } {
    const byId = messages.find((message) => message.id === sourceMessageId)
    const latest = messages.at(-1)

    if (selfChatTest && byId?.isMine) {
      return {
        id: byId.id,
        text: byId.text,
        author: `${interlocutorName} (тест)`
      }
    }

    if (byId && !byId.isMine) {
      return {
        id: byId.id,
        text: byId.text,
        author: interlocutorName
      }
    }

    const incoming = [...messages].reverse().find((message) => !message.isMine)

    return {
      id: incoming?.id ?? latest?.id ?? sourceMessageId,
      text: incoming?.text ?? latest?.text ?? '',
      author: interlocutorName
    }
  }
}
