import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HabboOriginsClient } from '../../clients/origins.js';
import { HabboHotel, HabboResource, SkillType } from '../../enums.js';

function makeClient(apiKey?: string) {
  const client = new HabboOriginsClient({ hotel: HabboHotel.ES, fetch: vi.fn(), apiKey });
  const requestSpy = vi.spyOn(client.http, 'request').mockResolvedValue(undefined as never);
  return { client, requestSpy };
}

describe('HabboOriginsClient', () => {
  let client: HabboOriginsClient;
  let requestSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    ({ client, requestSpy } = makeClient());
  });

  // ── users ─────────────────────────────────────────────────────────────────
  describe('getHabboIdByPlayerId', () => {
    it('calls GET /api/public/users/by-playerId/{id}', async () => {
      await client.getHabboIdByPlayerId('player-123');
      expect(requestSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/api/public/users/by-playerId/player-123',
          resource: HabboResource.Player,
          resourceId: 'player-123',
        }),
      );
    });

    it('encodes special characters in the player id', async () => {
      await client.getHabboIdByPlayerId('player id');
      expect(requestSpy).toHaveBeenCalledWith(
        expect.objectContaining({ path: '/api/public/users/by-playerId/player%20id' }),
      );
    });
  });

  // ── matches ───────────────────────────────────────────────────────────────
  describe('getMatchIdsByPlayer', () => {
    it('calls GET /api/public/matches/v1/{id}/ids', async () => {
      await client.getMatchIdsByPlayer('p-1');
      expect(requestSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/api/public/matches/v1/p-1/ids',
          resource: HabboResource.Player,
          resourceId: 'p-1',
        }),
      );
    });

    it('passes pagination and time-window query parameters', async () => {
      await client.getMatchIdsByPlayer('p-1', {
        offset: 10,
        limit: 5,
        startTime: '2024-01-01 00:00:00.000',
        endTime: '2024-12-31 23:59:59.000',
      });
      expect(requestSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          query: {
            offset: 10,
            limit: 5,
            start_time: '2024-01-01 00:00:00.000',
            end_time: '2024-12-31 23:59:59.000',
          },
        }),
      );
    });

    it('omits undefined pagination params', async () => {
      await client.getMatchIdsByPlayer('p-1');
      const call = requestSpy.mock.calls[0]![0] as { query: Record<string, unknown> };
      expect(call.query.offset).toBeUndefined();
      expect(call.query.limit).toBeUndefined();
    });
  });

  describe('getMatch', () => {
    it('calls GET /api/public/matches/v1/{matchId}', async () => {
      await client.getMatch('match-abc');
      expect(requestSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/api/public/matches/v1/match-abc',
          resource: HabboResource.Match,
          resourceId: 'match-abc',
        }),
      );
    });
  });

  // ── fishing derby ─────────────────────────────────────────────────────────
  describe('getDerbyIdsByPlayer', () => {
    it('calls GET /api/public/minigame/derby/v1/{id}/ids', async () => {
      await client.getDerbyIdsByPlayer('p-1');
      expect(requestSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/api/public/minigame/derby/v1/p-1/ids',
          resource: HabboResource.Player,
          resourceId: 'p-1',
        }),
      );
    });

    it('uses the configured api_key when no override is given', async () => {
      const { client: c, requestSpy: rs } = makeClient('sdk-key');
      await c.getDerbyIdsByPlayer('p-1');
      expect(rs).toHaveBeenCalledWith(
        expect.objectContaining({ query: expect.objectContaining({ api_key: 'sdk-key' }) }),
      );
    });

    it('uses the per-request apiKey override', async () => {
      const { client: c, requestSpy: rs } = makeClient('sdk-key');
      await c.getDerbyIdsByPlayer('p-1', { apiKey: 'override-key' });
      expect(rs).toHaveBeenCalledWith(
        expect.objectContaining({ query: expect.objectContaining({ api_key: 'override-key' }) }),
      );
    });

    it('passes all list options', async () => {
      await client.getDerbyIdsByPlayer('p-1', {
        offset: 0,
        limit: 20,
        startTime: '2024-01-01 00:00:00.000',
        endTime: '2024-06-01 00:00:00.000',
      });
      const call = requestSpy.mock.calls[0]![0] as { query: Record<string, unknown> };
      expect(call.query.offset).toBe(0);
      expect(call.query.limit).toBe(20);
    });
  });

  describe('getDerby', () => {
    it('calls GET /api/public/minigame/derby/v1/{derbyId}', async () => {
      await client.getDerby('derby-99');
      expect(requestSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/api/public/minigame/derby/v1/derby-99',
          resource: HabboResource.Derby,
          resourceId: 'derby-99',
        }),
      );
    });

    it('passes api_key from config', async () => {
      const { client: c, requestSpy: rs } = makeClient('my-key');
      await c.getDerby('derby-99');
      expect(rs).toHaveBeenCalledWith(
        expect.objectContaining({ query: { api_key: 'my-key' } }),
      );
    });

    it('uses the per-request apiKey override over the config', async () => {
      const { client: c, requestSpy: rs } = makeClient('sdk-key');
      await c.getDerby('derby-99', { apiKey: 'per-req-key' });
      expect(rs).toHaveBeenCalledWith(
        expect.objectContaining({ query: { api_key: 'per-req-key' } }),
      );
    });
  });

  describe('getDerbyStatus', () => {
    it('calls GET /api/public/minigame/derby/v1/status', async () => {
      await client.getDerbyStatus();
      expect(requestSpy).toHaveBeenCalledWith(
        expect.objectContaining({ path: '/api/public/minigame/derby/v1/status' }),
      );
    });

    it('passes api_key from config', async () => {
      const { client: c, requestSpy: rs } = makeClient('cfg-key');
      await c.getDerbyStatus();
      expect(rs).toHaveBeenCalledWith(
        expect.objectContaining({ query: expect.objectContaining({ api_key: 'cfg-key' }) }),
      );
    });

    it('uses per-request apiKey override', async () => {
      await client.getDerbyStatus({ apiKey: 'req-key' });
      expect(requestSpy).toHaveBeenCalledWith(
        expect.objectContaining({ query: expect.objectContaining({ api_key: 'req-key' }) }),
      );
    });
  });

  // ── skills ────────────────────────────────────────────────────────────────
  describe('getPlayerSkill', () => {
    it('calls GET /api/public/skills/{playerId} with default skill type', async () => {
      await client.getPlayerSkill('p-1');
      expect(requestSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/api/public/skills/p-1',
          query: { skillType: SkillType.Fishing },
          resource: HabboResource.Player,
          resourceId: 'p-1',
        }),
      );
    });

    it('accepts an explicit skillType', async () => {
      await client.getPlayerSkill('p-1', SkillType.Fishing);
      expect(requestSpy).toHaveBeenCalledWith(
        expect.objectContaining({ query: { skillType: 'FISHING' } }),
      );
    });
  });

  describe('getSkillsLeaderboard', () => {
    it('calls GET /api/public/skills/leaderboard with default skill type', async () => {
      await client.getSkillsLeaderboard();
      expect(requestSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/api/public/skills/leaderboard',
          query: { skillType: SkillType.Fishing, page: undefined },
        }),
      );
    });

    it('passes the page option', async () => {
      await client.getSkillsLeaderboard(SkillType.Fishing, { page: 3 });
      expect(requestSpy).toHaveBeenCalledWith(
        expect.objectContaining({ query: { skillType: 'FISHING', page: 3 } }),
      );
    });
  });
});
