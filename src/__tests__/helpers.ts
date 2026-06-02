import { vi } from 'vitest';

const STATUS_TEXT: Record<number, string> = {
  200: 'OK',
  201: 'Created',
  204: 'No Content',
  304: 'Not Modified',
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  429: 'Too Many Requests',
  500: 'Internal Server Error',
  502: 'Bad Gateway',
  503: 'Service Unavailable',
  504: 'Gateway Timeout',
};

/**
 * Creates a `Response` with the given status, JSON/text body and optional headers.
 * `body: null` → empty body (empty string).
 *
 * Note: the Fetch API `Response` constructor does not accept status 304 in some
 * runtimes, so those are returned as plain mock objects instead.
 */
export function makeResponse(
  status: number,
  body: unknown = null,
  headers: Record<string, string> = {},
): Response {
  const text =
    body === null
      ? ''
      : typeof body === 'string'
        ? body
        : JSON.stringify(body);

  // Node.js (undici) does not allow constructing a Response with status 304.
  if (status === 304) {
    return {
      ok: false,
      status: 304,
      statusText: 'Not Modified',
      headers: new Headers(headers),
      url: '',
      text: async () => text,
      body: null,
      bodyUsed: false,
    } as unknown as Response;
  }

  return new Response(text, {
    status,
    statusText: STATUS_TEXT[status] ?? 'Unknown',
    headers,
  });
}

/**
 * Creates a mock `fetch` that serves `responses` in order. The last response is
 * repeated if the mock is called more times than there are entries.
 */
export function mockFetchSequence(
  ...responses: Array<Response | Error>
): ReturnType<typeof vi.fn> {
  let i = 0;
  return vi.fn(async (_url: string, _init?: RequestInit) => {
    const r = responses[i < responses.length ? i++ : responses.length - 1];
    if (r instanceof Error) throw r;
    return r as Response;
  });
}

/**
 * Creates a mock `fetch` that never resolves; used to test timeout behaviour.
 * The returned promise rejects when `init.signal` aborts.
 */
export function mockFetchHanging(): ReturnType<typeof vi.fn> {
  return vi.fn(
    (_url: string, init?: RequestInit): Promise<Response> =>
      new Promise<Response>((_, reject) => {
        init?.signal?.addEventListener(
          'abort',
          () => reject(Object.assign(new Error('Aborted'), { name: 'AbortError' })),
          { once: true },
        );
      }),
  );
}
