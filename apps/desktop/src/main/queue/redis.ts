import Redis from 'ioredis'

export function getRedisOptions() {
  return {
    host: process.env.REDIS_HOST ?? '127.0.0.1',
    port: Number(process.env.REDIS_PORT ?? 6379),
    maxRetriesPerRequest: null
  }
}

export function createRedisConnection(): Redis {
  return new Redis(getRedisOptions())
}
