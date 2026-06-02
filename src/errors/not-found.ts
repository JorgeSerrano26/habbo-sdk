/**
 * `404 Not Found` errors: the generic base plus resource-specific subclasses
 * (`UserNotFoundError`, `GroupNotFoundError`, …).
 */

import type { HabboResource } from '../enums/index.js';
import { HabboApiError, type HabboApiErrorInit } from './base.js';

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
