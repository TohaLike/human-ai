#!/usr/bin/env bash
set -euo pipefail

echo "📦 Installing desktop dependencies..."
cd /workspace/apps/desktop
npm install

echo "🧬 Prisma generate..."
npx prisma generate

echo "🎭 Playwright Chromium..."
npx playwright install chromium
npx playwright install-deps chromium || true

echo "✅ Dev container ready"
