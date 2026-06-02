# Errors

Non-2xx responses throw a typed subclass of `HabboApiError`. Per-attempt
timeouts throw `HabboTimeoutError`. Caller-initiated cancellation throws a
DOM `AbortError` (check `err.name === 'AbortError'`).

## Hierarchy

```
Error
 ├─ HabboApiError                  — base for all API errors
 │   ├─ HabboBadRequestError       — 400
 │   ├─ HabboUnauthorizedError     — 401
 │   ├─ HabboForbiddenError        — 403
 │   ├─ HabboNotFoundError         — 404 (base)
 │   │   ├─ UserNotFoundError
 │   │   ├─ GroupNotFoundError
 │   │   ├─ RoomNotFoundError
 │   │   ├─ BadgeNotFoundError
 │   │   ├─ AchievementNotFoundError
 │   │   ├─ MatchNotFoundError
 │   │   ├─ DerbyNotFoundError
 │   │   └─ PlayerNotFoundError
 │   ├─ HabboRateLimitError        — 429 (exposes retryAfterSeconds)
 │   └─ HabboServerError           — 5xx
 └─ HabboTimeoutError              — per-attempt timeout (exposes timeoutMs, url)
```

## Properties

All `HabboApiError` subclasses carry:

| Field | Type | Description |
|-------|------|-------------|
| `status` | `number` | HTTP status code. |
| `statusText` | `string` | HTTP status text. |
| `url` | `string` | Absolute URL requested. |
| `body` | `unknown` | Parsed response body. |
| `code` | `string \| undefined` | Machine-readable error code from the body. |

Additional fields by subclass:

| Subclass | Extra fields |
|----------|--------------|
| `HabboNotFoundError` (and its subclasses) | `resource` (`HabboResource` enum), `identifier` (the id/name looked up). |
| `HabboRateLimitError` | `retryAfterSeconds`. |
| `HabboTimeoutError` | `timeoutMs`, `url`. |

## Which method throws which 404

The resource-specific 404 errors are thrown by the methods that look that
resource up:

| Error | Thrown by (examples) |
|-------|----------------------|
| `UserNotFoundError` | `getUserByName`, `getUserById`, `getUserProfile`, `getUser*` |
| `GroupNotFoundError` | `getGroup`, `getGroupMembers` |
| `RoomNotFoundError` | `getRoom` |
| `BadgeNotFoundError` | `getBadgeOwners` |
| `AchievementNotFoundError` | `getUserAchievements` |
| `MatchNotFoundError` | `getMatch` |
| `DerbyNotFoundError` | `getDerby` |
| `PlayerNotFoundError` | `getHabboIdByPlayerId`, `getPlayerSkill`, … |

## Handling

```ts
import {
  UserNotFoundError,
  HabboRateLimitError,
  HabboApiError,
  HabboTimeoutError,
} from '@jorgeserrano26/habbo-sdk';

try {
  const user = await sdk.habbo.getUserByName('NonExistent');
} catch (err) {
  if (err instanceof UserNotFoundError) {
    console.log(`User "${err.identifier}" not found.`); // err.resource → HabboResource.User
  } else if (err instanceof HabboRateLimitError) {
    console.log(`Rate limited. Retry after ${err.retryAfterSeconds}s.`);
  } else if (err instanceof HabboTimeoutError) {
    console.log(`Timed out after ${err.timeoutMs}ms on ${err.url}`);
  } else if (err instanceof HabboApiError) {
    console.log(`API error ${err.status}: ${err.code}`);
  } else {
    throw err;
  }
}
```

## Advanced: building errors manually

`createHabboApiError(status, statusText, url, body, context?)` is the factory
the HTTP layer uses internally. It picks the right subclass from the status code
and `context` (resource + identifier). Exported for custom clients.
