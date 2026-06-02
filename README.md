# @jorgeserrano26/habbo-sdk

> Type-safe, hotel-configurable JavaScript/TypeScript SDK for the **public Habbo & Habbo Origins Web API** and Habbo **gamedata** files.

> **Disclaimer:** This is an **unofficial**, community-made library. It is not affiliated with, endorsed by, or in any way associated with [Sulake Oy](https://www.sulake.com) or the Habbo brand. It simply wraps the publicly available Habbo Web API into typed, reusable classes. All game content, trademarks, and API data belong to their respective owners.

[![npm](https://img.shields.io/badge/npm-%40jorgeserrano26%2Fhabbo--sdk-red)](https://www.npmjs.com/package/@jorgeserrano26/habbo-sdk)
[![version](https://img.shields.io/badge/version-1.0.0--beta.1-yellow)](#versioning)
[![Tests](https://img.shields.io/badge/tests-184%20passed-brightgreen)](#testing)
[![Coverage](https://img.shields.io/badge/coverage-100%25-brightgreen)](#testing)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18-green)](https://nodejs.org)
[![ESM](https://img.shields.io/badge/module-ESM-orange)](#build)
[![License](https://img.shields.io/badge/license-MIT-lightgrey)](#license)

---

## Table of contents

- [Features](#features)
- [Requirements](#requirements)
- [Installation](#installation)
- [Quick start](#quick-start)
- [Configuration](#configuration)
- [Available hotels](#available-hotels-habbohotel)
- [API reference](#api-reference)
  - [HabboClient — modern Habbo API](#habbo-client--modern-habbo-api)
  - [HabboOriginsClient — Habbo Origins API](#habbooriginsclient--habbo-origins-api)
  - [GameDataClient — gamedata files](#gamedataclient--gamedata-files)
- [Error handling](#error-handling)
- [Retries & backoff](#retries--backoff)
- [Cancellation (AbortSignal)](#cancellation-abortsignal)
- [Extending the SDK](#extending-the-sdk)
- [Testing](#testing)
- [Build](#build)
- [Technologies & versions](#technologies--versions)
- [Reference links](#reference-links)
- [Versioning](#versioning)
- [License](#license)

---

## Features

- **One class per API area** — `HabboClient`, `HabboOriginsClient`, `GameDataClient`
- **One method per documented endpoint** — 27 methods total
- **Configurable per hotel** — just set `.es`, `.com.br`, etc. (see `HabboHotel` enum)
- **Strongly typed** — response interfaces, error hierarchy, and enums all exported
- **Zero runtime dependencies** — uses the platform's native `fetch` (Node ≥ 18, browsers, Deno, Bun)
- **Automatic retries with exponential backoff** — configurable, respects `Retry-After`
- **Per-attempt timeouts** and cooperative cancellation via `AbortSignal`
- **Resource-specific errors** — `UserNotFoundError`, `GroupNotFoundError`, etc. extend `HabboApiError`
- **Easy to extend** — all clients extend `BaseClient` and expose `this.http`

---

## Requirements

| Runtime | Minimum version |
|---------|----------------|
| Node.js | **18** (native `fetch`) |
| Bun | **1.0** |
| Deno | **1.28** |
| Browsers | Any modern browser with `fetch` |

---

## Installation

```bash
# npm
npm install @jorgeserrano26/habbo-sdk

# pnpm
pnpm add @jorgeserrano26/habbo-sdk

# yarn
yarn add @jorgeserrano26/habbo-sdk

# bun
bun add @jorgeserrano26/habbo-sdk
```

> **Beta notice:** The current release is `1.0.0-beta.1`. The public API is stable and fully tested, but minor things may change before `1.0.0`. Pin the version if you need stability: `"@jorgeserrano26/habbo-sdk": "1.0.0-beta.1"`.

---

## Quick start

```ts
import { HabboSDK, HabboHotel } from '@jorgeserrano26/habbo-sdk';

// Create one SDK instance per hotel.
const sdk = new HabboSDK({ hotel: HabboHotel.ES }); // → https://www.habbo.es

// Modern Habbo API
const user = await sdk.habbo.getUserByName('SomeName');
console.log(user.uniqueId, user.figureString);

const profile = await sdk.habbo.getUserProfile(user.uniqueId);
console.log(profile.friends.length, profile.groups.length);

// Habbo Origins API
const skill = await sdk.origins.getPlayerSkill(user.uniqueId);
console.log(`Fishing level: ${skill.level}`);

const leaderboard = await sdk.origins.getSkillsLeaderboard();
console.log(leaderboard.entries[0]);

// Gamedata files (XML / key=value)
const figureXml   = await sdk.gamedata.getFigureData();       // XML string
const furniXml    = await sdk.gamedata.getFurniData();        // XML string
const vars        = await sdk.gamedata.getExternalVariablesMap(); // Record<string, string>
console.log(vars['flash.client.url']);
```

Switching hotels is one argument:

```ts
const br  = new HabboSDK({ hotel: HabboHotel.BR });   // https://www.habbo.com.br
const com = new HabboSDK({ hotel: HabboHotel.COM });   // https://www.habbo.com
```

---

## Configuration

Pass a `HabboClientConfig` object to `HabboSDK` (or to any individual client):

```ts
new HabboSDK({
  // Which hotel to target. Uses HabboHotel enum or a raw domain suffix.
  hotel: HabboHotel.ES,

  // Optional: fully-qualified base URL override (ignores `hotel` when set).
  baseUrl: 'https://www.habbo.es',

  // API key for Habbo Origins fishing-derby endpoints.
  apiKey: 'my-api-key',

  // Custom fetch implementation (defaults to globalThis.fetch).
  fetch: customFetch,

  // Extra headers merged into every request.
  headers: { 'X-App': 'my-app/1.0' },

  // Per-attempt request timeout in milliseconds. Default: 30 000.
  timeoutMs: 15_000,

  // Automatic retry configuration (see "Retries & backoff").
  retry: {
    retries: 2,                                     // max retries after initial attempt
    baseDelayMs: 500,                               // backoff base (ms)
    maxDelayMs: 10_000,                             // backoff cap (ms)
    retryableStatuses: [429, 500, 502, 503, 504],   // which HTTP codes to retry
    retryOnTimeout: true,                           // retry per-attempt timeouts
    jitter: true,                                   // randomise delay (thundering-herd prevention)
  },
});
```

Each individual client also accepts the same config:

```ts
import { HabboClient, GameDataClient, HabboHotel } from '@jorgeserrano26/habbo-sdk';

const habbo    = new HabboClient({ hotel: HabboHotel.FR });
const gamedata = new GameDataClient({ hotel: HabboHotel.DE });
```

---

## Available hotels (`HabboHotel`)

| Enum value | Domain |
|-----------|--------|
| `HabboHotel.COM` | `www.habbo.com` |
| `HabboHotel.BR`  | `www.habbo.com.br` |
| `HabboHotel.DE`  | `www.habbo.de` |
| `HabboHotel.ES`  | `www.habbo.es` |
| `HabboHotel.FI`  | `www.habbo.fi` |
| `HabboHotel.FR`  | `www.habbo.fr` |
| `HabboHotel.IT`  | `www.habbo.it` |
| `HabboHotel.NL`  | `www.habbo.nl` |
| `HabboHotel.TR`  | `www.habbo.com.tr` |

You can also pass any raw suffix string: `new HabboSDK({ hotel: 'com.tr' })`.

---

## API reference

All methods accept an optional trailing **options** object with:

| Field | Type | Description |
|-------|------|-------------|
| `signal` | `AbortSignal` | Cancel the request |
| `headers` | `Record<string, string>` | Per-request extra headers |

### `HabboSDK` facade

```ts
const sdk = new HabboSDK(config);

sdk.habbo      // HabboClient
sdk.origins    // HabboOriginsClient
sdk.gamedata   // GameDataClient
sdk.http       // shared HttpClient (advanced use)
sdk.baseUrl    // resolved base URL string
```

---

### Habbo Client — modern Habbo API

`sdk.habbo` / `new HabboClient(config)`

#### Service

| Method | Endpoint |
|--------|---------|
| `ping(options?)` | `GET /api/public/ping` |

#### Achievements

| Method | Endpoint |
|--------|---------|
| `getAchievements(options?)` | `GET /api/public/achievements` |
| `getUserAchievements(uniqueId, options?)` | `GET /api/public/achievements/{id}` |

#### Badges

| Method | Endpoint |
|--------|---------|
| `getBadgeOwners(badgeCode, options?)` | `GET /api/public/badge/owners/{badgeCode}` |

#### Groups

| Method | Endpoint |
|--------|---------|
| `getGroup(groupId, options?)` | `GET /api/public/groups/{id}` |
| `getGroupMembers(groupId, options?)` | `GET /api/public/groups/{id}/members` |

#### Rooms

| Method | Endpoint |
|--------|---------|
| `getRoom(roomId, options?)` | `GET /api/public/rooms/{roomId}` |

#### Lists

| Method | Endpoint |
|--------|---------|
| `getHotLooks(options?)` | `GET /api/public/lists/hotlooks` |

#### Users

| Method | Endpoint | Notes |
|--------|---------|-------|
| `getUserByName(name, options?)` | `GET /api/public/users?name=` | Supports `ifNoneMatch` ETag |
| `getUserById(uniqueId, options?)` | `GET /api/public/users/{id}` | Supports `ifNoneMatch` ETag |
| `getUserProfile(uniqueId, options?)` | `GET /api/public/users/{id}/profile` | Full profile with friends, groups, badges, rooms |
| `getUserFriends(uniqueId, options?)` | `GET /api/public/users/{id}/friends` | |
| `getUserGroups(uniqueId, options?)` | `GET /api/public/users/{id}/groups` | |
| `getUserRooms(uniqueId, options?)` | `GET /api/public/users/{id}/rooms` | |
| `getUserBadges(uniqueId, options?)` | `GET /api/public/users/{id}/badges` | |

`ifNoneMatch` sends an `If-None-Match` header; a `304` response resolves to `undefined`.

#### Marketplace

| Method | Endpoint |
|--------|---------|
| `getMarketplaceStatsBatch(request, options?)` | `POST /api/public/marketplace/stats/batch` |

```ts
const stats = await sdk.habbo.getMarketplaceStatsBatch({
  roomItems: [{ item: 'throne' }],
  wallItems: [{ item: 'rare_dragonlamp' }],
});
```

---

### `HabboOriginsClient` — Habbo Origins API

`sdk.origins` / `new HabboOriginsClient(config)`

#### Users

| Method | Endpoint |
|--------|---------|
| `getHabboIdByPlayerId(uniquePlayerId, options?)` | `GET /api/public/users/by-playerId/{uniquePlayerId}` |

#### Matches

| Method | Endpoint | Options |
|--------|---------|---------|
| `getMatchIdsByPlayer(uniquePlayerId, options?)` | `GET /api/public/matches/v1/{uniquePlayerId}/ids` | `offset`, `limit`, `startTime`, `endTime` |
| `getMatch(uniqueMatchId, options?)` | `GET /api/public/matches/v1/{uniqueMatchId}` | |

#### Fishing derby

All derby endpoints require an `api_key`. Set it once in `config.apiKey` or override per call with `options.apiKey`.

| Method | Endpoint |
|--------|---------|
| `getDerbyIdsByPlayer(uniquePlayerId, options?)` | `GET /api/public/minigame/derby/v1/{uniquePlayerId}/ids` |
| `getDerby(uniqueDerbyId, options?)` | `GET /api/public/minigame/derby/v1/{uniqueDerbyId}` |
| `getDerbyStatus(options?)` | `GET /api/public/minigame/derby/v1/status` |

#### Skills

| Method | Endpoint |
|--------|---------|
| `getPlayerSkill(uniquePlayerId, skillType?, options?)` | `GET /api/public/skills/{uniquePlayerId}` |
| `getSkillsLeaderboard(skillType?, options?)` | `GET /api/public/skills/leaderboard` |

`skillType` defaults to `SkillType.Fishing` (`"FISHING"`).

---

### `GameDataClient` — gamedata files

`sdk.gamedata` / `new GameDataClient(config)`

`GET /gamedata/{type}/{revision}` returns a `307` redirect to a hashed, immutable URL. The client follows the redirect and returns the file contents directly.

All methods default to `revision = 1` (always resolves to the current version).

| Method | File type | Returns |
|--------|-----------|---------|
| `getFigureData(revision?, options?)` | `figuredata` | XML string |
| `getProductData(revision?, options?)` | `productdata` | XML string |
| `getFurniData(revision?, options?)` | `furnidata_xml` | XML string |
| `getExternalVariables(revision?, options?)` | `external_variables` | Raw `key=value` text |
| `getExternalVariablesMap(revision?, options?)` | `external_variables` | `Record<string, string>` |
| `resolveUrl(type, revision?, options?)` | any | Resolved hashed URL string (no body download) |
| `fetchRaw(type, revision?, options?)` | any | Raw string contents |

```ts
import { GameDataType } from '@jorgeserrano26/habbo-sdk';

const url  = await sdk.gamedata.resolveUrl(GameDataType.FurniDataXml);
// → "https://www.habbo.es/gamedata/furnidata_xml/<hash>"

const vars = await sdk.gamedata.getExternalVariablesMap();
console.log(vars['flash.client.url']);
```

> Gamedata values differ per hotel — always use the same configured domain.

---

## Error handling

Non-2xx responses throw a typed subclass of `HabboApiError`. Timeouts throw `HabboTimeoutError`.

### Error hierarchy

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
 └─ HabboTimeoutError              — per-attempt timeout
```

All `HabboApiError` subclasses carry:

| Field | Type | Description |
|-------|------|-------------|
| `status` | `number` | HTTP status code |
| `statusText` | `string` | HTTP status text |
| `url` | `string` | Absolute URL requested |
| `body` | `unknown` | Parsed response body |
| `code` | `string \| undefined` | Machine-readable error code from body |

`HabboNotFoundError` additionally exposes `resource` (`HabboResource` enum) and `identifier` (the id/name that was looked up).

### Usage

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
    // err.identifier → "NonExistent"
    // err.resource   → HabboResource.User
    console.log(`User "${err.identifier}" not found.`);

  } else if (err instanceof HabboRateLimitError) {
    console.log(`Rate limited. Retry after ${err.retryAfterSeconds}s.`);

  } else if (err instanceof HabboTimeoutError) {
    console.log(`Timed out after ${err.timeoutMs}ms on ${err.url}`);

  } else if (err instanceof HabboApiError) {
    console.log(`API error ${err.status}: ${err.code}`);
  }
}
```

---

## Retries & backoff

The SDK automatically retries transient failures using exponential backoff with optional jitter.

**What is retried by default:**
- HTTP status codes `429`, `500`, `502`, `503`, `504`
- Network-level errors (`TypeError`, `Error` from `fetch`)
- Per-attempt timeouts (when `retryOnTimeout: true`)

**What is never retried:**
- `4xx` errors (except 429)
- Caller-initiated `AbortSignal` cancellation

**Backoff formula:** `delay = min(baseDelayMs × 2^attempt, maxDelayMs) × (0.5–1.0 jitter)`

A `Retry-After` header (numeric seconds) from the server overrides the computed delay.

```ts
new HabboSDK({
  retry: {
    retries: 3,           // 3 retries = 4 total attempts
    baseDelayMs: 500,
    maxDelayMs: 30_000,
    jitter: true,
    retryOnTimeout: true,
  },
});

// Disable retries entirely:
new HabboSDK({ retry: { retries: 0 } });
```

---

## Cancellation (`AbortSignal`)

Every method accepts a `signal` option. Cancellation is honored during the in-flight request **and** during the backoff wait between retries.

```ts
const controller = new AbortController();

// Cancel after 5 seconds
setTimeout(() => controller.abort(), 5_000);

try {
  const user = await sdk.habbo.getUserProfile('hhes-...', {
    signal: controller.signal,
  });
} catch (err) {
  if (err.name === 'AbortError') {
    console.log('Request cancelled.');
  }
}
```

---

## Extending the SDK

All clients extend `BaseClient`, which exposes `this.http` (an `HttpClient` instance). You can subclass any client to add custom methods:

```ts
import { HabboClient, HabboSDK, HabboHotel, UserNotFoundError } from '@jorgeserrano26/habbo-sdk';

class MyHabboClient extends HabboClient {
  /** Looks up a user by name; returns null if not found. */
  async findUser(name: string) {
    try {
      return await this.getUserByName(name);
    } catch (err) {
      if (err instanceof UserNotFoundError) return null;
      throw err;
    }
  }

  /** Call any endpoint directly through the shared HTTP layer. */
  customEndpoint<T>(path: string) {
    return this.http.request<T>({ path });
  }
}

// Use a custom HabboClient with the shared HttpClient from HabboSDK:
const sdk = new HabboSDK({ hotel: HabboHotel.ES });
const myClient = new MyHabboClient(sdk.http); // shares base URL, timeout, headers

const user = await myClient.findUser('NotAUser'); // → null
```

---

## Testing

```bash
# Run all tests
npm test          # or: pnpm test / bun test

# Watch mode
npm run test:watch

# Run with coverage report
npm run test:coverage
```

### Test suite summary

| File | Tests | Coverage |
|------|-------|----------|
| `enums.test.ts` | 5 | 100% |
| `errors.test.ts` | 33 | 100% |
| `http.test.ts` | 65 | 100% |
| `clients/base.test.ts` | 4 | 100% |
| `clients/habbo.test.ts` | 23 | 100% |
| `clients/origins.test.ts` | 20 | 100% |
| `clients/gamedata.test.ts` | 23 | 100% |
| `sdk.test.ts` | 10 | 100% |
| **Total** | **183** | **100%** |

Coverage is enforced at 100% for statements, functions, branches and lines via `@vitest/coverage-v8`.

---

## Build

```bash
npm install
npm run build   # compiles to dist/ (ESM + .d.ts declaration maps)
```

Output:
```
dist/
├── index.js          # ESM entry point
├── index.d.ts        # TypeScript declarations
├── enums.js / .d.ts
├── errors.js / .d.ts
├── http.js   / .d.ts
├── sdk.js    / .d.ts
└── clients/
    ├── base.js / .d.ts
    ├── habbo.js / .d.ts
    ├── origins.js / .d.ts
    └── gamedata.js / .d.ts
```

---

## Technologies & versions

| Technology | Version | Role |
|-----------|---------|------|
| [TypeScript](https://www.typescriptlang.org) | `^5.5` | Language — strict mode, `verbatimModuleSyntax`, ESNext target |
| [Vitest](https://vitest.dev) | `^2.0` | Test runner with native ESM and TypeScript support |
| [@vitest/coverage-v8](https://vitest.dev/guide/coverage) | `^2.0` | V8-native code coverage |
| [Node.js](https://nodejs.org) | `≥ 18` | Runtime — provides global `fetch` |
| **ESM** | `"type": "module"` | Pure ES Modules (no CommonJS) |
| **Fetch API** | WHATWG | HTTP transport — no external HTTP library |

**Runtime dependencies: 0.** The SDK has no production dependencies.

---

## Reference links

### Habbo
- **Habbo Hotel** — https://www.habbo.com
- **Habbo Origins** — https://origins.habbo.com
- **Public Web API (Swagger UI)** — https://www.habbo.es/api/public/api-docs/
  - The spec is available per hotel, e.g. replace `.es` with `.com`, `.com.br`, etc.
- **Gamedata endpoints**
  - Figure data: `https://www.habbo.{hotel}/gamedata/figuredata/1`
  - Product data: `https://www.habbo.{hotel}/gamedata/productdata/1`
  - Furni data (XML): `https://www.habbo.{hotel}/gamedata/furnidata_xml/1`
  - External variables: `https://www.habbo.{hotel}/gamedata/external_variables/1`

### Standards & specs
- **WHATWG Fetch API** — https://fetch.spec.whatwg.org
- **AbortSignal** — https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal
- **OpenAPI 3.0** — https://spec.openapis.org/oas/v3.0.0

### Tools & docs
- **TypeScript** — https://www.typescriptlang.org/docs
- **Vitest** — https://vitest.dev/guide
- **Vitest Coverage (V8)** — https://vitest.dev/guide/coverage
- **Node.js Fetch** — https://nodejs.org/api/globals.html#fetch

---

## Versioning

This project follows [Semantic Versioning](https://semver.org) (`MAJOR.MINOR.PATCH`).

### Current status: Beta

The current version is **`1.0.0-beta.1`**, published under the `beta` dist-tag on npm. The public API is stable and fully tested, but the library may receive minor breaking changes before the final `1.0.0` release based on community feedback.

| npm tag | Version | Install |
|---------|---------|---------|
| `beta` *(current)* | `1.0.0-beta.1` | `npm install @jorgeserrano26/habbo-sdk@beta` |
| `latest` *(stable, not yet released)* | — | `npm install @jorgeserrano26/habbo-sdk` |

### When `1.0.0` stable drops

Once the API is confirmed, the `latest` tag will be promoted to `1.0.0` and `npm install @jorgeserrano26/habbo-sdk` will install it directly.

### Release cadence (after stable)

| Change | Version bump | Example |
|--------|-------------|---------|
| Bug fix, patch | `patch` | `1.0.0` → `1.0.1` |
| New method / feature, backward-compatible | `minor` | `1.0.0` → `1.1.0` |
| Breaking change (renamed method, removed export) | `major` | `1.0.0` → `2.0.0` |

---

## Disclaimer

This project is **not official** and has **no affiliation** with Sulake Oy or the Habbo brand. It is an independent, community-maintained library that adapts the publicly available Habbo Web API into typed JavaScript/TypeScript classes, making it easier to consume from any JS environment.

- All game assets, trademarks, and API content are the property of [Sulake Oy](https://www.sulake.com).
- Use of the Habbo public API is subject to Habbo's own [Terms of Service](https://www.habbo.com/corporate/terms-of-use).
- This library does not access any private or authenticated endpoints.

---

## License

MIT — see [LICENSE](LICENSE) for details.
