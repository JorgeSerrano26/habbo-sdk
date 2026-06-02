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

import { HabboResource } from './enums.js';

/** Fields used to construct a {@link HabboApiError}. */
export interface HabboApiErrorInit {
  /** HTTP status code returned by the API. */
  status: number;
  /** HTTP status text returned by the API. */
  statusText: string;
  /** Absolute URL that was requested. */
  url: string;
  /** Parsed response body (JSON when possible, otherwise raw text). */
  body: unknown;
  /** Machine-readable error code from the body (e.g. `"not-found"`), if any. */
  code?: string;
  /** Overrides the generated error message. */
  message?: string;
}

/**
 * Base error thrown when the Habbo API responds with a non-2xx status code.
 */
export class HabboApiError extends Error {
  /** HTTP status code returned by the API. */
  public readonly status: number;
  /** HTTP status text returned by the API. */
  public readonly statusText: string;
  /** Absolute URL that was requested. */
  public readonly url: string;
  /** Parsed response body (JSON when possible, otherwise raw text). */
  public readonly body: unknown;
  /** Machine-readable error code from the body (e.g. `"not-found"`), if any. */
  public readonly code?: string;

  constructor(init: HabboApiErrorInit) {
    super(
      init.message ??
        `Habbo API request failed: ${init.status} ${init.statusText} (${init.url})`,
    );
    this.name = new.target.name;
    this.status = init.status;
    this.statusText = init.statusText;
    this.url = init.url;
    this.body = init.body;
    this.code = init.code;
    // Restore the prototype chain (needed when targeting ES5/ES2015+ output).
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** `400 Bad Request`. */
export class HabboBadRequestError extends HabboApiError {}

/** `401 Unauthorized` (e.g. a missing or invalid API key). */
export class HabboUnauthorizedError extends HabboApiError {}

/** `403 Forbidden` (e.g. a private profile or hidden list). */
export class HabboForbiddenError extends HabboApiError {}

/** `404 Not Found`. Base class for all resource-specific not-found errors. */
export class HabboNotFoundError extends HabboApiError {
  /** The resource type that was not found, when known. */
  public readonly resource?: HabboResource;
  /** The identifier (id/name) that was looked up, when known. */
  public readonly identifier?: string;

  constructor(
    init: HabboApiErrorInit & {
      resource?: HabboResource;
      identifier?: string;
    },
  ) {
    super(init);
    this.resource = init.resource;
    this.identifier = init.identifier;
  }
}

/** A user (by name or unique id) was not found. */
export class UserNotFoundError extends HabboNotFoundError {}

/** A group was not found. */
export class GroupNotFoundError extends HabboNotFoundError {}

/** A room was not found. */
export class RoomNotFoundError extends HabboNotFoundError {}

/** A badge was not found. */
export class BadgeNotFoundError extends HabboNotFoundError {}

/** An achievement (or a user's achievements) was not found. */
export class AchievementNotFoundError extends HabboNotFoundError {}

/** A match was not found. */
export class MatchNotFoundError extends HabboNotFoundError {}

/** A fishing derby was not found. */
export class DerbyNotFoundError extends HabboNotFoundError {}

/** An Origins player was not found. */
export class PlayerNotFoundError extends HabboNotFoundError {}

/** `429 Too Many Requests`. */
export class HabboRateLimitError extends HabboApiError {
  /** Seconds to wait before retrying, parsed from the `Retry-After` header. */
  public readonly retryAfterSeconds?: number;

  constructor(init: HabboApiErrorInit & { retryAfterSeconds?: number }) {
    super(init);
    this.retryAfterSeconds = init.retryAfterSeconds;
  }
}

/** `5xx` server error. */
export class HabboServerError extends HabboApiError {}

/** Error thrown when a request is aborted by timeout. */
export class HabboTimeoutError extends Error {
  public readonly url: string;
  public readonly timeoutMs: number;

  constructor(url: string, timeoutMs: number) {
    super(`Habbo API request timed out after ${timeoutMs}ms (${url})`);
    this.name = 'HabboTimeoutError';
    this.url = url;
    this.timeoutMs = timeoutMs;
    Object.setPrototypeOf(this, HabboTimeoutError.prototype);
  }
}

/** Maps a resource type to its specific not-found error constructor. */
const NOT_FOUND_BY_RESOURCE: Record<
  HabboResource,
  typeof HabboNotFoundError
> = {
  [HabboResource.User]: UserNotFoundError,
  [HabboResource.Group]: GroupNotFoundError,
  [HabboResource.Room]: RoomNotFoundError,
  [HabboResource.Badge]: BadgeNotFoundError,
  [HabboResource.Achievement]: AchievementNotFoundError,
  [HabboResource.Match]: MatchNotFoundError,
  [HabboResource.Derby]: DerbyNotFoundError,
  [HabboResource.Player]: PlayerNotFoundError,
};

/** Extracts a machine-readable error code from a parsed response body. */
function extractCode(body: unknown): string | undefined {
  if (body && typeof body === 'object') {
    const record = body as Record<string, unknown>;
    const candidate = record['error'] ?? record['errorCode'] ?? record['code'];
    if (typeof candidate === 'string') return candidate;
  }
  return undefined;
}

/** Context describing what a failed request was targeting. */
export interface ErrorContext {
  resource?: HabboResource;
  identifier?: string;
  retryAfterSeconds?: number;
}

/**
 * Builds the most specific {@link HabboApiError} subclass for a failed
 * response, based on the status code and (for `404`s) the targeted resource.
 */
export function createHabboApiError(
  status: number,
  statusText: string,
  url: string,
  body: unknown,
  context: ErrorContext = {},
): HabboApiError {
  const code = extractCode(body);
  const base: HabboApiErrorInit = { status, statusText, url, body, code };

  switch (status) {
    case 400:
      return new HabboBadRequestError(base);
    case 401:
      return new HabboUnauthorizedError(base);
    case 403:
      return new HabboForbiddenError(base);
    case 404: {
      const { resource, identifier } = context;
      const message =
        resource && identifier
          ? `${capitalize(resource)} "${identifier}" was not found (404).`
          : undefined;
      const Ctor = resource ? NOT_FOUND_BY_RESOURCE[resource] : HabboNotFoundError;
      return new Ctor({ ...base, message, resource, identifier });
    }
    case 429:
      return new HabboRateLimitError({
        ...base,
        retryAfterSeconds: context.retryAfterSeconds,
      });
    default:
      if (status >= 500) return new HabboServerError(base);
      return new HabboApiError(base);
  }
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
