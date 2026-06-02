---
name: habbo-sdk
description: Use the @jorgeserrano26/habbo-sdk library to call the public Habbo & Habbo Origins Web API and Habbo gamedata files from JavaScript/TypeScript. Apply when writing or editing code that fetches Habbo users, profiles, friends, groups, rooms, badges, achievements, marketplace stats, Origins matches/derby/skills, or gamedata (figuredata, furnidata, productdata, external variables) — or whenever the @jorgeserrano26/habbo-sdk package appears in the project.
---

# Using @jorgeserrano26/habbo-sdk

A zero-dependency, ESM-only, fully-typed wrapper over the **public** Habbo &
Habbo Origins Web API and Habbo gamedata files. Unofficial; public,
unauthenticated endpoints only. Runs on Node ≥ 18, browsers, Deno, Bun (uses
the global `fetch`).

Full reference: https://github.com/JorgeSerrano26/habbo-sdk/blob/main/docs/ai.md

## Setup

```bash
npm install @jorgeserrano26/habbo-sdk@beta
```

```ts
import { HabboSDK, HabboHotel } from '@jorgeserrano26/habbo-sdk';

// One SDK per hotel. Values (API + gamedata) differ per domain.
const sdk = new HabboSDK({ hotel: HabboHotel.ES }); // → https://www.habbo.es
```

ESM only — no `require`. Default hotel is `HabboHotel.COM`. You may pass a raw
suffix string (`{ hotel: 'com.br' }`).

## Structure

- `sdk.habbo` — modern Habbo Web API (users, profiles, friends, groups, rooms, badges, achievements, marketplace).
- `sdk.origins` — Habbo Origins API (player lookup, matches, fishing derby, skills).
- `sdk.gamedata` — gamedata files (XML / key=value), hashes, client URLs.
- `GameDataHashedClient` — optional helper to load many gamedata files without a 307 redirect per file.

Every method's **last argument** is an options object `{ signal?, headers? }`
(some add more). Non-2xx throws a typed `HabboApiError` subclass; timeout throws
`HabboTimeoutError`; abort throws a DOM `AbortError`. Retries (429/5xx/network)
with exponential backoff are automatic and configurable via `config.retry`.

## Method → endpoint

### `sdk.habbo`
| Call | Endpoint | Returns |
|------|----------|---------|
| `ping()` | `GET /api/public/ping` | `unknown` |
| `getAchievements()` | `GET /api/public/achievements` | `Achievement[]` |
| `getUserAchievements(uniqueId)` | `GET /api/public/achievements/{id}` | `Achievement[]` |
| `getBadgeOwners(badgeCode)` | `GET /api/public/badge/owners/{badgeCode}` | `BadgeOwners` |
| `getGroup(groupId)` | `GET /api/public/groups/{id}` | `Group` |
| `getGroupMembers(groupId)` | `GET /api/public/groups/{id}/members` | `GroupMember[]` |
| `getRoom(roomId)` | `GET /api/public/rooms/{roomId}` | `Room` |
| `getHotLooks()` | `GET /api/public/lists/hotlooks` | `HotLook[]` |
| `getUserByName(name)` | `GET /api/public/users?name=` | `User` (supports `ifNoneMatch`) |
| `getUserById(uniqueId)` | `GET /api/public/users/{id}` | `User` (supports `ifNoneMatch`) |
| `getUserProfile(uniqueId)` | `GET /api/public/users/{id}/profile` | `UserProfile` |
| `getUserFriends(uniqueId)` | `GET /api/public/users/{id}/friends` | `Friend[]` |
| `getUserGroups(uniqueId)` | `GET /api/public/users/{id}/groups` | `Group[]` |
| `getUserRooms(uniqueId)` | `GET /api/public/users/{id}/rooms` | `Room[]` |
| `getUserBadges(uniqueId)` | `GET /api/public/users/{id}/badges` | `UserBadge[]` |
| `getMarketplaceStatsBatch(req)` | `POST /api/public/marketplace/stats/batch` | `MarketplaceStatsBatchResponse` |

### `sdk.origins`
| Call | Endpoint | Returns |
|------|----------|---------|
| `getHabboIdByPlayerId(playerId)` | `GET /api/public/users/by-playerId/{id}` | `string[]` |
| `getMatchIdsByPlayer(playerId, opts?)` | `GET /api/public/matches/v1/{id}/ids` | `string[]` |
| `getMatch(matchId)` | `GET /api/public/matches/v1/{id}` | `MatchDetails` |
| `getDerbyIdsByPlayer(playerId, opts?)` | `GET /api/public/minigame/derby/v1/{id}/ids` | `string[]` ⚠️ api key |
| `getDerby(derbyId, opts?)` | `GET /api/public/minigame/derby/v1/{id}` | `DerbyDetails` ⚠️ api key |
| `getDerbyStatus(opts?)` | `GET /api/public/minigame/derby/v1/status` | `DerbyStatus` ⚠️ api key |
| `getPlayerSkill(playerId, skillType?)` | `GET /api/public/skills/{id}` | `PlayerSkill` |
| `getSkillsLeaderboard(skillType?, opts?)` | `GET /api/public/skills/leaderboard` | `SkillsLeaderboard` |

`skillType` defaults to `SkillType.Fishing`. Derby endpoints need an `api_key`
(set `apiKey` in config or pass `{ apiKey }` per call). List opts:
`{ offset?, limit?, startTime?, endTime? }` (times `YYYY-MM-DD HH:mm:ss.SSS`).

### `sdk.gamedata`
File methods take `(revision = 1, options?)`; revision `1` = current.
`getFigureData` / `getProductData` / `getFurniData` → XML string.
`getExternalVariables(Map)` / `getExternalTexts(Map)` → string or `Record<string,string>`.
`getParsedFigureData` → `FigureData`, `getParsedFurniData` → `FurniData`,
`getParsedProductData` → `ProductDataEntry[]`. Also `resolveUrl(type, rev?)`,
`getHashes()` (`GET /gamedata/hashes`), `buildHashedUrl(entry)`,
`getClientUrls()` (`GET /gamedata/clienturls`).

## Canonical snippets

```ts
// User lookup → profile → Origins skill
const user = await sdk.habbo.getUserByName('SomeName');
const profile = await sdk.habbo.getUserProfile(user.uniqueId);
const skill = await sdk.origins.getPlayerSkill(user.uniqueId);
```

```ts
// Typed gamedata
const furni = await sdk.gamedata.getParsedFurniData();
const vars  = await sdk.gamedata.getExternalVariablesMap();
```

```ts
// Many gamedata files efficiently — fetch hashes once, then direct CDN
import { GameDataHashedClient } from '@jorgeserrano26/habbo-sdk';
const hashed = await GameDataHashedClient.fromHotel(sdk.gamedata);
const figureXml = await hashed.getFigureData();
```

```ts
// Typed errors
import { UserNotFoundError, HabboRateLimitError } from '@jorgeserrano26/habbo-sdk';
try {
  await sdk.habbo.getUserByName('NoOne');
} catch (err) {
  if (err instanceof UserNotFoundError) {/* err.identifier, err.resource */}
  else if (err instanceof HabboRateLimitError) {/* err.retryAfterSeconds */}
  else throw err;
}
```

## Errors

All extend `HabboApiError` (fields: `status`, `statusText`, `url`, `body`,
`code`): `HabboBadRequestError` (400), `HabboUnauthorizedError` (401),
`HabboForbiddenError` (403), `HabboNotFoundError` (404) + `UserNotFoundError`,
`GroupNotFoundError`, `RoomNotFoundError`, `BadgeNotFoundError`,
`AchievementNotFoundError`, `MatchNotFoundError`, `DerbyNotFoundError`,
`PlayerNotFoundError`, `HabboRateLimitError` (429, `.retryAfterSeconds`),
`HabboServerError` (5xx). Separately `HabboTimeoutError` (`.timeoutMs`, `.url`).

## Gotchas — check before writing code

1. **ESM only** — the consuming project must support ES modules; no `require`.
2. **One SDK per hotel** — never reuse an `.es` SDK to read `.com.br` data.
3. **Only 9 hotels have a live API**: COM, BR, DE, ES, FI, FR, IT, NL, TR. Others (`com.au`, `co.uk`, `com.mx`, `dk`, …) are merged/closed and fail (often TLS errors).
4. **Derby endpoints require an api key** — otherwise 401/403.
5. **`uniqueId` (Habbo, `hhxx-...`) ≠ `playerId` (Origins)** — convert with `sdk.origins.getHabboIdByPlayerId`.
6. **Gamedata returns raw strings by default** — use `getParsed*` / `*Map` for objects.
7. **Two ways to resolve gamedata hashes**: `GameDataClient` (server resolves via 307, automatic, one redirect per file) vs `GameDataHashedClient` (fetch `/gamedata/hashes` once, then direct — better for many files). The SDK never caches; caching hashes is the caller's job.
8. **`ifNoneMatch`** on `getUserByName`/`getUserById`: a `304` resolves to `undefined`, not an error.
