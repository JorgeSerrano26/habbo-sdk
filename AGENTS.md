# AGENTS.md

Guidance for AI agents (and humans) contributing **to this repository**.
If you only want to *use* the published library, read [`docs/ai.md`](docs/ai.md)
or the [`habbo-sdk` skill](.claude/skills/habbo-sdk/SKILL.md) instead.

## What this is

`@jorgeserrano26/habbo-sdk` — an unofficial, type-safe, hotel-configurable SDK
for the public Habbo & Habbo Origins Web API and Habbo gamedata files.

- **Language:** TypeScript 5.x, strict mode, `verbatimModuleSyntax`, ESNext target.
- **Module system:** ESM only (`"type": "module"`). Every relative import **must** use an explicit `.js` extension (e.g. `import { X } from './lib/url.js'`), even though the source is `.ts`.
- **Runtime deps:** none. Uses the global `fetch`. Do not add runtime dependencies.
- **Test runner:** Vitest + `@vitest/coverage-v8`, coverage enforced at **100%** (lines/branches/functions/statements).

## Commands

```bash
npm install
npm run build          # tsc → dist/ (ESM + .d.ts + declaration maps)
npm test               # vitest run
npm run test:coverage  # vitest run --coverage (must stay at 100%)
npm run test:watch
```

Always run `npm run build` **and** `npm run test:coverage` before committing.
A change that drops coverage below 100% fails CI.

## Project layout

```
src/
├── index.ts          public barrel (exports the whole public API)
├── http.ts           HttpClient (retries, timeout, abort); re-exports buildBaseUrl
├── sdk.ts            HabboSDK facade
├── lib/              generic, reusable utils (string, url)
├── enums/            one enum (or close group) per file + index barrel
├── types/            type-only models, grouped by area + index barrel
├── errors/           error hierarchy (base, http, not-found, timeout, factory) + index
├── clients/          base, habbo, origins, gamedata, gamedata-hashes
└── parsers/          zero-dep XML/key=value parsers + index
src/__tests__/        mirrors src/ layout; one test file per source file
docs/                 human + AI documentation
.claude/skills/       portable skill shipped for consumer repos
```

## Conventions (follow these)

- **Small, focused files.** Split files that accumulate many enums/types/classes into a folder with one file per concern plus an `index.ts` barrel. Keep generic helpers in `lib/`.
- **No repeated literals.** Centralize shared strings as constants (e.g. `const API = '/api/public'` in the clients).
- **One method per documented endpoint.** Each client method maps to exactly one endpoint and carries a JSDoc block that includes the `METHOD /path` line.
- **Errors are typed.** Throw via `createHabboApiError` (the `HttpClient` already does this). Resource-specific 404s come from tagging a request with `resource` + `resourceId`.
- **Per-request options last.** Every public method ends with an options object (`{ signal?, headers?, ... }`).
- **Unreachable branches** that V8 instruments but cannot be hit are marked with a `/* v8 ignore ... */` comment and a reason — don't add these to dodge missing tests; only for genuinely unreachable code.

## How to add a new endpoint

1. Add response/request types under `src/types/` (extend the relevant area file; export from `types/index.ts` if a new file).
2. Add the method to the appropriate client in `src/clients/`, mapping it to one endpoint, with full JSDoc and the options object. Tag with `resource`/`resourceId` when a resource-specific 404 makes sense (add a new `HabboResource` + error subclass if needed).
3. Export any new public symbol from `src/index.ts`.
4. Add a test file / cases under `src/__tests__/` to keep coverage at 100% (use the helpers in `__tests__/helpers.ts` — `makeResponse`, `mockFetchSequence`, `mockFetchHanging`; note `304` is mocked as a plain object, not a real `Response`).
5. Document it: add the row to the matching page in `docs/`, and update `docs/ai.md` + `.claude/skills/habbo-sdk/SKILL.md` cheat sheets.
6. `npm run build && npm run test:coverage`.

## Keep docs in sync

When the public API changes, update **all** of: the relevant `docs/*.md` page,
`docs/ai.md`, and `.claude/skills/habbo-sdk/SKILL.md`. The README stays high-level.

## Git

- Branch off `main`; do not commit or push unless asked.
- End commit messages with the project's `Co-Authored-By` trailer.
- Don't bump the version or publish to npm (`1.0.0-beta.1`, `beta` dist-tag) without explicit instruction.
