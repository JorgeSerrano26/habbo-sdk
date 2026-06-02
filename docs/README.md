# Documentation

Full reference for `@jorgeserrano26/habbo-sdk`. Each page lists every method
and the exact Habbo endpoint it calls.

| Page | Covers |
|------|--------|
| [Configuration](configuration.md) | `HabboClientConfig`, hotels, retries, timeouts, headers, cancellation. |
| [Habbo API](habbo-api.md) | `HabboClient` (`sdk.habbo`) — users, profiles, groups, rooms, badges, achievements, marketplace. |
| [Origins API](origins-api.md) | `HabboOriginsClient` (`sdk.origins`) — player lookup, matches, fishing derby, skills. |
| [Gamedata](gamedata.md) | `GameDataClient` (`sdk.gamedata`) — gamedata files, hashes, client URLs, XML parsers. |
| [Gamedata Hashes](gamedata-hashes.md) | `GameDataHashedClient` — efficient multi-asset loading from CDN. |
| [Errors](errors.md) | The full `HabboApiError` hierarchy and handling patterns. |

## Conventions

- **Base URL** — `https://www.habbo.{hotel}`, set once via the `hotel` config option.
- **Options object** — every method accepts an optional trailing options object:

  | Field | Type | Description |
  |-------|------|-------------|
  | `signal` | `AbortSignal` | Cancel the request (and any pending retry backoff). |
  | `headers` | `Record<string, string>` | Per-request extra headers. |

  Some methods extend this with extra fields (`ifNoneMatch`, `apiKey`, pagination…) — noted per method.
- **Errors** — non-2xx responses reject with a typed [`HabboApiError`](errors.md) subclass; timeouts reject with `HabboTimeoutError`.
