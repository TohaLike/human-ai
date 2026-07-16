#!/usr/bin/env bash
set -euo pipefail

echo "🔎 Waiting for Redis..."
for _ in $(seq 1 30); do
  if redis-cli -h "${REDIS_HOST:-redis}" -p "${REDIS_PORT:-6379}" ping 2>/dev/null | grep -q PONG; then
    echo "✅ Redis is up (${REDIS_HOST:-redis}:${REDIS_PORT:-6379})"
    exit 0
  fi
  sleep 1
done

echo "⚠️ Redis is not responding yet — check docker compose service 'redis'"
exit 0
