-- CreateTable
CREATE TABLE "StyleAnalysisSettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "useGlobalMessages" BOOLEAN NOT NULL DEFAULT false
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_StyleProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "conversationId" TEXT,
    "data" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StyleProfile_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_StyleProfile" ("createdAt", "data", "id", "updatedAt") SELECT "createdAt", "data", "id", "updatedAt" FROM "StyleProfile";
DROP TABLE "StyleProfile";
ALTER TABLE "new_StyleProfile" RENAME TO "StyleProfile";
CREATE UNIQUE INDEX "StyleProfile_conversationId_key" ON "StyleProfile"("conversationId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- Seed default settings
INSERT INTO "StyleAnalysisSettings" ("id", "useGlobalMessages") VALUES ('default', false);
