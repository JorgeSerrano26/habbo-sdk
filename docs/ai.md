# AI guide — `@jorgeserrano26/habbo-sdk`

A compact, LLM-oriented reference for **using** this SDK in an application.
Everything an assistant needs to write correct calls without reading source.

If you are working **on** this repository (contributing), read
[`AGENTS.md`](../AGENTS.md) instead.

## One-paragraph summary

`@jorgeserrano26/habbo-sdk` is a zero-dependency, ESM-only, fully-typed wrapper
over the **public** Habbo & Habbo Origins Web API and the Habbo gamedata files.
You create one `HabboSDK` per hotel (domain), then call one method per endpoint.
It needs Node ≥ 18, a browser, Deno, or Bun (it uses the global `fetch`). It is
**unofficial** and only touches public, unauthenticated endpoints.

## Install & import

```bash
npm install @jorgeserrano26/habbo-sdk@beta
```

```ts
import { HabboSDK, HabboHotel } from '@jorgeserrano26/habbo-sdk';
const sdk = new HabboSDK({ hotel: HabboHotel.ES }); // → https://www.habbo.es
```

ESM only (`"type": "module"`). No CommonJS `require`. Always pass a `HabboHotel`
(or a raw suffix string like `'com.br'`); default is `HabboHotel.COM`.

## Mental model

- `HabboSDK` is a facade holding a shared `HttpClient` and three clients.
- `sdk.habbo` → modern Habbo Web API.
- `sdk.origins` → Habbo Origins API.
- `sdk.gamedata` → gamedata files (XML / key=value), hashes, client URLs.
- `GameDataHashedClient` → optional helper to load many gamedata files without a redirect per file.
- Every method's **last argument** is an options object: `{ signal?, headers? }` (some add more).
- Non-2xx → throws a typed `HabboApiError` subclass. Timeout → `HabboTimeoutError`. Abort → DOM `AbortError`.
- Retries (429/5xx/network) with exponential backoff are automatic and configurable.

## Method → endpoint cheat sheet

### `sdk.habbo` (HabboClient)

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
| `getMarketplaceStatsBatch(request)` | `POST /api/public/marketplace/stats/batch` | `MarketplaceStatsBatchResponse` |

### `sdk.origins` (HabboOriginsClient)

| Call | Endpoint | Returns |
|------|----------|---------|
| `getHabboIdByPlayerId(playerId)` | `GET /api/public/users/by-playerId/{id}` | `string[]` |
| `getMatchIdsByPlayer(playerId, opts?)` | `GET /api/public/matches/v1/{id}/ids` | `string[]` |
| `getMatch(matchId)` | `GET /api/public/matches/v1/{id}` | `MatchDetails` |
| `getDerbyIdsByPlayer(playerId, opts?)` | `GET /api/public/minigame/derby/v1/{id}/ids` | `string[]` ⚠️ needs api key |
| `getDerby(derbyId, opts?)` | `GET /api/public/minigame/derby/v1/{id}` | `DerbyDetails` ⚠️ needs api key |
| `getDerbyStatus(opts?)` | `GET /api/public/minigame/derby/v1/status` | `DerbyStatus` ⚠️ needs api key |
| `getPlayerSkill(playerId, skillType?)` | `GET /api/public/skills/{id}` | `PlayerSkill` |
| `getSkillsLeaderboard(skillType?, opts?)` | `GET /api/public/skills/leaderboard` | `SkillsLeaderboard` |

- `skillType` defaults to `SkillType.Fishing`.
- Match/derby list opts: `{ offset?, limit?, startTime?, endTime? }` (times: `YYYY-MM-DD HH:mm:ss.SSS`).
- Derby endpoints require an `api_key`: set `apiKey` in the SDK config, or pass `{ apiKey }` per call.

### `sdk.gamedata` (GameDataClient)

All file methods take `(revision = 1, options?)`. Revision `1` always resolves to current.

| Call | What | Returns |
|------|------|---------|
| `getFigureData()` | figuredata | XML string |
| `getProductData()` | productdata | XML string |
| `getFurniData()` | furnidata_xml | XML string |
| `getExternalVariables()` / `getExternalVariablesMap()` | external_variables | string / `Record<string,string>` |
| `getExternalTexts()` / `getExternalTextsMap()` | external_flash_texts | string / `Record<string,string>` |
| `getParsedFigureData()` | figuredata | `FigureData` |
| `getParsedFurniData()` | furnidata_xml | `FurniData` |
| `getParsedProductData()` | productdata | `ProductDataEntry[]` |
| `resolveUrl(type, rev?)` | any | hashed URL string |
| `getHashes()` | `GET /gamedata/hashes` | `GameDataHashesResponse` |
| `buildHashedUrl(entry)` | — | full immutable URL |
| `getClientUrls()` | `GET /gamedata/clienturls` | `ClientUrlsResponse` |

`type` is a `GameDataType`: `FigureData`, `ProductData`, `FurniDataXml`, `ExternalVariables`, `ExternalFlashTexts`.

## Canonical snippets

```ts
// User lookup → profile → skill
const user = await sdk.habbo.getUserByName('SomeName');
const profile = await sdk.habbo.getUserProfile(user.uniqueId);
const skill = await sdk.origins.getPlayerSkill(user.uniqueId);
```

```ts
// Typed gamedata
const furni = await sdk.gamedata.getParsedFurniData();
console.log(furni.roomitemtypes[0].name);

const vars = await sdk.gamedata.getExternalVariablesMap();
console.log(vars['flash.client.url']);
```

```ts
// Many gamedata files efficiently (fetch hashes once → direct CDN, no redirects)
import { GameDataHashedClient } from '@jorgeserrano26/habbo-sdk';
const hashed = await GameDataHashedClient.fromHotel(sdk.gamedata);
const figureXml = await hashed.getFigureData();
const furniXml  = await hashed.getFurniData();
```

```ts
// Cancellation + per-request headers
const ctrl = new AbortController();
const u = await sdk.habbo.getUserById('hhes-...', { signal: ctrl.signal });
```

```ts
// Typed error handling
import { UserNotFoundError, HabboRateLimitError } from '@jorgeserrano26/habbo-sdk';
try {
  await sdk.habbo.getUserByName('NoOne');
} catch (err) {
  if (err instanceof UserNotFoundError) {/* err.identifier, err.resource */}
  else if (err instanceof HabboRateLimitError) {/* err.retryAfterSeconds */}
  else throw err;
}
```

## Error types (all extend `HabboApiError` unless noted)

`HabboBadRequestError` (400), `HabboUnauthorizedError` (401),
`HabboForbiddenError` (403), `HabboNotFoundError` (404) and its subclasses
`UserNotFoundError` / `GroupNotFoundError` / `RoomNotFoundError` /
`BadgeNotFoundError` / `AchievementNotFoundError` / `MatchNotFoundError` /
`DerbyNotFoundError` / `PlayerNotFoundError`, `HabboRateLimitError` (429,
`.retryAfterSeconds`), `HabboServerError` (5xx). Separately: `HabboTimeoutError`
(`.timeoutMs`, `.url`). Common fields: `status`, `statusText`, `url`, `body`, `code`.

## Gotchas (read before generating code)

1. **ESM only** — no `require`; the consumer's project must support ESM.
2. **One SDK per hotel** — gamedata and API values differ per domain. Don't reuse an `.es` SDK for `.com.br` data.
3. **Only 9 hotels have a live API**: COM, BR, DE, ES, FI, FR, IT, NL, TR. Others (`com.au`, `co.uk`, `com.mx`, `dk`, …) are merged/closed and fail (often TLS errors).
4. **Derby endpoints need an api key** — without it they 401/403.
5. **`uniqueId` vs Origins `playerId` differ** — `sdk.habbo` uses `uniqueId` (`hhxx-...`); Origins uses `playerId`. Convert with `sdk.origins.getHabboIdByPlayerId`.
6. **Gamedata returns raw strings by default** — use the `getParsed*` / `*Map` variants for objects.
7. **Two ways to get gamedata hashes**: `GameDataClient` lets the server resolve the hash via a 307 (automatic, one redirect per file); `GameDataHashedClient` fetches `/gamedata/hashes` once and goes direct (better for many files). Caching the hashes is the caller's responsibility — the SDK never caches.
8. **`ifNoneMatch`** on `getUserByName`/`getUserById`: a `304` resolves to `undefined` (not an error).

## Full human docs

[Configuration](configuration.md) · [Habbo API](habbo-api.md) ·
[Origins API](origins-api.md) · [Gamedata](gamedata.md) ·
[Gamedata Hashes](gamedata-hashes.md) · [Errors](errors.md)
