import { PrismaClient } from '../../generated/prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { app } from 'electron'
import { join } from 'path'

function getDbPath(): string {
  if (app.isPackaged) {
    return join(app.getPath('userData'), 'human-ai.db')
  }

  return join(process.cwd(), 'prisma', 'human-ai.db')
}

const adapter = new PrismaBetterSqlite3({
  url: getDbPath()
})

export const prisma = new PrismaClient({
  adapter
})
