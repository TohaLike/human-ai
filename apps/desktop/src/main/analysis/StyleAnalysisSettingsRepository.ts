import { StyleAnalysisSettingsData } from './StyleAnalysisSettings'
import { prisma } from '../database/prisma'

const SETTINGS_ID = 'default'

export class StyleAnalysisSettingsRepository {
  async get(): Promise<StyleAnalysisSettingsData> {
    const settings = await prisma.styleAnalysisSettings.upsert({
      where: { id: SETTINGS_ID },
      update: {},
      create: { id: SETTINGS_ID }
    })

    return {
      useGlobalMessages: settings.useGlobalMessages
    }
  }

  async setUseGlobalMessages(useGlobalMessages: boolean): Promise<StyleAnalysisSettingsData> {
    const settings = await prisma.styleAnalysisSettings.upsert({
      where: { id: SETTINGS_ID },
      update: { useGlobalMessages },
      create: { id: SETTINGS_ID, useGlobalMessages }
    })

    return {
      useGlobalMessages: settings.useGlobalMessages
    }
  }
}
