# @jorgeserrano26/habbo-sdk

> Type-safe, hotel-configurable JavaScript/TypeScript SDK for the **public Habbo & Habbo Origins Web API** and Habbo **gamedata** files.

[![npm](https://img.shields.io/badge/npm-%40jorgeserrano26%2Fhabbo--sdk-red)](https://www.npmjs.com/package/@jorgeserrano26/habbo-sdk)
[![version](https://img.shields.io/badge/version-1.0.0--beta.1-yellow)](#versioning)
[![Tests](https://img.shields.io/badge/tests-261%20passed-brightgreen)](#testing)
[![Coverage](https://img.shields.io/badge/coverage-100%25-brightgreen)](#testing)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18-green)](https://nodejs.org)
[![License](https://img.shields.io/badge/license-MIT-lightgrey)](#license)

> **Disclaimer:** This is an **unofficial**, community-made library. It is not affiliated with, endorsed by, or associated with [Sulake Oy](https://www.sulake.com) or the Habbo brand. It simply wraps the publicly available Habbo Web API into typed, reusable classes.

---

## What is it?

A thin, fully-typed wrapper over the public Habbo API. You pick a hotel (`.es`, `.com.br`, …), and you get **one class per API area** with **one method per endpoint** — no auth dance, no manual URL building, typed responses and typed errors.

- 🧩 **3 clients + 1 helper** — Habbo API, Habbo Origins API, Gamedata, and a hashed-gamedata helper.
- 🌍 **Configurable per hotel** — switch domains with a single argument.
- 🛟 **Typed errors** — `UserNotFoundError`, `HabboRateLimitError`, … all extend `HabboApiError`.
- 🔁 **Retries + timeouts + `AbortSignal`** — built in, configurable.
- 📦 **Zero runtime dependencies** — native `fetch` (Node ≥ 18, browsers, Deno, Bun).

---

## Install

```bash
npm install @jorgeserrano26/habbo-sdk@beta
# or: pnpm add / yarn add / bun add
```

> Current release is `1.0.0-beta.1` (published under the `beta` tag). See [versioning](#versioning).

---

## How to use it?

```ts
import { HabboSDK, HabboHotel } from '@jorgeserrano26/habbo-sdk';

// 1. Create one SDK per hotel.
const sdk = new HabboSDK({ hotel: HabboHotel.ES }); // → https://www.habbo.es

// 2. Call any endpoint through the matching client.
const user    = await sdk.habbo.getUserByName('SomeName');
const profile = await sdk.habbo.getUserProfile(user.uniqueId);
const skill   = await sdk.origins.getPlayerSkill(user.uniqueId);
const furni   = await sdk.gamedata.getParsedFurniData();

console.log(user.figureString, profile.friends.length, skill.level);
```

Switching hotels is one argument:

```ts
const br = new HabboSDK({ hotel: HabboHotel.BR });   // https://www.habbo.com.br
```

---

## The clients

The `HabboSDK` facade exposes everything, with a shared HTTP layer (retries, timeouts, headers):

| Accessor | Class | What it's for | Docs |
|----------|-------|---------------|------|
| `sdk.habbo` | `HabboClient` | Modern Habbo Web API — users, profiles, friends, groups, rooms, badges, achievements, marketplace. | [Habbo API →](docs/habbo-api.md) |
| `sdk.origins` | `HabboOriginsClient` | Habbo Origins API — player lookup, matches, fishing derby, and skills leaderboards. | [Origins API →](docs/origins-api.md) |
| `sdk.gamedata` | `GameDataClient` | Habbo gamedata files — figuredata, furnidata, productdata, external variables/texts, client URLs, asset hashes. Raw XML or parsed objects. | [Gamedata →](docs/gamedata.md) |
| — | `GameDataHashedClient` | Helper for loading **several** gamedata files efficiently: fetch the hash table once, then hit the CDN directly (no 307 redirects). | [Gamedata Hashes →](docs/gamedata-hashes.md) |

> **Gamedata: which one?** `GameDataClient` resolves the file hash **automatically**
> (the server redirects each request via a `307`) — best for one or two files.
> `GameDataHashedClient` is **for managing the hashes yourself**: fetch them once
> from `/gamedata/hashes`, then load every file straight from the CDN — best when
> you need several files from the same hotel. See [the comparison](docs/gamedata.md#which-client-should-i-use).

📚 **Full method reference (every method → exact Habbo endpoint) lives in [`docs/`](docs/).**

| Topic | Description |
|-------|-------------|
| [Configuration](docs/configuration.md) | All `HabboClientConfig` options, hotels, retries, timeouts, headers. |
| [Habbo API](docs/habbo-api.md) | `HabboClient` — every method and endpoint. |
| [Origins API](docs/origins-api.md) | `HabboOriginsClient` — every method and endpoint. |
| [Gamedata](docs/gamedata.md) | `GameDataClient` — files, hashes, client URLs, parsers. |
| [Gamedata Hashes](docs/gamedata-hashes.md) | `GameDataHashedClient` — efficient multi-asset loading. |
| [Errors](docs/errors.md) | The full error hierarchy and how to handle it. |

---

## Errors

Non-2xx responses throw a typed subclass of `HabboApiError`; timeouts throw `HabboTimeoutError`:

```ts
import { UserNotFoundError, HabboRateLimitError } from '@jorgeserrano26/habbo-sdk';

try {
  await sdk.habbo.getUserByName('NonExistent');
} catch (err) {
  if (err instanceof UserNotFoundError) console.log(`Not found: ${err.identifier}`);
  else if (err instanceof HabboRateLimitError) console.log(`Retry after ${err.retryAfterSeconds}s`);
  else throw err;
}
```

See [`docs/errors.md`](docs/errors.md) for the full hierarchy.

---

## Available hotels

| Enum | Domain | | Enum | Domain |
|------|--------|---|------|--------|
| `HabboHotel.COM` | `www.habbo.com` | | `HabboHotel.FR` | `www.habbo.fr` |
| `HabboHotel.BR` | `www.habbo.com.br` | | `HabboHotel.IT` | `www.habbo.it` |
| `HabboHotel.DE` | `www.habbo.de` | | `HabboHotel.NL` | `www.habbo.nl` |
| `HabboHotel.ES` | `www.habbo.es` | | `HabboHotel.TR` | `www.habbo.com.tr` |
| `HabboHotel.FI` | `www.habbo.fi` | | | |

These 9 are the only hotels with an active public API. You can also pass a raw suffix: `new HabboSDK({ hotel: 'com.tr' })`. See [configuration](docs/configuration.md#hotels).

---

## Testing

```bash
npm test              # run all tests
npm run test:coverage # with coverage report
```

**261 tests, 100% coverage** (statements, branches, functions, lines), enforced via `@vitest/coverage-v8`.

---

## Build

```bash
npm install
npm run build   # compiles to dist/ (ESM + .d.ts declaration maps)
```

---

## Versioning

Follows [Semantic Versioning](https://semver.org). Current version: **`1.0.0-beta.1`**, published under the `beta` dist-tag. The public API is stable and fully tested, but may receive minor breaking changes before final `1.0.0`.

| npm tag | Version | Install |
|---------|---------|---------|
| `beta` *(current)* | `1.0.0-beta.1` | `npm install @jorgeserrano26/habbo-sdk@beta` |
| `latest` *(not yet released)* | — | `npm install @jorgeserrano26/habbo-sdk` |

---

## Disclaimer

This project is **not official** and has **no affiliation** with Sulake Oy or the Habbo brand. It is an independent, community-maintained library that adapts the publicly available Habbo Web API into typed classes.

- All game assets, trademarks, and API content are the property of [Sulake Oy](https://www.sulake.com).
- Use of the Habbo public API is subject to Habbo's own [Terms of Service](https://www.habbo.com/corporate/terms-of-use).
- This library does not access any private or authenticated endpoints.

---

## License

MIT — see [LICENSE](LICENSE).
