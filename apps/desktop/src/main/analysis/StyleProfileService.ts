import { prisma } from '../database/prisma'
import { MessageAnalyzer } from './MessageAnalyzer'
import { StyleAnalysisSettingsRepository } from './StyleAnalysisSettingsRepository'
import { StyleProfileData } from './StyleProfile'
import { StyleProfileRepository } from './StyleProfileRepository'

const USER_MESSAGES_LIMIT = 500

export class StyleProfileService {
  constructor(
    private readonly repository: StyleProfileRepository,
    private readonly analyzer: MessageAnalyzer,
    private readonly settingsRepository: StyleAnalysisSettingsRepository
  ) {}

  async analyzeUserStyle(conversationId: string): Promise<StyleProfileData> {
    const settings = await this.settingsRepository.get()
    const useGlobalMessages = settings.useGlobalMessages

    const messages = await prisma.message.findMany({
      where: {
        isMine: true,
        ...(useGlobalMessages ? {} : { conversationId })
      },
      orderBy: { date: 'desc' },
      take: USER_MESSAGES_LIMIT,
      select: { text: true }
    })

    const profile = this.analyzer.analyze(messages)
    const profileScope = useGlobalMessages ? null : conversationId

    await this.repository.save(profile, profileScope)

    console.log('📊 Style profile updated:', {
      scope: useGlobalMessages ? 'global' : conversationId,
      profile
    })

    return profile
  }

  async setUseGlobalMessages(useGlobalMessages: boolean) {
    return this.settingsRepository.setUseGlobalMessages(useGlobalMessages)
  }

  async getSettings() {
    return this.settingsRepository.get()
  }
}
