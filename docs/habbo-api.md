# Habbo API — `HabboClient`

The modern Habbo public Web API. Access via `sdk.habbo` or
`new HabboClient(config)`. Every method maps to one endpoint under
`/api/public` and accepts an optional trailing [options object](README.md#conventions).

```ts
const sdk = new HabboSDK({ hotel: HabboHotel.ES });
const user = await sdk.habbo.getUserByName('SomeName');
```

## Service

| Method | Endpoint | Returns |
|--------|----------|---------|
| `ping(options?)` | `GET /api/public/ping` | `unknown` — resolves when the API is reachable. |

## Achievements

| Method | Endpoint | Returns |
|--------|----------|---------|
| `getAchievements(options?)` | `GET /api/public/achievements` | `Achievement[]` |
| `getUserAchievements(uniqueId, options?)` | `GET /api/public/achievements/{id}` | `Achievement[]` |

## Badges

| Method | Endpoint | Returns |
|--------|----------|---------|
| `getBadgeOwners(badgeCode, options?)` | `GET /api/public/badge/owners/{badgeCode}` | `BadgeOwners` |

## Groups

| Method | Endpoint | Returns |
|--------|----------|---------|
| `getGroup(groupId, options?)` | `GET /api/public/groups/{id}` | `Group` |
| `getGroupMembers(groupId, options?)` | `GET /api/public/groups/{id}/members` | `GroupMember[]` |

## Rooms

| Method | Endpoint | Returns |
|--------|----------|---------|
| `getRoom(roomId, options?)` | `GET /api/public/rooms/{roomId}` | `Room` |

## Lists

| Method | Endpoint | Returns |
|--------|----------|---------|
| `getHotLooks(options?)` | `GET /api/public/lists/hotlooks` | `HotLook[]` |

## Users

| Method | Endpoint | Returns | Notes |
|--------|----------|---------|-------|
| `getUserByName(name, options?)` | `GET /api/public/users?name=` | `User` | Supports `ifNoneMatch` ETag. |
| `getUserById(uniqueId, options?)` | `GET /api/public/users/{id}` | `User` | Supports `ifNoneMatch` ETag. |
| `getUserProfile(uniqueId, options?)` | `GET /api/public/users/{id}/profile` | `UserProfile` | Full profile: friends, groups, badges, rooms. |
| `getUserFriends(uniqueId, options?)` | `GET /api/public/users/{id}/friends` | `Friend[]` | |
| `getUserGroups(uniqueId, options?)` | `GET /api/public/users/{id}/groups` | `Group[]` | |
| `getUserRooms(uniqueId, options?)` | `GET /api/public/users/{id}/rooms` | `Room[]` | |
| `getUserBadges(uniqueId, options?)` | `GET /api/public/users/{id}/badges` | `UserBadge[]` | |

### Conditional requests (`ifNoneMatch`)

`getUserByName` and `getUserById` accept an `ifNoneMatch` option. It sends an
`If-None-Match` header; a `304 Not Modified` response resolves to `undefined`.

```ts
const fresh = await sdk.habbo.getUserById('hhes-...', { ifNoneMatch: etag });
if (fresh === undefined) {
  // not modified — keep your cached copy
}
```

## Marketplace

| Method | Endpoint | Returns |
|--------|----------|---------|
| `getMarketplaceStatsBatch(request, options?)` | `POST /api/public/marketplace/stats/batch` | `MarketplaceStatsBatchResponse` |

```ts
const stats = await sdk.habbo.getMarketplaceStatsBatch({
  roomItems: [{ item: 'throne' }],
  wallItems: [{ item: 'rare_dragonlamp' }],
});
```

---

See [errors](errors.md) for the exceptions these methods can throw (e.g.
`UserNotFoundError`, `GroupNotFoundError`, `RoomNotFoundError`,
`BadgeNotFoundError`, `AchievementNotFoundError`).
