/**
 * Error hierarchy for the Habbo SDK.
 *
 * ```text
 * Error
 *  └─ HabboApiError                (any non-2xx response)
 *      ├─ HabboBadRequestError     (400)
 *      ├─ HabboUnauthorizedError   (401)
 *      ├─ HabboForbiddenError      (403)
 *      ├─ HabboNotFoundError       (404)
 *      │   ├─ UserNotFoundError
 *      │   ├─ GroupNotFoundError
 *      │   ├─ RoomNotFoundError
 *      │   ├─ BadgeNotFoundError
 *      │   ├─ AchievementNotFoundError
 *      │   ├─ MatchNotFoundError
 *      │   ├─ DerbyNotFoundError
 *      │   └─ PlayerNotFoundError
 *      ├─ HabboRateLimitError      (429)
 *      └─ HabboServerError         (>= 500)
 *  └─ HabboTimeoutError            (request timed out)
 * ```
 *
 * Catch the specific subclass you care about, or {@link HabboApiError} for any
 * API failure:
 *
 * ```ts
 * import { UserNotFoundError, HabboApiError } from 'habbo-sdk';
 *
 * try {
 *   await sdk.habbo.getUserByName('nope');
 * } catch (err) {
 *   if (err instanceof UserNotFoundError) {
 *     console.log(`No such user: ${err.identifier}`);
 *   } else if (err instanceof HabboApiError) {
 *     console.log(err.status, err.code);
 *   }
 * }
 * ```
 */

export { HabboApiError } from './base.js';
export type { HabboApiErrorInit } from './base.js';
export {
  HabboBadRequestError,
  HabboUnauthorizedError,
  HabboForbiddenError,
  HabboRateLimitError,
  HabboServerError,
} from './http.js';
export {
  HabboNotFoundError,
  UserNotFoundError,
  GroupNotFoundError,
  RoomNotFoundError,
  BadgeNotFoundError,
  AchievementNotFoundError,
  MatchNotFoundError,
  DerbyNotFoundError,
  PlayerNotFoundError,
} from './not-found.js';
export { HabboTimeoutError } from './timeout.js';
export { createHabboApiError } from './factory.js';
export type { ErrorContext } from './factory.js';
