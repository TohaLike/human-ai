import { ConversationRepository } from './ConversationRepository'

export class ConversationService {
  constructor(private readonly repository: ConversationRepository) {}

  async findOrCreate(platform: string, externalId: string) {
    const existing = await this.repository.findByExternalId(platform, externalId)
    if (existing) {
      return existing
    }

    return this.repository.create({ platform, externalId })
  }
}
