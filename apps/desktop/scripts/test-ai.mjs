import 'dotenv/config'
import { join } from 'path'
import { PrismaClient } from '../src/generated/prisma/client.ts'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { ContextBuilder } from '../src/main/context/ContextBuilder.ts'
import { PromptBuilder } from '../src/main/ai/PromptBuilder.ts'
import { OpenRouterProvider } from '../src/main/ai/OpenRouterProvider.ts'
import { AIService } from '../src/main/ai/AIService.ts'

const dbPath = join(process.cwd(), 'prisma', 'human-ai.db')
const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: dbPath })
})

const conversation =
  (await prisma.conversation.findFirst({
    where: { externalId: '232940913' },
    orderBy: { updatedAt: 'desc' }
  })) ??
  (await prisma.conversation.findFirst({
    orderBy: { updatedAt: 'desc' }
  }))

if (!conversation) {
  console.log('NO_CONVERSATION')
  process.exit(1)
}

const messagesDesc = await prisma.message.findMany({
  where: { conversationId: conversation.id },
  orderBy: { date: 'desc' },
  take: 30,
  select: { id: true, text: true, isMine: true, date: true }
})

const styleRecord = await prisma.styleProfile.findFirst({
  where: { conversationId: conversation.id }
})

const messages = [...messagesDesc].reverse()
const sourceMessage =
  [...messages].reverse().find((message) => !message.isMine) ?? messages.at(-1)

if (!sourceMessage) {
  console.log('NO_SOURCE_MESSAGE')
  process.exit(1)
}

const context = new ContextBuilder().build({
  conversation: {
    id: conversation.id,
    platform: conversation.platform,
    externalId: conversation.externalId,
    title: conversation.title ?? undefined
  },
  messages,
  styleProfile: styleRecord ? styleRecord.data : null
})

console.log('conversation:', conversation.externalId)
console.log('messages:', context.messages.length)
console.log('sourceMessageId:', sourceMessage.id)
console.log('AI_TRIGGER_ON_OWN_MESSAGES:', process.env.AI_TRIGGER_ON_OWN_MESSAGES)

const reply = await new AIService(new PromptBuilder(), new OpenRouterProvider()).generateReply(
  context,
  sourceMessage.id
)

console.log('REPLY:', reply)

await prisma.$disconnect()
