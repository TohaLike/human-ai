import { AIProvider, AIPrompt } from './AIProvider'
import { getMaxTokens, getTemperature } from './config'
import { AIProviderError } from './types'

interface OpenRouterResponse {
  choices?: Array<{
    message?: {
      content?: string
    }
  }>
}

export class OpenRouterProvider implements AIProvider {
  async generate(prompt: AIPrompt): Promise<string> {
    const apiKey = process.env.OPENROUTER_API_KEY
    const model = process.env.OPENROUTER_MODEL ?? 'openai/gpt-4o-mini'

    if (!apiKey) {
      throw new AIProviderError('OPENROUTER_API_KEY is not set', 'MISSING_API_KEY')
    }

    let response: Response

    try {
      response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://human-ai.local',
          'X-Title': 'Human AI Desktop'
        },
        body: JSON.stringify({
          model,
          temperature: getTemperature(),
          max_tokens: getMaxTokens(),
          messages: [
            { role: 'system', content: prompt.system },
            { role: 'user', content: prompt.user }
          ]
        })
      })
    } catch (error) {
      throw new AIProviderError(
        `Network error: ${error instanceof Error ? error.message : String(error)}`,
        'NETWORK'
      )
    }

    if (!response.ok) {
      const body = await response.text()
      throw new AIProviderError(
        `OpenRouter API error ${response.status}: ${body}`,
        'API'
      )
    }

    const data = (await response.json()) as OpenRouterResponse
    const text = data.choices?.[0]?.message?.content?.trim()

    if (!text) {
      throw new AIProviderError('Empty response from model', 'EMPTY_RESPONSE')
    }

    return text
  }
}
