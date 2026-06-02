/**
 * Factory that maps a failed HTTP response to the most specific
 * {@link HabboApiError} subclass.
 */

import { HabboResource } from '../enums/index.js';
import { capitalize } from '../lib/string.js';
import { HabboApiError, type HabboApiErrorInit } from './base.js';
import {
  HabboBadRequestError,
  HabboForbiddenError,
  HabboRateLimitError,
  HabboServerError,
  HabboUnauthorizedError,
} from './http.js';
import {
  AchievementNotFoundError,
  BadgeNotFoundError,
  DerbyNotFoundError,
  GroupNotFoundError,
  HabboNotFoundError,
  MatchNotFoundError,
  PlayerNotFoundError,
  RoomNotFoundError,
  UserNotFoundError,
} from './not-found.js';

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
