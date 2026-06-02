import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HabboHotel, HabboResource, HttpMethod } from '../enums.js';
import {
  HabboApiError,
  HabboBadRequestError,
  HabboForbiddenError,
  HabboNotFoundError,
  HabboRateLimitError,
  HabboServerError,
  HabboTimeoutError,
  HabboUnauthorizedError,
  UserNotFoundError,
} from '../errors.js';
import { buildBaseUrl, HttpClient } from '../http.js';
import { makeResponse, mockFetchHanging, mockFetchSequence } from './helpers.js';

// ---------------------------------------------------------------------------
// buildBaseUrl
// ---------------------------------------------------------------------------
describe('buildBaseUrl', () => {
  it('builds URL from HabboHotel enum', () => {
    expect(buildBaseUrl(HabboHotel.ES)).toBe('https://www.habbo.es');
  });

  it('builds URL from raw string suffix', () => {
    expect(buildBaseUrl('com.br')).toBe('https://www.habbo.com.br');
  });
});

// ---------------------------------------------------------------------------
// HttpClient — constructor
// ---------------------------------------------------------------------------
describe('HttpClient — constructor', () => {
  it('builds base URL from hotel enum', () => {
    const client = new HttpClient({ hotel: HabboHotel.ES, fetch: vi.fn() });
    expect(client.baseUrl).toBe('https://www.habbo.es');
  });

  it('defaults to HabboHotel.COM when no hotel is provided', () => {
    const client = new HttpClient({ fetch: vi.fn() });
    expect(client.baseUrl).toBe('https://www.habbo.com');
  });

  it('uses explicit baseUrl and strips trailing slashes', () => {
    const client = new HttpClient({ baseUrl: 'https://custom.example.com///', fetch: vi.fn() });
    expect(client.baseUrl).toBe('https://custom.example.com');
  });

  it('stores the apiKey', () => {
    const client = new HttpClient({ fetch: vi.fn(), apiKey: 'my-key' });
    expect(client.apiKey).toBe('my-key');
  });

  it('accepts a custom fetch implementation', async () => {
    const mock = vi.fn().mockResolvedValue(makeResponse(200, { ok: true }));
    const client = new HttpClient({ fetch: mock });
    await client.request({ path: '/test' });
    expect(mock).toHaveBeenCalledOnce();
  });

  it('throws when no fetch implementation is available', () => {
    const original = globalThis.fetch;
    // @ts-expect-error — intentionally delete global fetch
    delete globalThis.fetch;
    try {
      expect(() => new HttpClient({})).toThrow(/No fetch implementation/);
    } finally {
      globalThis.fetch = original;
    }
  });

  it('merges custom headers into every request', async () => {
    const mock = vi.fn().mockResolvedValue(makeResponse(200, {}));
    const client = new HttpClient({ fetch: mock, headers: { 'X-Custom': 'value' } });
    await client.request({ path: '/test' });
    const [, init] = mock.mock.calls[0]!;
    expect((init?.headers as Record<string, string>)?.['X-Custom']).toBe('value');
  });

  it('merges custom retry config over defaults', () => {
    // Verify the retry config is applied by exhausting all retries on 500.
    const mock = mockFetchSequence(
      makeResponse(500),
      makeResponse(200, { ok: true }),
    );
    const client = new HttpClient({ fetch: mock, retry: { retries: 0 } });
    return expect(client.send({ path: '/test' })).rejects.toBeInstanceOf(HabboServerError);
  });
});

// ---------------------------------------------------------------------------
// HttpClient — buildUrl
// ---------------------------------------------------------------------------
describe('HttpClient — buildUrl', () => {
  const client = new HttpClient({ baseUrl: 'https://www.habbo.es', fetch: vi.fn() });

  it('handles a path that starts with /', () => {
    expect(client.buildUrl('/api/public/ping')).toBe('https://www.habbo.es/api/public/ping');
  });

  it('handles a path that does not start with /', () => {
    expect(client.buildUrl('api/public/ping')).toBe('https://www.habbo.es/api/public/ping');
  });

  it('appends defined query parameters', () => {
    const url = client.buildUrl('/users', { name: 'Alice', page: 2 });
    expect(url).toContain('name=Alice');
    expect(url).toContain('page=2');
  });

  it('omits undefined query values', () => {
    const url = client.buildUrl('/users', { name: 'Alice', page: undefined });
    expect(url).not.toContain('page');
  });

  it('omits null query values', () => {
    const url = client.buildUrl('/users', { name: 'Alice', filter: null });
    expect(url).not.toContain('filter');
  });

  it('stringifies boolean and number values', () => {
    const url = client.buildUrl('/rooms', { active: true, limit: 10 });
    expect(url).toContain('active=true');
    expect(url).toContain('limit=10');
  });

  it('works without a query argument', () => {
    expect(client.buildUrl('/ping')).toBe('https://www.habbo.es/ping');
  });
});

// ---------------------------------------------------------------------------
// HttpClient — request (response parsing)
// ---------------------------------------------------------------------------
describe('HttpClient — request', () => {
  it('parses a JSON body on 200', async () => {
    const client = new HttpClient({
      fetch: mockFetchSequence(makeResponse(200, { name: 'Alice' })),
    });
    const result = await client.request<{ name: string }>({ path: '/test' });
    expect(result).toEqual({ name: 'Alice' });
  });

  it('returns undefined for an empty body', async () => {
    const client = new HttpClient({ fetch: mockFetchSequence(makeResponse(200)) });
    const result = await client.request({ path: '/test' });
    expect(result).toBeUndefined();
  });

  it('returns raw text when the body is not valid JSON', async () => {
    const client = new HttpClient({
      fetch: mockFetchSequence(makeResponse(200, 'not json', {})),
    });
    const result = await client.request<string>({ path: '/test' });
    expect(result).toBe('not json');
  });

  it('returns undefined on 304 Not Modified', async () => {
    const client = new HttpClient({ fetch: mockFetchSequence(makeResponse(304)) });
    const result = await client.request({ path: '/test' });
    expect(result).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// HttpClient — send (success, correct fetch call)
// ---------------------------------------------------------------------------
describe('HttpClient — send', () => {
  it('returns the Response on a successful 200', async () => {
    const mock = mockFetchSequence(makeResponse(200, {}));
    const client = new HttpClient({ fetch: mock });
    const res = await client.send({ path: '/test' });
    expect(res.status).toBe(200);
  });

  it('sets the Accept header on every request', async () => {
    const mock = vi.fn().mockResolvedValue(makeResponse(200, {}));
    const client = new HttpClient({ fetch: mock });
    await client.send({ path: '/test' });
    const [, init] = mock.mock.calls[0]!;
    expect((init?.headers as Record<string, string>)?.Accept).toBe('application/json');
  });

  it('uses GET by default', async () => {
    const mock = vi.fn().mockResolvedValue(makeResponse(200, {}));
    const client = new HttpClient({ fetch: mock });
    await client.send({ path: '/test' });
    expect(mock.mock.calls[0]![1]?.method).toBe('GET');
  });

  it('serializes a POST body and sets Content-Type', async () => {
    const mock = vi.fn().mockResolvedValue(makeResponse(200, {}));
    const client = new HttpClient({ fetch: mock });
    await client.send({ method: HttpMethod.POST, path: '/test', body: { x: 1 } });
    const [, init] = mock.mock.calls[0]!;
    expect(init?.method).toBe('POST');
    expect(init?.body).toBe('{"x":1}');
    expect((init?.headers as Record<string, string>)?.['Content-Type']).toBe('application/json');
  });

  it('does not set a body for GET requests', async () => {
    const mock = vi.fn().mockResolvedValue(makeResponse(200, {}));
    const client = new HttpClient({ fetch: mock });
    await client.send({ method: HttpMethod.GET, path: '/test', body: { x: 1 } });
    expect(mock.mock.calls[0]![1]?.body).toBeUndefined();
  });

  it('does not override an existing Content-Type header', async () => {
    const mock = vi.fn().mockResolvedValue(makeResponse(200, {}));
    const client = new HttpClient({ fetch: mock });
    await client.send({
      method: HttpMethod.POST,
      path: '/test',
      body: '<xml/>',
      headers: { 'Content-Type': 'application/xml' },
    });
    expect((mock.mock.calls[0]![1]?.headers as Record<string, string>)?.['Content-Type']).toBe('application/xml');
  });

  it('merges per-request headers', async () => {
    const mock = vi.fn().mockResolvedValue(makeResponse(200, {}));
    const client = new HttpClient({ fetch: mock });
    await client.send({ path: '/test', headers: { 'X-Req': 'hello' } });
    expect((mock.mock.calls[0]![1]?.headers as Record<string, string>)?.['X-Req']).toBe('hello');
  });

  it('cleans up the signal listener in finally on a successful response with signal', async () => {
    // Covers req.signal?.removeEventListener branch when attempt() returns
    // normally (no exception) and a signal is provided.
    const ac = new AbortController();
    const mock = vi.fn().mockResolvedValue(makeResponse(200, {}));
    const client = new HttpClient({ fetch: mock, retry: { retries: 0 } });
    const res = await client.send({ path: '/test', signal: ac.signal });
    expect(res.status).toBe(200);
  });

  it('passes 304 through without throwing', async () => {
    const client = new HttpClient({ fetch: mockFetchSequence(makeResponse(304)) });
    await expect(client.send({ path: '/test' })).resolves.toHaveProperty('status', 304);
  });
});

// ---------------------------------------------------------------------------
// send — error status codes (mapped to correct error classes)
// ---------------------------------------------------------------------------
describe('HttpClient — send — error status codes', () => {
  it.each([
    [400, HabboBadRequestError],
    [401, HabboUnauthorizedError],
    [403, HabboForbiddenError],
    [404, HabboNotFoundError],
    [429, HabboRateLimitError],
    [500, HabboServerError],
    [502, HabboServerError],
    [503, HabboServerError],
  ] as const)('throws %i → %s', async (status, ErrorClass) => {
    const client = new HttpClient({
      fetch: mockFetchSequence(makeResponse(status)),
      retry: { retries: 0 },
    });
    await expect(client.send({ path: '/test' })).rejects.toBeInstanceOf(ErrorClass);
  });

  it('includes resource and identifier in 404 errors', async () => {
    const client = new HttpClient({
      fetch: mockFetchSequence(makeResponse(404, { error: 'not-found' })),
      retry: { retries: 0 },
    });
    const err = await client
      .send({ path: '/test', resource: HabboResource.User, resourceId: 'Alice' })
      .catch((e) => e);
    expect(err).toBeInstanceOf(UserNotFoundError);
    expect(err.identifier).toBe('Alice');
    expect(err.code).toBe('not-found');
  });

  it('includes retryAfterSeconds in 429 errors from Retry-After header', async () => {
    const client = new HttpClient({
      fetch: mockFetchSequence(makeResponse(429, null, { 'retry-after': '60' })),
      retry: { retries: 0 },
    });
    const err = await client.send({ path: '/test' }).catch((e) => e);
    expect(err).toBeInstanceOf(HabboRateLimitError);
    expect((err as HabboRateLimitError).retryAfterSeconds).toBe(60);
  });

  it('ignores non-numeric Retry-After header in error object', async () => {
    const client = new HttpClient({
      fetch: mockFetchSequence(makeResponse(429, null, { 'retry-after': 'Wed, 21 Oct 2025 07:28:00 GMT' })),
      retry: { retries: 0 },
    });
    const err = await client.send({ path: '/test' }).catch((e) => e);
    expect((err as HabboRateLimitError).retryAfterSeconds).toBeUndefined();
  });

  it('handles a broken response body (text() throws) by returning undefined body', async () => {
    const brokenResponse = {
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      headers: { get: () => null },
      text: () => Promise.reject(new Error('stream error')),
    } as unknown as Response;
    const client = new HttpClient({
      fetch: vi.fn().mockResolvedValue(brokenResponse),
      retry: { retries: 0 },
    });
    const err = await client.send({ path: '/test' }).catch((e) => e);
    expect(err).toBeInstanceOf(HabboServerError);
    expect((err as HabboApiError).body).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// send — retries on retryable HTTP status codes
// ---------------------------------------------------------------------------
describe('HttpClient — send — retries on status codes', () => {
  it('retries a 500 and succeeds on the next attempt', async () => {
    const mock = mockFetchSequence(makeResponse(500), makeResponse(200, { ok: true }));
    const client = new HttpClient({
      fetch: mock,
      retry: { retries: 1, baseDelayMs: 0, jitter: false },
    });
    const res = await client.send({ path: '/test' });
    expect(res.status).toBe(200);
    expect(mock).toHaveBeenCalledTimes(2);
  });

  it('throws HabboServerError after all retries are exhausted', async () => {
    const mock = mockFetchSequence(makeResponse(500));
    const client = new HttpClient({
      fetch: mock,
      retry: { retries: 2, baseDelayMs: 0, jitter: false },
    });
    await expect(client.send({ path: '/test' })).rejects.toBeInstanceOf(HabboServerError);
    expect(mock).toHaveBeenCalledTimes(3);
  });

  it('does not retry a 404 (not in retryableStatuses)', async () => {
    const mock = mockFetchSequence(makeResponse(404));
    const client = new HttpClient({
      fetch: mock,
      retry: { retries: 2, baseDelayMs: 0, jitter: false },
    });
    await expect(client.send({ path: '/test' })).rejects.toBeInstanceOf(HabboNotFoundError);
    expect(mock).toHaveBeenCalledTimes(1);
  });

  it('retries 429, 502, 503, 504 by default', async () => {
    for (const status of [429, 502, 503, 504]) {
      const mock = mockFetchSequence(makeResponse(status), makeResponse(200, {}));
      const client = new HttpClient({
        fetch: mock,
        retry: { retries: 1, baseDelayMs: 0, jitter: false },
      });
      const res = await client.send({ path: '/test' });
      expect(res.status, `status ${status}`).toBe(200);
    }
  });

  it('honors Retry-After header for backoff timing', async () => {
    vi.useFakeTimers();
    const mock = mockFetchSequence(
      makeResponse(429, null, { 'retry-after': '5' }),
      makeResponse(200, {}),
    );
    const client = new HttpClient({
      fetch: mock,
      timeoutMs: 120_000,
      retry: { retries: 1, jitter: false },
    });

    const p = client.send({ path: '/test' });
    // Less than 5 000 ms → should not have retried yet
    await vi.advanceTimersByTimeAsync(4_900);
    expect(mock).toHaveBeenCalledTimes(1);
    // Past 5 000 ms → retry fires
    await vi.advanceTimersByTimeAsync(200);
    await p;
    expect(mock).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it('ignores a non-numeric Retry-After header and uses exponential backoff', async () => {
    vi.useFakeTimers();
    const mock = mockFetchSequence(
      makeResponse(429, null, { 'retry-after': 'not-a-number' }),
      makeResponse(200, {}),
    );
    const client = new HttpClient({
      fetch: mock,
      timeoutMs: 120_000,
      // baseDelayMs: 500 → first backoff = 500ms (no jitter)
      retry: { retries: 1, baseDelayMs: 500, jitter: false },
    });

    const p = client.send({ path: '/test' });
    await vi.advanceTimersByTimeAsync(400);
    expect(mock).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(200);
    await p;
    expect(mock).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it('caps backoff at maxDelayMs', async () => {
    vi.useFakeTimers();
    // attempt 0 → base*2^0 = 10000, but maxDelayMs = 100 → 100ms
    const mock = mockFetchSequence(makeResponse(500), makeResponse(200, {}));
    const client = new HttpClient({
      fetch: mock,
      timeoutMs: 120_000,
      retry: { retries: 1, baseDelayMs: 10_000, maxDelayMs: 100, jitter: false },
    });
    const p = client.send({ path: '/test' });
    await vi.advanceTimersByTimeAsync(50);
    expect(mock).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(70);
    await p;
    expect(mock).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it('applies jitter to backoff (result is within the expected range)', async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0); // jitter multiplier = 0.5
    // baseDelayMs=1000, attempt 0 → exp=1000, capped=1000, with jitter=0.5 → 500ms
    const mock = mockFetchSequence(makeResponse(500), makeResponse(200, {}));
    const client = new HttpClient({
      fetch: mock,
      timeoutMs: 120_000,
      retry: { retries: 1, baseDelayMs: 1_000, maxDelayMs: 60_000, jitter: true },
    });
    const p = client.send({ path: '/test' });
    await vi.advanceTimersByTimeAsync(450);
    expect(mock).toHaveBeenCalledTimes(1); // hasn't retried yet (< 500ms)
    await vi.advanceTimersByTimeAsync(100);
    await p;
    expect(mock).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
    vi.restoreAllMocks();
  });
});

// ---------------------------------------------------------------------------
// send — retries on network errors
// ---------------------------------------------------------------------------
describe('HttpClient — send — retries on network errors', () => {
  it('retries on a TypeError (DNS / connection failure) and eventually succeeds', async () => {
    const mock = mockFetchSequence(new TypeError('fetch failed'), makeResponse(200, {}));
    const client = new HttpClient({
      fetch: mock,
      retry: { retries: 1, baseDelayMs: 0, jitter: false },
    });
    const res = await client.send({ path: '/test' });
    expect(res.status).toBe(200);
    expect(mock).toHaveBeenCalledTimes(2);
  });

  it('rethrows a network Error after all retries are exhausted', async () => {
    const networkError = new TypeError('network failure');
    const mock = mockFetchSequence(networkError);
    const client = new HttpClient({
      fetch: mock,
      retry: { retries: 2, baseDelayMs: 0, jitter: false },
    });
    await expect(client.send({ path: '/test' })).rejects.toThrow('network failure');
    expect(mock).toHaveBeenCalledTimes(3);
  });

  it('retries on a plain Error (not TypeError) and succeeds', async () => {
    // Covers the `err instanceof Error` branch in isTransientNetworkError()
    // when `err instanceof TypeError` is false.
    const plainError = new Error('generic network error');
    const mock = mockFetchSequence(plainError, makeResponse(200, {}));
    const client = new HttpClient({
      fetch: mock,
      retry: { retries: 1, baseDelayMs: 0, jitter: false },
    });
    const res = await client.send({ path: '/test' });
    expect(res.status).toBe(200);
  });

  it('rethrows a fetch error when a (non-aborted) signal is provided', async () => {
    // Covers the `throw err` branch in attempt() when controller is not aborted.
    const ac = new AbortController();
    const mock = mockFetchSequence(new TypeError('net err'));
    const client = new HttpClient({ fetch: mock, retry: { retries: 0 } });
    await expect(client.send({ path: '/test', signal: ac.signal })).rejects.toThrow('net err');
  });

  it('does not retry a HabboApiError thrown inside fetch (non-transient)', async () => {
    // Simulate fetch that somehow throws a HabboApiError
    const apiErr = new HabboApiError({ status: 400, statusText: 'Bad', url: 'x', body: null });
    const mock = vi.fn().mockRejectedValue(apiErr);
    const client = new HttpClient({
      fetch: mock,
      retry: { retries: 2, baseDelayMs: 0, jitter: false },
    });
    await expect(client.send({ path: '/test' })).rejects.toBeInstanceOf(HabboApiError);
    expect(mock).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// send — timeout handling
// ---------------------------------------------------------------------------
describe('HttpClient — send — timeout', () => {
  it('throws HabboTimeoutError when the per-attempt timeout fires', async () => {
    vi.useFakeTimers();
    try {
      const client = new HttpClient({
        fetch: mockFetchHanging(),
        timeoutMs: 100,
        retry: { retries: 0 },
      });
      const p = client.send({ path: '/ping' });
      // Attach the rejection handler BEFORE advancing time to avoid unhandled rejection warnings.
      const assertion = expect(p).rejects.toBeInstanceOf(HabboTimeoutError);
      await vi.advanceTimersByTimeAsync(150);
      await assertion;
    } finally {
      vi.useRealTimers();
    }
  });

  it('throws HabboTimeoutError when timeout fires and a (non-aborted) signal is provided', async () => {
    // Covers the branch: controller.signal.aborted=true && !req.signal?.aborted
    // where req.signal is defined but the USER has not aborted it.
    vi.useFakeTimers();
    try {
      const ac = new AbortController();
      const client = new HttpClient({
        fetch: mockFetchHanging(),
        timeoutMs: 100,
        retry: { retries: 0 },
      });
      const p = client.send({ path: '/test', signal: ac.signal });
      const assertion = expect(p).rejects.toBeInstanceOf(HabboTimeoutError);
      await vi.advanceTimersByTimeAsync(200);
      await assertion;
    } finally {
      vi.useRealTimers();
    }
  });

  it('retries after a timeout when retryOnTimeout is true (default)', async () => {
    vi.useFakeTimers();
    try {
      const hanging = mockFetchHanging();
      const success = mockFetchSequence(makeResponse(200, {}));
      let call = 0;
      const combinedFetch = vi.fn((...args: Parameters<typeof hanging>) => {
        return call++ === 0 ? hanging(...args) : success(...args);
      });

      const client = new HttpClient({
        fetch: combinedFetch,
        timeoutMs: 100,
        retry: { retries: 1, baseDelayMs: 0, jitter: false, retryOnTimeout: true },
      });
      const p = client.send({ path: '/test' });
      await vi.advanceTimersByTimeAsync(150); // trigger timeout on first attempt
      await vi.advanceTimersByTimeAsync(10);  // 0ms backoff → second attempt
      const res = await p;
      expect(res.status).toBe(200);
    } finally {
      vi.useRealTimers();
    }
  });

  it('does not retry after a timeout when retryOnTimeout is false', async () => {
    vi.useFakeTimers();
    try {
      const client = new HttpClient({
        fetch: mockFetchHanging(),
        timeoutMs: 100,
        retry: { retries: 1, baseDelayMs: 0, jitter: false, retryOnTimeout: false },
      });
      const p = client.send({ path: '/test' });
      const assertion = expect(p).rejects.toBeInstanceOf(HabboTimeoutError);
      await vi.advanceTimersByTimeAsync(200);
      await assertion;
    } finally {
      vi.useRealTimers();
    }
  });
});

// ---------------------------------------------------------------------------
// send — abort handling
// ---------------------------------------------------------------------------
describe('HttpClient — send — abort', () => {
  it('throws AbortError when the caller aborts an in-flight request', async () => {
    const ac = new AbortController();
    const fetch = mockFetchHanging();
    const client = new HttpClient({ fetch, retry: { retries: 0 } });
    const p = client.send({ path: '/test', signal: ac.signal });
    ac.abort();
    await expect(p).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('throws immediately when the signal is already aborted before send()', async () => {
    const ac = new AbortController();
    ac.abort();
    const mock = vi.fn();
    const client = new HttpClient({ fetch: mock, retry: { retries: 0 } });
    await expect(client.send({ path: '/test', signal: ac.signal })).rejects.toMatchObject({
      name: 'AbortError',
    });
    expect(mock).not.toHaveBeenCalled();
  });

  it('propagates a custom abort reason when provided', async () => {
    const ac = new AbortController();
    const customError = new Error('cancelled by user');
    ac.abort(customError);
    const client = new HttpClient({ fetch: vi.fn(), retry: { retries: 0 } });
    await expect(client.send({ path: '/test', signal: ac.signal })).rejects.toThrow(
      'cancelled by user',
    );
  });

  it('uses generic AbortError when abort reason is not an Error', async () => {
    const ac = new AbortController();
    ac.abort('string reason');
    const client = new HttpClient({ fetch: vi.fn(), retry: { retries: 0 } });
    await expect(client.send({ path: '/test', signal: ac.signal })).rejects.toMatchObject({
      name: 'AbortError',
    });
  });

  it('aborts during a non-zero backoff delay (signal aborted while waiting)', async () => {
    vi.useFakeTimers();
    const ac = new AbortController();
    const mock = vi.fn().mockResolvedValue(makeResponse(500));
    const client = new HttpClient({
      fetch: mock,
      timeoutMs: 120_000,
      retry: { retries: 1, baseDelayMs: 5_000, jitter: false },
    });

    const p = client.send({ path: '/test', signal: ac.signal });
    // Flush microtasks: fetch resolves → send enters delay(5000, signal)
    await vi.advanceTimersByTimeAsync(0);
    // Abort while inside the backoff delay
    ac.abort();
    await expect(p).rejects.toMatchObject({ name: 'AbortError' });
    vi.useRealTimers();
  });

  it('completes backoff normally when signal is provided but never aborted', async () => {
    // Covers signal?.removeEventListener inside delay()'s timer callback.
    vi.useFakeTimers();
    try {
      const ac = new AbortController();
      const mock = mockFetchSequence(makeResponse(500), makeResponse(200, {}));
      const client = new HttpClient({
        fetch: mock,
        timeoutMs: 120_000,
        retry: { retries: 1, baseDelayMs: 100, jitter: false },
      });
      const p = client.send({ path: '/test', signal: ac.signal });
      await vi.advanceTimersByTimeAsync(200);
      const res = await p;
      expect(res.status).toBe(200);
    } finally {
      vi.useRealTimers();
    }
  });

  it('aborts when the signal becomes aborted before delay() is called (inside retry logic)', async () => {
    // Abort happens INSIDE the mock fetch, before delay() is called on the next iteration.
    const ac = new AbortController();
    const mock = vi.fn(async () => {
      ac.abort(); // abort while the first request is executing
      return makeResponse(500);
    });
    const client = new HttpClient({
      fetch: mock,
      retry: { retries: 1, baseDelayMs: 0, jitter: false },
      timeoutMs: 30_000,
    });
    await expect(client.send({ path: '/test', signal: ac.signal })).rejects.toMatchObject({
      name: 'AbortError',
    });
    expect(mock).toHaveBeenCalledTimes(1); // no second attempt
  });
});
