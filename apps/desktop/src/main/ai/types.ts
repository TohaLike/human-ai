export class AIProviderError extends Error {
  constructor(
    message: string,
    readonly code: 'MISSING_API_KEY' | 'NETWORK' | 'API' | 'EMPTY_RESPONSE'
  ) {
    super(message)
    this.name = 'AIProviderError'
  }
}
