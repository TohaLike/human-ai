export interface AIPrompt {
  system: string
  user: string
}

export interface AIProvider {
  generate(prompt: AIPrompt): Promise<string>
}
