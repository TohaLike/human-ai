-- CreateTable
CREATE TABLE "GeneratedReply" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "conversationId" TEXT NOT NULL,
    "sourceMessageId" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GeneratedReply_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "GeneratedReply_sourceMessageId_fkey" FOREIGN KEY ("sourceMessageId") REFERENCES "Message" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "GeneratedReply_conversationId_status_idx" ON "GeneratedReply"("conversationId", "status");

-- CreateIndex
CREATE INDEX "GeneratedReply_sourceMessageId_idx" ON "GeneratedReply"("sourceMessageId");
