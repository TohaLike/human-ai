import { ConversationContext } from '../context/types'
import { AIProvider } from './AIProvider'
import { getSystemPrompt } from './config'
import {
  detectCapitalizationStyle,
  normalizeReply,
  pickCapitalization
} from './normalizeReply'
import { PromptBuilder } from './PromptBuilder'
import { AIProviderError } from './types'

export class AIService {
  constructor(
    private readonly promptBuilder: PromptBuilder,
    private readonly provider: AIProvider
  ) {}

  async generateReply(
    context: ConversationContext,
    sourceMessageId: number
  ): Promise<string> {
    const prompt = this.promptBuilder.build(context, sourceMessageId)
    const customPrompt = Boolean(getSystemPrompt())
    const detected = detectCapitalizationStyle(context.messages)
    const capitalization = customPrompt ? pickCapitalization(detected) : detected

    try {
      const raw = await this.provider.generate(prompt)
      const reply = normalizeReply(raw, capitalization, {
        stripDashes: customPrompt
      })
      console.log('🤖 AI reply:', reply)
      return reply
    } catch (error) {
      if (error instanceof AIProviderError) {
        console.error(`❌ AI error [${error.code}]:`, error.message)
      } else {
        console.error('❌ AI unexpected error:', error)
      }

      throw error
    }
  }
}
