import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HabboClient } from '../../clients/habbo.js';
import { HabboHotel, HabboResource, HttpMethod } from '../../enums/index.js';

function makeClient() {
  const client = new HabboClient({ hotel: HabboHotel.ES, fetch: vi.fn() });
  const requestSpy = vi.spyOn(client.http, 'request').mockResolvedValue(undefined as never);
  return { client, requestSpy };
}

describe('HabboClient', () => {
  let client: HabboClient;
  let requestSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    ({ client, requestSpy } = makeClient());
  });

  // ── ping ─────────────────────────────────────────────────────────────────
  describe('ping', () => {
    it('calls GET /api/public/ping', async () => {
      await client.ping();
      expect(requestSpy).toHaveBeenCalledWith(
        expect.objectContaining({ path: '/api/public/ping' }),
      );
    });

    it('passes signal and headers', async () => {
      const signal = new AbortController().signal;
      await client.ping({ signal, headers: { 'X-H': '1' } });
      expect(requestSpy).toHaveBeenCalledWith(
        expect.objectContaining({ signal, headers: { 'X-H': '1' } }),
      );
    });
  });

  // ── achievements ─────────────────────────────────────────────────────────
  describe('getAchievements', () => {
    it('calls GET /api/public/achievements', async () => {
      await client.getAchievements();
      expect(requestSpy).toHaveBeenCalledWith(
        expect.objectContaining({ path: '/api/public/achievements' }),
      );
    });
  });

  describe('getUserAchievements', () => {
    it('calls GET /api/public/achievements/{id} with resource context', async () => {
      await client.getUserAchievements('hhes-abc123');
      expect(requestSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/api/public/achievements/hhes-abc123',
          resource: HabboResource.User,
          resourceId: 'hhes-abc123',
        }),
      );
    });

    it('encodes special characters in the id', async () => {
      await client.getUserAchievements('id with spaces');
      expect(requestSpy).toHaveBeenCalledWith(
        expect.objectContaining({ path: '/api/public/achievements/id%20with%20spaces' }),
      );
    });
  });

  // ── badges ────────────────────────────────────────────────────────────────
  describe('getBadgeOwners', () => {
    it('calls GET /api/public/badge/owners/{badgeCode}', async () => {
      await client.getBadgeOwners('ADM');
      expect(requestSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/api/public/badge/owners/ADM',
          resource: HabboResource.Badge,
          resourceId: 'ADM',
        }),
      );
    });
  });

  // ── groups ────────────────────────────────────────────────────────────────
  describe('getGroup', () => {
    it('calls GET /api/public/groups/{id}', async () => {
      await client.getGroup('g-1');
      expect(requestSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/api/public/groups/g-1',
          resource: HabboResource.Group,
          resourceId: 'g-1',
        }),
      );
    });
  });

  describe('getGroupMembers', () => {
    it('calls GET /api/public/groups/{id}/members', async () => {
      await client.getGroupMembers('g-1');
      expect(requestSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/api/public/groups/g-1/members',
          resource: HabboResource.Group,
          resourceId: 'g-1',
        }),
      );
    });
  });

  // ── rooms ─────────────────────────────────────────────────────────────────
  describe('getRoom', () => {
    it('calls GET /api/public/rooms/{roomId} with numeric id', async () => {
      await client.getRoom(42);
      expect(requestSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/api/public/rooms/42',
          resource: HabboResource.Room,
          resourceId: '42',
        }),
      );
    });

    it('accepts a string roomId', async () => {
      await client.getRoom('room-abc');
      expect(requestSpy).toHaveBeenCalledWith(
        expect.objectContaining({ path: '/api/public/rooms/room-abc' }),
      );
    });
  });

  // ── lists ─────────────────────────────────────────────────────────────────
  describe('getHotLooks', () => {
    it('calls GET /api/public/lists/hotlooks', async () => {
      await client.getHotLooks();
      expect(requestSpy).toHaveBeenCalledWith(
        expect.objectContaining({ path: '/api/public/lists/hotlooks' }),
      );
    });
  });

  // ── users ─────────────────────────────────────────────────────────────────
  describe('getUserByName', () => {
    it('calls GET /api/public/users with name query param', async () => {
      await client.getUserByName('Alice');
      expect(requestSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/api/public/users',
          query: { name: 'Alice' },
          resource: HabboResource.User,
          resourceId: 'Alice',
        }),
      );
    });

    it('sets If-None-Match header when ifNoneMatch is provided', async () => {
      await client.getUserByName('Alice', { ifNoneMatch: '"abc"' });
      expect(requestSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: { 'If-None-Match': '"abc"' },
        }),
      );
    });

    it('does not set If-None-Match when it is not provided', async () => {
      await client.getUserByName('Alice');
      const call = requestSpy.mock.calls[0]![0] as { headers?: Record<string, string> };
      expect(call.headers?.['If-None-Match']).toBeUndefined();
    });

    it('merges extra headers with If-None-Match', async () => {
      await client.getUserByName('Alice', {
        ifNoneMatch: '"v1"',
        headers: { 'X-Extra': 'yes' },
      });
      expect(requestSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: { 'If-None-Match': '"v1"', 'X-Extra': 'yes' },
        }),
      );
    });
  });

  describe('getUserById', () => {
    it('calls GET /api/public/users/{id}', async () => {
      await client.getUserById('hhes-abc');
      expect(requestSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/api/public/users/hhes-abc',
          resource: HabboResource.User,
          resourceId: 'hhes-abc',
        }),
      );
    });

    it('supports If-None-Match', async () => {
      await client.getUserById('hhes-abc', { ifNoneMatch: '"etag"' });
      expect(requestSpy).toHaveBeenCalledWith(
        expect.objectContaining({ headers: { 'If-None-Match': '"etag"' } }),
      );
    });
  });

  describe('getUserProfile', () => {
    it('calls GET /api/public/users/{id}/profile', async () => {
      await client.getUserProfile('hhes-abc');
      expect(requestSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/api/public/users/hhes-abc/profile',
          resource: HabboResource.User,
          resourceId: 'hhes-abc',
        }),
      );
    });
  });

  describe('getUserFriends', () => {
    it('calls GET /api/public/users/{id}/friends', async () => {
      await client.getUserFriends('hhes-abc');
      expect(requestSpy).toHaveBeenCalledWith(
        expect.objectContaining({ path: '/api/public/users/hhes-abc/friends' }),
      );
    });
  });

  describe('getUserGroups', () => {
    it('calls GET /api/public/users/{id}/groups', async () => {
      await client.getUserGroups('hhes-abc');
      expect(requestSpy).toHaveBeenCalledWith(
        expect.objectContaining({ path: '/api/public/users/hhes-abc/groups' }),
      );
    });
  });

  describe('getUserRooms', () => {
    it('calls GET /api/public/users/{id}/rooms', async () => {
      await client.getUserRooms('hhes-abc');
      expect(requestSpy).toHaveBeenCalledWith(
        expect.objectContaining({ path: '/api/public/users/hhes-abc/rooms' }),
      );
    });
  });

  describe('getUserBadges', () => {
    it('calls GET /api/public/users/{id}/badges', async () => {
      await client.getUserBadges('hhes-abc');
      expect(requestSpy).toHaveBeenCalledWith(
        expect.objectContaining({ path: '/api/public/users/hhes-abc/badges' }),
      );
    });
  });

  // ── marketplace ───────────────────────────────────────────────────────────
  describe('getMarketplaceStatsBatch', () => {
    it('calls POST /api/public/marketplace/stats/batch with the request body', async () => {
      const body = { roomItems: [{ item: 'throne' }] };
      await client.getMarketplaceStatsBatch(body);
      expect(requestSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          method: HttpMethod.POST,
          path: '/api/public/marketplace/stats/batch',
          body,
        }),
      );
    });
  });
});
