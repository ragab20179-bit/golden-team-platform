/**
 * server/_core/redis.ts
 *
 * Safe Redis client wrapper using ioredis.
 *
 * Key design decisions:
 *   1. Single shared client — avoids connection pool exhaustion.
 *   2. `safeRedis` — wraps every Redis call in a try/catch so a Redis
 *      outage never crashes the main request path. Returns `fallback`
 *      on error, logs at WARN level.
 *   3. Lazy connection — the client is created on first import but
 *      doesn't block startup if Redis is unreachable.
 *
 * Usage:
 *   import { safeRedis } from "./_core/redis";
 *   const value = await safeRedis(r => r.get("my:key"), null, "cache");
 */

import Redis from "ioredis";
import { logger } from "./logger";

let _client: Redis | null = null;

function getClient(): Redis | null {
  if (!process.env.REDIS_URL) return null;
  if (_client) return _client;

  _client = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: 2,
    connectTimeout: 3000,
    lazyConnect: true,
    enableOfflineQueue: false,
  });

  _client.on("error", (err: Error) => {
    logger.warn({ err: err.message }, "[redis] connection error");
  });

  return _client;
}

/**
 * Execute a Redis operation safely.
 *
 * @param op       - Async function that receives the Redis client and returns a value
 * @param fallback - Value to return if Redis is unavailable or the operation fails
 * @param context  - Short label for log messages (e.g. "cache", "session")
 */
export async function safeRedis<T>(
  op: (r: Redis) => Promise<T>,
  fallback: T,
  context = "redis"
): Promise<T> {
  const client = getClient();
  if (!client) return fallback;

  try {
    return await op(client);
  } catch (err) {
    logger.warn(
      { err: (err as Error).message, context },
      "[redis] operation failed — using fallback"
    );
    return fallback;
  }
}

/**
 * Health check — returns true if Redis responds to PING within timeout.
 */
export async function redisHealth(): Promise<{ ok: boolean; latencyMs?: number }> {
  const client = getClient();
  if (!client) return { ok: false };

  const start = Date.now();
  try {
    await client.ping();
    return { ok: true, latencyMs: Date.now() - start };
  } catch {
    return { ok: false };
  }
}
