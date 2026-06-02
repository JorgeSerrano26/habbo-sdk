/**
 * Configuration types for the SDK clients and the {@link HabboSDK} facade.
 */

import type { HabboHotel } from '../enums/index.js';

/** A minimal subset of the WHATWG `fetch` signature the SDK depends on. */
export type FetchLike = (
  input: string,
  init?: RequestInit,
) => Promise<Response>;

/**
 * Configuration shared by every client and the {@link HabboSDK} facade.
 */
export interface HabboClientConfig {
  /**
   * Hotel to target. Either a {@link HabboHotel} enum value or a raw domain
   * suffix (e.g. `"es"`, `"com.br"`). Ignored when {@link baseUrl} is set.
   */
  hotel?: HabboHotel | string;
  /**
   * Fully-qualified base URL override. When omitted it is built from
   * {@link hotel} as `https://www.habbo.<hotel>`.
   */
  baseUrl?: string;
  /** API key sent as the `api_key` query param on endpoints that require it. */
  apiKey?: string;
  /** Custom `fetch` implementation (defaults to the global `fetch`). */
  fetch?: FetchLike;
  /** Extra headers merged into every request. */
  headers?: Record<string, string>;
  /** Request timeout in milliseconds, applied per attempt. Defaults to `30000`. */
  timeoutMs?: number;
  /** Retry configuration for transient failures. */
  retry?: RetryConfig;
}

/**
 * Controls automatic retries with exponential backoff for transient failures
 * (network errors and retryable HTTP status codes).
 */
export interface RetryConfig {
  /**
   * Maximum number of *retries* after the initial attempt. `0` disables
   * retrying. Defaults to `2` (i.e. up to 3 attempts total).
   */
  retries?: number;
  /**
   * Base delay in milliseconds for the exponential backoff. The wait before
   * attempt `n` is `baseDelayMs * 2 ** (n - 1)` (plus optional jitter), capped
   * at {@link maxDelayMs}. Defaults to `500`.
   */
  baseDelayMs?: number;
  /** Upper bound for any single backoff wait, in ms. Defaults to `10000`. */
  maxDelayMs?: number;
  /**
   * HTTP status codes that should be retried.
   * Defaults to `[429, 500, 502, 503, 504]`.
   */
  retryableStatuses?: number[];
  /**
   * Whether per-attempt timeouts should be retried.
   * Defaults to `true`.
   */
  retryOnTimeout?: boolean;
  /**
   * Whether to add random jitter (0–100% of the computed delay) to spread out
   * retries. Defaults to `true`.
   */
  jitter?: boolean;
}
