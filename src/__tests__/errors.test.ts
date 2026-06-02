import { describe, it, expect } from 'vitest';
import { HabboResource } from '../enums.js';
import {
  AchievementNotFoundError,
  BadgeNotFoundError,
  createHabboApiError,
  DerbyNotFoundError,
  GroupNotFoundError,
  HabboApiError,
  HabboBadRequestError,
  HabboForbiddenError,
  HabboNotFoundError,
  HabboRateLimitError,
  HabboServerError,
  HabboTimeoutError,
  HabboUnauthorizedError,
  MatchNotFoundError,
  PlayerNotFoundError,
  RoomNotFoundError,
  UserNotFoundError,
} from '../errors.js';

const BASE = { status: 400, statusText: 'Bad Request', url: 'https://x.test/', body: null };

describe('HabboApiError', () => {
  it('sets all fields from init', () => {
    const err = new HabboApiError({ ...BASE, status: 422, statusText: 'Unprocessable', code: 'validation-failed' });
    expect(err.status).toBe(422);
    expect(err.statusText).toBe('Unprocessable');
    expect(err.url).toBe(BASE.url);
    expect(err.body).toBeNull();
    expect(err.code).toBe('validation-failed');
  });

  it('generates a default message when none is provided', () => {
    const err = new HabboApiError(BASE);
    expect(err.message).toContain('400');
    expect(err.message).toContain('Bad Request');
    expect(err.message).toContain(BASE.url);
  });

  it('uses the provided message override', () => {
    const err = new HabboApiError({ ...BASE, message: 'custom message' });
    expect(err.message).toBe('custom message');
  });

  it('sets name to the class name', () => {
    expect(new HabboApiError(BASE).name).toBe('HabboApiError');
  });

  it('preserves instanceof chain through subclasses', () => {
    const err = new HabboBadRequestError(BASE);
    expect(err).toBeInstanceOf(HabboBadRequestError);
    expect(err).toBeInstanceOf(HabboApiError);
    expect(err).toBeInstanceOf(Error);
  });
});

describe('HabboNotFoundError', () => {
  it('stores resource and identifier', () => {
    const err = new HabboNotFoundError({
      ...BASE,
      status: 404,
      resource: HabboResource.User,
      identifier: 'TestUser',
    });
    expect(err.resource).toBe(HabboResource.User);
    expect(err.identifier).toBe('TestUser');
  });

  it('allows resource and identifier to be undefined', () => {
    const err = new HabboNotFoundError({ ...BASE, status: 404 });
    expect(err.resource).toBeUndefined();
    expect(err.identifier).toBeUndefined();
  });
});

describe('HabboRateLimitError', () => {
  it('stores retryAfterSeconds', () => {
    const err = new HabboRateLimitError({ ...BASE, status: 429, retryAfterSeconds: 30 });
    expect(err.retryAfterSeconds).toBe(30);
  });

  it('allows retryAfterSeconds to be undefined', () => {
    const err = new HabboRateLimitError({ ...BASE, status: 429 });
    expect(err.retryAfterSeconds).toBeUndefined();
  });
});

describe('HabboTimeoutError', () => {
  it('sets url, timeoutMs and message', () => {
    const err = new HabboTimeoutError('https://x.test/', 5000);
    expect(err.url).toBe('https://x.test/');
    expect(err.timeoutMs).toBe(5000);
    expect(err.message).toContain('5000ms');
    expect(err.name).toBe('HabboTimeoutError');
    expect(err).toBeInstanceOf(Error);
  });
});

describe('createHabboApiError', () => {
  const url = 'https://x.test/';

  it('returns HabboBadRequestError for status 400', () => {
    const err = createHabboApiError(400, 'Bad Request', url, null);
    expect(err).toBeInstanceOf(HabboBadRequestError);
    expect(err.status).toBe(400);
  });

  it('returns HabboUnauthorizedError for status 401', () => {
    const err = createHabboApiError(401, 'Unauthorized', url, null);
    expect(err).toBeInstanceOf(HabboUnauthorizedError);
  });

  it('returns HabboForbiddenError for status 403', () => {
    const err = createHabboApiError(403, 'Forbidden', url, null);
    expect(err).toBeInstanceOf(HabboForbiddenError);
  });

  it('returns HabboRateLimitError for status 429', () => {
    const err = createHabboApiError(429, 'Too Many Requests', url, null, { retryAfterSeconds: 10 });
    expect(err).toBeInstanceOf(HabboRateLimitError);
    expect((err as HabboRateLimitError).retryAfterSeconds).toBe(10);
  });

  it('returns HabboServerError for status 500', () => {
    expect(createHabboApiError(500, 'Internal Server Error', url, null)).toBeInstanceOf(HabboServerError);
  });

  it('returns HabboServerError for any 5xx status', () => {
    expect(createHabboApiError(503, 'Service Unavailable', url, null)).toBeInstanceOf(HabboServerError);
  });

  it('returns generic HabboApiError for unknown status codes', () => {
    const err = createHabboApiError(409, 'Conflict', url, null);
    expect(err.constructor).toBe(HabboApiError);
    expect(err.status).toBe(409);
  });

  describe('404 — resource-specific not-found errors', () => {
    const notFoundBase = { status: 404, statusText: 'Not Found', url };

    it.each([
      [HabboResource.User, UserNotFoundError],
      [HabboResource.Group, GroupNotFoundError],
      [HabboResource.Room, RoomNotFoundError],
      [HabboResource.Badge, BadgeNotFoundError],
      [HabboResource.Achievement, AchievementNotFoundError],
      [HabboResource.Match, MatchNotFoundError],
      [HabboResource.Derby, DerbyNotFoundError],
      [HabboResource.Player, PlayerNotFoundError],
    ] as const)(
      'returns %s → %s',
      (resource, ExpectedClass) => {
        const err = createHabboApiError(404, 'Not Found', url, null, { resource, identifier: 'abc' });
        expect(err).toBeInstanceOf(ExpectedClass);
        expect(err).toBeInstanceOf(HabboNotFoundError);
        const notFound = err as HabboNotFoundError;
        expect(notFound.resource).toBe(resource);
        expect(notFound.identifier).toBe('abc');
        expect(notFound.message).toContain('"abc"');
        expect(notFound.message).toContain('(404)');
      },
    );

    it('returns HabboNotFoundError when no resource is given', () => {
      const err = createHabboApiError(404, 'Not Found', url, null);
      expect(err.constructor).toBe(HabboNotFoundError);
      const notFound = err as HabboNotFoundError;
      expect(notFound.resource).toBeUndefined();
      expect(notFound.identifier).toBeUndefined();
    });

    it('uses default message when resource given but no identifier', () => {
      const err = createHabboApiError(404, 'Not Found', url, null, { resource: HabboResource.User });
      const notFound = err as HabboNotFoundError;
      expect(notFound.message).toContain('404');
    });
  });

  describe('error code extraction from body', () => {
    it('extracts code from body.error', () => {
      const err = createHabboApiError(400, 'Bad Request', url, { error: 'invalid-param' });
      expect(err.code).toBe('invalid-param');
    });

    it('extracts code from body.errorCode', () => {
      const err = createHabboApiError(400, 'Bad Request', url, { errorCode: 'ERR_42' });
      expect(err.code).toBe('ERR_42');
    });

    it('extracts code from body.code', () => {
      const err = createHabboApiError(400, 'Bad Request', url, { code: 'bad-request' });
      expect(err.code).toBe('bad-request');
    });

    it('ignores non-string code values', () => {
      const err = createHabboApiError(400, 'Bad Request', url, { error: 42 });
      expect(err.code).toBeUndefined();
    });

    it('returns undefined code for non-object body', () => {
      expect(createHabboApiError(400, 'Bad Request', url, 'plain text').code).toBeUndefined();
      expect(createHabboApiError(400, 'Bad Request', url, null).code).toBeUndefined();
      expect(createHabboApiError(400, 'Bad Request', url, undefined).code).toBeUndefined();
    });

    it('body.error takes precedence over body.errorCode', () => {
      const err = createHabboApiError(400, 'Bad Request', url, { error: 'first', errorCode: 'second' });
      expect(err.code).toBe('first');
    });
  });
});
