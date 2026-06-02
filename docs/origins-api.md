# Origins API — `HabboOriginsClient`

The Habbo Origins public Web API. Access via `sdk.origins` or
`new HabboOriginsClient(config)`. Every method maps to one endpoint under
`/api/public` and accepts an optional trailing [options object](README.md#conventions).

```ts
const sdk = new HabboSDK({ hotel: HabboHotel.COM });
const skill = await sdk.origins.getPlayerSkill('hhus-...');
```

## Users

| Method | Endpoint | Returns |
|--------|----------|---------|
| `getHabboIdByPlayerId(uniquePlayerId, options?)` | `GET /api/public/users/by-playerId/{uniquePlayerId}` | `string[]` — matching Habbo id(s). |

## Matches

| Method | Endpoint | Returns |
|--------|----------|---------|
| `getMatchIdsByPlayer(uniquePlayerId, options?)` | `GET /api/public/matches/v1/{uniquePlayerId}/ids` | `string[]` |
| `getMatch(uniqueMatchId, options?)` | `GET /api/public/matches/v1/{uniqueMatchId}` | `MatchDetails` |

`getMatchIdsByPlayer` options (`MatchListOptions`) extend the base options with:

| Field | Type | Maps to query | Description |
|-------|------|---------------|-------------|
| `offset` | `number` | `offset` | Pagination offset. |
| `limit` | `number` | `limit` | Page size. |
| `startTime` | `string` | `start_time` | Window start (`YYYY-MM-DD HH:mm:ss.SSS`). |
| `endTime` | `string` | `end_time` | Window end. |

## Fishing derby

All derby endpoints require an `api_key`. Set it once in `config.apiKey`, or
override per call with `options.apiKey`.

| Method | Endpoint | Returns |
|--------|----------|---------|
| `getDerbyIdsByPlayer(uniquePlayerId, options?)` | `GET /api/public/minigame/derby/v1/{uniquePlayerId}/ids` | `string[]` |
| `getDerby(uniqueDerbyId, options?)` | `GET /api/public/minigame/derby/v1/{uniqueDerbyId}` | `DerbyDetails` |
| `getDerbyStatus(options?)` | `GET /api/public/minigame/derby/v1/status` | `DerbyStatus` |

`getDerbyIdsByPlayer` accepts the same pagination/time-window fields as
`getMatchIdsByPlayer`, plus `apiKey`. `getDerby` and `getDerbyStatus` accept
`apiKey` (`ApiKeyOptions`).

```ts
const sdk = new HabboSDK({ hotel: HabboHotel.COM, apiKey: 'my-key' });
const status = await sdk.origins.getDerbyStatus();
// or override per call:
const derby = await sdk.origins.getDerby('id', { apiKey: 'other-key' });
```

## Skills

| Method | Endpoint | Returns |
|--------|----------|---------|
| `getPlayerSkill(uniquePlayerId, skillType?, options?)` | `GET /api/public/skills/{uniquePlayerId}` | `PlayerSkill` |
| `getSkillsLeaderboard(skillType?, options?)` | `GET /api/public/skills/leaderboard` | `SkillsLeaderboard` |

`skillType` defaults to `SkillType.Fishing` (`"FISHING"`). `getSkillsLeaderboard`
options accept a `page` number.

```ts
import { SkillType } from '@jorgeserrano26/habbo-sdk';

const skill = await sdk.origins.getPlayerSkill('hhus-...', SkillType.Fishing);
const board = await sdk.origins.getSkillsLeaderboard(SkillType.Fishing, { page: 2 });
```

---

See [errors](errors.md) for exceptions (e.g. `PlayerNotFoundError`,
`MatchNotFoundError`, `DerbyNotFoundError`).
