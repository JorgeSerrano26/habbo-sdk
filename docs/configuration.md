# Configuration

Pass a `HabboClientConfig` object to `HabboSDK` (or to any individual client).
Every field is optional except that you'll almost always want to set `hotel`.

```ts
import { HabboSDK, HabboHotel } from '@jorgeserrano26/habbo-sdk';

const sdk = new HabboSDK({
  // Which hotel to target. HabboHotel enum value or a raw domain suffix.
  hotel: HabboHotel.ES,

  // Optional: fully-qualified base URL override (ignores `hotel` when set).
  baseUrl: 'https://www.habbo.es',

  // API key for Habbo Origins fishing-derby endpoints.
  apiKey: 'my-api-key',

  // Custom fetch implementation (defaults to globalThis.fetch).
  fetch: customFetch,

  // Extra headers merged into every request.
  headers: { 'X-App': 'my-app/1.0' },

  // Per-attempt request timeout in milliseconds. Default: 30_000.
  timeoutMs: 15_000,

  // Automatic retry configuration (see below).
  retry: {
    retries: 2,
    baseDelayMs: 500,
    maxDelayMs: 10_000,
    retryableStatuses: [429, 500, 502, 503, 504],
    retryOnTimeout: true,
    jitter: true,
  },
});
```

Each individual client accepts the same config:

```ts
import { HabboClient, GameDataClient, HabboHotel } from '@jorgeserrano26/habbo-sdk';

const habbo    = new HabboClient({ hotel: HabboHotel.FR });
const gamedata = new GameDataClient({ hotel: HabboHotel.DE });
```

## Config reference

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `hotel` | `HabboHotel \| string` | `HabboHotel.COM` | Hotel domain suffix. |
| `baseUrl` | `string` | derived from `hotel` | Full base URL override. |
| `apiKey` | `string` | — | Default API key for Origins derby endpoints. |
| `fetch` | `typeof fetch` | `globalThis.fetch` | Custom fetch implementation. |
| `headers` | `Record<string, string>` | — | Headers merged into every request. |
| `timeoutMs` | `number` | `30000` | Per-attempt timeout. |
| `retry` | `RetryConfig` | see below | Retry behaviour. |

## Hotels

| Enum | Domain |
|------|--------|
| `HabboHotel.COM` | `www.habbo.com` |
| `HabboHotel.BR` | `www.habbo.com.br` |
| `HabboHotel.DE` | `www.habbo.de` |
| `HabboHotel.ES` | `www.habbo.es` |
| `HabboHotel.FI` | `www.habbo.fi` |
| `HabboHotel.FR` | `www.habbo.fr` |
| `HabboHotel.IT` | `www.habbo.it` |
| `HabboHotel.NL` | `www.habbo.nl` |
| `HabboHotel.TR` | `www.habbo.com.tr` |

You can also pass any raw suffix string: `new HabboSDK({ hotel: 'com.tr' })`.

> These 9 are the only hotels with an active public API. Historical hotels
> (e.g. `habbo.com.au`, `habbo.co.uk`, `habbo.com.mx`) have been merged into one
> of the above and no longer serve the API; closed hotels (`habbo.dk`,
> `habbo.se`, etc.) are fully offline.

## Retries & backoff

The SDK automatically retries transient failures with exponential backoff and optional jitter.

**Retried by default:**
- HTTP status codes `429`, `500`, `502`, `503`, `504`
- Network-level errors (`TypeError` / `Error` from `fetch`)
- Per-attempt timeouts (when `retryOnTimeout: true`)

**Never retried:**
- `4xx` errors (except `429`)
- Caller-initiated `AbortSignal` cancellation

**Backoff formula:** `delay = min(baseDelayMs × 2^attempt, maxDelayMs) × (0.5–1.0 jitter)`.
A numeric `Retry-After` response header overrides the computed delay.

| `RetryConfig` field | Type | Default | Description |
|---------------------|------|---------|-------------|
| `retries` | `number` | `2` | Max retries after the initial attempt. |
| `baseDelayMs` | `number` | `500` | Backoff base. |
| `maxDelayMs` | `number` | `10000` | Backoff cap. |
| `retryableStatuses` | `number[]` | `[429,500,502,503,504]` | Which HTTP codes to retry. |
| `retryOnTimeout` | `boolean` | `true` | Retry per-attempt timeouts. |
| `jitter` | `boolean` | `true` | Randomise delay to avoid thundering herd. |

```ts
// Disable retries entirely:
new HabboSDK({ hotel: HabboHotel.ES, retry: { retries: 0 } });
```

## Cancellation (`AbortSignal`)

Every method accepts a `signal`. Cancellation is honoured during the in-flight
request **and** during the backoff wait between retries.

```ts
const controller = new AbortController();
setTimeout(() => controller.abort(), 5_000);

try {
  await sdk.habbo.getUserProfile('hhes-...', { signal: controller.signal });
} catch (err) {
  if (err.name === 'AbortError') console.log('Request cancelled.');
}
```

## Extending

All clients extend `BaseClient`, which exposes `this.http` (an `HttpClient`).
Subclass any client to add custom methods, sharing the SDK's HTTP layer:

```ts
import { HabboClient, HabboSDK, HabboHotel, UserNotFoundError } from '@jorgeserrano26/habbo-sdk';

class MyHabboClient extends HabboClient {
  async findUser(name: string) {
    try {
      return await this.getUserByName(name);
    } catch (err) {
      if (err instanceof UserNotFoundError) return null;
      throw err;
    }
  }

  // Call any endpoint directly through the shared HTTP layer.
  customEndpoint<T>(path: string) {
    return this.http.request<T>({ path });
  }
}

const sdk = new HabboSDK({ hotel: HabboHotel.ES });
const myClient = new MyHabboClient(sdk.http); // shares base URL, timeout, headers
```
