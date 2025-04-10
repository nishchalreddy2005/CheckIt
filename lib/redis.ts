import { Redis } from "@upstash/redis"

// Create a Redis client using the environment variables
// This will automatically use UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
export const redis = Redis.fromEnv()

// Helper function to generate unique IDs
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2)
}
