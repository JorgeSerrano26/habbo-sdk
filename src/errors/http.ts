/**
 * Status-specific {@link HabboApiError} subclasses that don't carry extra
 * resource context. (Resource-specific 404s live in `not-found.ts`.)
 */

import { HabboApiError, type HabboApiErrorInit } from './base.js';

/** `400 Bad Request`. */
export class HabboBadRequestError extends HabboApiError {}

/** `401 Unauthorized` (e.g. a missing or invalid API key). */
export class HabboUnauthorizedError extends HabboApiError {}

/** `403 Forbidden` (e.g. a private profile or hidden list). */
export class HabboForbiddenError extends HabboApiError {}

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
