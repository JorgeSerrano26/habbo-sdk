/**
 * Client for the Habbo Origins public Web API.
 *
 * Each method maps to a single documented Origins endpoint under
 * `/api/public`. The fishing-derby endpoints require an `api_key`, taken from
 * the SDK config (or overridden per request). Every method rejects with
 * {@link HabboApiError} on non-2xx responses or {@link HabboTimeoutError} on
 * timeout.
 */

import { HabboResource, SkillType } from '../enums.js';
import { BaseClient } from './base.js';
import type {
  ApiKeyOptions,
  DerbyDetails,
  DerbyListOptions,
  DerbyStatus,
  MatchDetails,
  MatchListOptions,
  PlayerSkill,
  RequestOptions,
  SkillsLeaderboard,
  SkillsLeaderboardOptions,
} from '../types.js';

export class HabboOriginsClient extends BaseClient {
  /* ------------------------------ Users -------------------------------- */

  /**
   * Resolves the unique Habbo id(s) associated with an Origins player id.
   *
   * `GET /api/public/users/by-playerId/{uniquePlayerId}`
   *
   * @param uniquePlayerId - The Origins unique player id.
   * @param options - Optional abort signal and per-request headers.
   * @returns The matching unique Habbo id(s).
   * @throws {HabboApiError} If the player is not found.
   */
  getHabboIdByPlayerId(
    uniquePlayerId: string,
    options: RequestOptions = {},
  ): Promise<string[]> {
    return this.http.request<string[]>({
      path: `/api/public/users/by-playerId/${encodeURIComponent(uniquePlayerId)}`,
      resource: HabboResource.Player,
      resourceId: uniquePlayerId,
      headers: options.headers,
      signal: options.signal,
    });
  }

  /* ----------------------------- Matches ------------------------------- */

  /**
   * Lists the match ids for a player, newest first.
   *
   * `GET /api/public/matches/v1/{uniquePlayerId}/ids`
   *
   * @param uniquePlayerId - The Origins unique player id.
   * @param options - Pagination (`offset`, `limit`) and time window
   *   (`startTime`, `endTime`, formatted `YYYY-MM-DD HH:mm:ss.SSS`), plus the
   *   usual abort signal and headers.
   * @returns The list of match ids.
   * @throws {HabboApiError} On a non-2xx response.
   */
  getMatchIdsByPlayer(
    uniquePlayerId: string,
    options: MatchListOptions = {},
  ): Promise<string[]> {
    return this.http.request<string[]>({
      path: `/api/public/matches/v1/${encodeURIComponent(uniquePlayerId)}/ids`,
      query: {
        offset: options.offset,
        limit: options.limit,
        start_time: options.startTime,
        end_time: options.endTime,
      },
      resource: HabboResource.Player,
      resourceId: uniquePlayerId,
      headers: options.headers,
      signal: options.signal,
    });
  }

  /**
   * Retrieves the full details of a single match.
   *
   * `GET /api/public/matches/v1/{uniqueMatchId}`
   *
   * @param uniqueMatchId - The unique match id.
   * @param options - Optional abort signal and per-request headers.
   * @returns The match metadata, info, participants and teams.
   * @throws {HabboApiError} If the match is not found.
   */
  getMatch(
    uniqueMatchId: string,
    options: RequestOptions = {},
  ): Promise<MatchDetails> {
    return this.http.request<MatchDetails>({
      path: `/api/public/matches/v1/${encodeURIComponent(uniqueMatchId)}`,
      resource: HabboResource.Match,
      resourceId: uniqueMatchId,
      headers: options.headers,
      signal: options.signal,
    });
  }

  /* ------------------------- Fishing derby ----------------------------- */

  /**
   * Lists the fishing-derby ids for a player.
   *
   * `GET /api/public/minigame/derby/v1/{uniquePlayerId}/ids`
   *
   * @param uniquePlayerId - The Origins unique player id.
   * @param options - Pagination, time window, and an optional `apiKey`
   *   override (falls back to the configured key), plus abort/headers.
   * @returns The list of fishing-derby ids.
   * @throws {HabboApiError} On a non-2xx response (e.g. missing/invalid key).
   */
  getDerbyIdsByPlayer(
    uniquePlayerId: string,
    options: DerbyListOptions = {},
  ): Promise<string[]> {
    return this.http.request<string[]>({
      path: `/api/public/minigame/derby/v1/${encodeURIComponent(uniquePlayerId)}/ids`,
      query: {
        offset: options.offset,
        limit: options.limit,
        start_time: options.startTime,
        end_time: options.endTime,
        api_key: this.resolveApiKey(options.apiKey),
      },
      resource: HabboResource.Player,
      resourceId: uniquePlayerId,
      headers: options.headers,
      signal: options.signal,
    });
  }

  /**
   * Retrieves the details of a single fishing derby.
   *
   * `GET /api/public/minigame/derby/v1/{uniqueDerbyId}`
   *
   * @param uniqueDerbyId - The unique derby id.
   * @param options - Optional `apiKey` override plus abort/headers.
   * @returns The fishing-derby details.
   * @throws {HabboApiError} On a non-2xx response (e.g. missing/invalid key).
   */
  getDerby(
    uniqueDerbyId: string,
    options: ApiKeyOptions = {},
  ): Promise<DerbyDetails> {
    return this.http.request<DerbyDetails>({
      path: `/api/public/minigame/derby/v1/${encodeURIComponent(uniqueDerbyId)}`,
      query: { api_key: this.resolveApiKey(options.apiKey) },
      resource: HabboResource.Derby,
      resourceId: uniqueDerbyId,
      headers: options.headers,
      signal: options.signal,
    });
  }

  /**
   * Retrieves the current fishing-derby status.
   *
   * `GET /api/public/minigame/derby/v1/status`
   *
   * @param options - Optional `apiKey` override plus abort/headers.
   * @returns The current fishing-derby status.
   * @throws {HabboApiError} On a non-2xx response (e.g. missing/invalid key).
   */
  getDerbyStatus(options: ApiKeyOptions = {}): Promise<DerbyStatus> {
    return this.http.request<DerbyStatus>({
      path: '/api/public/minigame/derby/v1/status',
      query: { api_key: this.resolveApiKey(options.apiKey) },
      headers: options.headers,
      signal: options.signal,
    });
  }

  /* ------------------------------ Skills ------------------------------- */

  /**
   * Retrieves a player's skill level and experience.
   *
   * `GET /api/public/skills/{uniquePlayerId}`
   *
   * @param uniquePlayerId - The Origins unique player id.
   * @param skillType - The skill to query. Defaults to {@link SkillType.Fishing}.
   * @param options - Optional abort signal and per-request headers.
   * @returns The player's level and experience for the skill.
   * @throws {HabboApiError} If the player or skill is not found.
   */
  getPlayerSkill(
    uniquePlayerId: string,
    skillType: SkillType = SkillType.Fishing,
    options: RequestOptions = {},
  ): Promise<PlayerSkill> {
    return this.http.request<PlayerSkill>({
      path: `/api/public/skills/${encodeURIComponent(uniquePlayerId)}`,
      query: { skillType },
      resource: HabboResource.Player,
      resourceId: uniquePlayerId,
      headers: options.headers,
      signal: options.signal,
    });
  }

  /**
   * Retrieves a page of the skills leaderboard.
   *
   * `GET /api/public/skills/leaderboard`
   *
   * @param skillType - The skill to rank by. Defaults to {@link SkillType.Fishing}.
   * @param options - Optional `page` number plus abort/headers.
   * @returns The leaderboard page with paging metadata.
   * @throws {HabboApiError} On a non-2xx response.
   */
  getSkillsLeaderboard(
    skillType: SkillType = SkillType.Fishing,
    options: SkillsLeaderboardOptions = {},
  ): Promise<SkillsLeaderboard> {
    return this.http.request<SkillsLeaderboard>({
      path: '/api/public/skills/leaderboard',
      query: { skillType, page: options.page },
      headers: options.headers,
      signal: options.signal,
    });
  }

  /* ----------------------------- helpers ------------------------------- */

  /** Returns the per-request key if given, otherwise the configured one. */
  private resolveApiKey(override?: string): string | undefined {
    return override ?? this.http.apiKey;
  }
}
