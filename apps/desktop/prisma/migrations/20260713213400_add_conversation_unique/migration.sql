-- CreateIndex
CREATE UNIQUE INDEX "Conversation_platform_externalId_key" ON "Conversation"("platform", "externalId");
