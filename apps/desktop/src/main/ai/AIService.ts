import { ConversationContext } from '../context/types'
import { AIProvider } from './AIProvider'
import { PromptBuilder } from './PromptBuilder'
import { AIProviderError } from './types'

export class AIService {
  constructor(
    private readonly promptBuilder: PromptBuilder,
    private readonly provider: AIProvider
  ) {}

  async generateReply(context: ConversationContext): Promise<string> {
    const prompt = this.promptBuilder.build(context)

    try {
      const reply = await this.provider.generate(prompt)
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
