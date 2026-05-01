/**
 * server/_core/circuitBreaker.ts
 *
 * Circuit breaker factory using opossum.
 *
 * Provides a thin, typed wrapper around opossum so all breakers in the
 * codebase share the same configuration shape and the same state-reporting
 * interface (`JarvisBreaker`).
 *
 * Usage:
 *   import { createBreaker } from "./_core/circuitBreaker";
 *   const myBreaker = createBreaker<MyReturnType>("service.operation", {
 *     timeoutMs: 10_000,
 *     errorThresholdPercent: 50,
 *     resetTimeoutMs: 30_000,
 *   });
 *   const result = await myBreaker.fire(() => callExternalService());
 */

import CircuitBreaker from "opossum";
import { logger } from "./logger";

export type BreakerState = "closed" | "open" | "halfOpen";

export interface BreakerOptions {
  /** How long (ms) to wait for the action before treating it as a failure */
  timeoutMs?: number;
  /** % of failures that trips the breaker (0–100) */
  errorThresholdPercent?: number;
  /** How long (ms) to wait before trying again after the breaker opens */
  resetTimeoutMs?: number;
  /** Minimum number of requests before the breaker can trip */
  volumeThreshold?: number;
}

export interface JarvisBreaker<T> {
  /** Execute the action through the breaker */
  fire(action: () => Promise<T>): Promise<T>;
  /** Current breaker state */
  state(): BreakerState;
  /** Raw opossum instance — for advanced use only */
  raw: CircuitBreaker;
}

/**
 * Create a named circuit breaker.
 *
 * @param name    - Human-readable name for logging and health endpoints
 * @param options - Breaker configuration
 */
export function createBreaker<T>(
  name: string,
  options: BreakerOptions = {}
): JarvisBreaker<T> {
  const {
    timeoutMs = 10_000,
    errorThresholdPercent = 50,
    resetTimeoutMs = 30_000,
    volumeThreshold = 5,
  } = options;

  // opossum wraps an async function; we pass a no-op and call it with the
  // actual action at fire() time via the `call` pattern.
  const breaker = new CircuitBreaker(
    async (action: () => Promise<T>) => action(),
    {
      name,
      timeout: timeoutMs,
      errorThresholdPercentage: errorThresholdPercent,
      resetTimeout: resetTimeoutMs,
      volumeThreshold,
    }
  );

  breaker.on("open", () =>
    logger.warn({ breaker: name }, `[circuit-breaker] ${name} OPENED`)
  );
  breaker.on("halfOpen", () =>
    logger.info({ breaker: name }, `[circuit-breaker] ${name} half-open — probing`)
  );
  breaker.on("close", () =>
    logger.info({ breaker: name }, `[circuit-breaker] ${name} closed — healthy`)
  );
  breaker.on("fallback", (result: unknown) =>
    logger.debug({ breaker: name, result }, `[circuit-breaker] ${name} fallback triggered`)
  );

  function state(): BreakerState {
    if (breaker.opened) return "open";
    if (breaker.halfOpen) return "halfOpen";
    return "closed";
  }

  return {
    fire: (action: () => Promise<T>) => breaker.fire(action) as Promise<T>,
    state,
    raw: breaker,
  };
}

/**
 * Aggregate health snapshot of all breakers created in this process.
 * Used by /admin/health to surface all breaker states at once.
 */
export function breakerHealthSnapshot(): Record<string, BreakerState> {
  // opossum doesn't provide a global registry, so each module that creates
  // breakers should export their state via getOdooBreakerState() etc.
  // This function is a placeholder for future global registry if needed.
  return {};
}
