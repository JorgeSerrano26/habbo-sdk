/**
 * Low-level HTTP client shared by every Habbo SDK client.
 *
 * Zero dependencies: relies on the global `fetch` (Node >= 18, browsers,
 * Deno, Bun) unless a custom implementation is injected. Provides per-attempt
 * timeouts, cooperative cancellation via `AbortSignal`, and automatic retries
 * with exponential backoff for transient failures.
 */

import { HabboHotel, HabboResource, HttpMethod } from './enums.js';
import {
  createHabboApiError,
  HabboApiError,
  HabboTimeoutError,
} from './errors.js';
import type { FetchLike, HabboClientConfig, RetryConfig } from './types.js';

/** A query string value. `undefined`/`null` values are dropped. */
export type QueryValue = string | number | boolean | undefined | null;

export interface HttpRequest {
  method?: HttpMethod;
  /** Path relative to the base URL (e.g. `/api/public/ping`). */
  path: string;
  /** Query parameters; nullish values are omitted. */
  query?: Record<string, QueryValue>;
  /** JSON request body (serialized automatically). */
  body?: unknown;
  /** Per-request headers. */
  headers?: Record<string, string>;
  /** Abort signal for the request. */
  signal?: AbortSignal;
  /** When `true`, the raw `Response` is returned instead of parsed JSON. */
  raw?: boolean;
  /** Logical resource targeted, used to raise resource-specific errors. */
  resource?: HabboResource;
  /** Identifier (id/name) looked up, included in resource-specific errors. */
  resourceId?: string;
}

const DEFAULT_TIMEOUT_MS = 30_000;

const DEFAULT_RETRY: Required<RetryConfig> = {
  retries: 2,
  baseDelayMs: 500,
  maxDelayMs: 10_000,
  retryableStatuses: [429, 500, 502, 503, 504],
  retryOnTimeout: true,
  jitter: true,
};

/**
 * Builds the base URL for a hotel.
 *
 * @example buildBaseUrl(HabboHotel.ES) -> "https://www.habbo.es"
 */
export function buildBaseUrl(hotel: HabboHotel | string): string {
  return `https://www.habbo.${hotel}`;
}

export class HttpClient {
  public readonly baseUrl: string;
  public readonly apiKey?: string;

  private readonly fetchImpl: FetchLike;
  private readonly defaultHeaders: Record<string, string>;
  private readonly timeoutMs: number;
  private readonly retry: Required<RetryConfig>;

  constructor(config: HabboClientConfig = {}) {
    const hotel = config.hotel ?? HabboHotel.COM;
    this.baseUrl = (config.baseUrl ?? buildBaseUrl(hotel)).replace(/\/+$/, '');
    this.apiKey = config.apiKey;
    this.timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.retry = { ...DEFAULT_RETRY, ...config.retry };

    const resolvedFetch = config.fetch ?? globalThis.fetch;
    if (typeof resolvedFetch !== 'function') {
      throw new Error(
        'No fetch implementation found. Provide `fetch` in the config or run on a platform that supports the global fetch API (Node >= 18).',
      );
    }
    // Bind to preserve the correct `this` for the global fetch.
    this.fetchImpl = (input, init) => resolvedFetch(input, init);

    this.defaultHeaders = {
      Accept: 'application/json',
      ...config.headers,
    };
  }

  /** Builds an absolute URL from a path and query parameters. */
  public buildUrl(path: string, query?: Record<string, QueryValue>): string {
    const url = new URL(
      path.startsWith('/') ? path : `/${path}`,
      `${this.baseUrl}/`,
    );
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      }
    }
    return url.toString();
  }

  /** Performs a request and parses a JSON response of type `T`. */
  public async request<T>(req: HttpRequest): Promise<T> {
    const response = await this.send(req);

    // Conditional request matched (`If-None-Match`): nothing to parse.
    if (response.status === 304) {
      return undefined as T;
    }

    const text = await response.text();
    if (!text) {
      return undefined as T;
    }
    try {
      return JSON.parse(text) as T;
    } catch {
      return text as unknown as T;
    }
  }

  /**
   * Performs a request and returns the raw `Response`, retrying transient
   * failures with exponential backoff. Honors the caller's `AbortSignal`
   * during both the request and the backoff wait.
   */
  public async send(req: HttpRequest): Promise<Response> {
    const url = this.buildUrl(req.path, req.query);
    let attempt = 0;

    for (;;) {
      // Bail out immediately if the caller already cancelled.
      this.throwIfAborted(req.signal);

      try {
        const response = await this.attempt(url, req);

        if (
          !response.ok &&
          response.status !== 304 &&
          this.shouldRetryStatus(response.status) &&
          attempt < this.retry.retries
        ) {
          const wait = this.backoff(attempt, response);
          attempt++;
          await this.delay(wait, req.signal);
          continue;
        }

        if (!response.ok && response.status !== 304) {
          const body = await this.safeReadBody(response);
          throw createHabboApiError(
            response.status,
            response.statusText,
            url,
            body,
            {
              resource: req.resource,
              identifier: req.resourceId,
              retryAfterSeconds: this.parseRetryAfter(response),
            },
          );
        }

        return response;
      } catch (err) {
        const retryable =
          (err instanceof HabboTimeoutError && this.retry.retryOnTimeout) ||
          this.isTransientNetworkError(err, req.signal);

        if (retryable && attempt < this.retry.retries) {
          const wait = this.backoff(attempt);
          attempt++;
          await this.delay(wait, req.signal);
          continue;
        }
        throw err;
      }
    }
  }

  /** Executes a single HTTP attempt with a per-attempt timeout. */
  private async attempt(url: string, req: HttpRequest): Promise<Response> {
    const method = req.method ?? HttpMethod.GET;

    const headers: Record<string, string> = {
      ...this.defaultHeaders,
      ...req.headers,
    };

    let bodyInit: string | undefined;
    if (req.body !== undefined && method !== HttpMethod.GET) {
      bodyInit = JSON.stringify(req.body);
      headers['Content-Type'] = headers['Content-Type'] ?? 'application/json';
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    // Chain a caller-supplied signal onto our internal controller so either
    // a timeout or an external abort cancels the in-flight request.
    const onAbort = () => controller.abort();
    if (req.signal) {
      /* v8 ignore next -- race: signal can't be aborted between throwIfAborted() and here in single-threaded JS */
      if (req.signal.aborted) controller.abort();
      else req.signal.addEventListener('abort', onAbort, { once: true });
    }

    try {
      return await this.fetchImpl(url, {
        method,
        headers,
        body: bodyInit,
        signal: controller.signal,
      });
    } catch (err) {
      // Distinguish our own timeout from a caller-initiated abort.
      if (controller.signal.aborted && !req.signal?.aborted) {
        throw new HabboTimeoutError(url, this.timeoutMs);
      }
      throw err;
    /* v8 ignore next 3 -- V8 instruments an unreachable "exception in finally" branch here */
    } finally {
      clearTimeout(timeout);
      req.signal?.removeEventListener('abort', onAbort);
    }
  }

  /** Parses a numeric `Retry-After` header (seconds), if present and valid. */
  private parseRetryAfter(response: Response): number | undefined {
    const value = response.headers.get('retry-after');
    if (!value) return undefined;
    const seconds = Number(value);
    return Number.isFinite(seconds) && seconds >= 0 ? seconds : undefined;
  }

  /** `true` when an HTTP status code is configured as retryable. */
  private shouldRetryStatus(status: number): boolean {
    return this.retry.retryableStatuses.includes(status);
  }

  /**
   * `true` for network-level errors worth retrying. A caller-initiated abort
   * is never retried.
   */
  private isTransientNetworkError(err: unknown, signal?: AbortSignal): boolean {
    if (signal?.aborted) return false;
    if (err instanceof HabboApiError) return false;
    if (err instanceof HabboTimeoutError) return false;
    // `fetch` rejects with a TypeError on DNS/connection failures.
    return err instanceof TypeError || err instanceof Error;
  }

  /**
   * Computes the backoff delay for the given (zero-based) attempt index.
   * Honors a numeric `Retry-After` header when present.
   */
  private backoff(attempt: number, response?: Response): number {
    const retryAfter = response?.headers.get('retry-after');
    if (retryAfter) {
      const seconds = Number(retryAfter);
      if (Number.isFinite(seconds) && seconds >= 0) {
        return Math.min(seconds * 1000, this.retry.maxDelayMs);
      }
    }
    const exp = this.retry.baseDelayMs * 2 ** attempt;
    const capped = Math.min(exp, this.retry.maxDelayMs);
    return this.retry.jitter ? capped * (0.5 + Math.random() * 0.5) : capped;
  }

  /** Resolves after `ms`, or rejects early if `signal` aborts. */
  private delay(ms: number, signal?: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
      if (signal?.aborted) {
        reject(this.abortError(signal));
        return;
      }
      const timer = setTimeout(() => {
        signal?.removeEventListener('abort', onAbort);
        resolve();
      }, ms);
      const onAbort = () => {
        clearTimeout(timer);
        reject(this.abortError(signal));
      };
      signal?.addEventListener('abort', onAbort, { once: true });
    });
  }

  private throwIfAborted(signal?: AbortSignal): void {
    if (signal?.aborted) throw this.abortError(signal);
  }

  private abortError(signal?: AbortSignal): Error {
    const reason = (signal as { reason?: unknown } | undefined)?.reason;
    if (reason instanceof Error) return reason;
    return new DOMException('The operation was aborted.', 'AbortError');
  }

  private async safeReadBody(response: Response): Promise<unknown> {
    try {
      const text = await response.text();
      try {
        return JSON.parse(text);
      } catch {
        return text;
      }
    } catch {
      return undefined;
    }
  }
}
