/**
 * Logical resource a request targets. Used to raise resource-specific,
 * controlled errors (e.g. `UserNotFoundError`) instead of a generic
 * `HabboNotFoundError` when the API answers `404`.
 */
export enum HabboResource {
  User = 'user',
  Group = 'group',
  Room = 'room',
  Badge = 'badge',
  Achievement = 'achievement',
  Match = 'match',
  Derby = 'derby',
  Player = 'player',
}
