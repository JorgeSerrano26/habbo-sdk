/**
 * Client for the modern Habbo public Web API.
 *
 * Each method maps to a single documented endpoint under `/api/public`.
 * Every method accepts an optional {@link RequestOptions} (`signal`, extra
 * `headers`) and rejects with {@link HabboApiError} on non-2xx responses or
 * {@link HabboTimeoutError} on timeout.
 */

import { HabboResource, HttpMethod } from '../enums/index.js';
import { BaseClient } from './base.js';
import type {
  Achievement,
  BadgeOwners,
  ConditionalRequestOptions,
  Friend,
  Group,
  GroupMember,
  HotLook,
  MarketplaceStatsBatchRequest,
  MarketplaceStatsBatchResponse,
  RequestOptions,
  Room,
  User,
  UserBadge,
  UserProfile,
} from '../types/index.js';

/** Common path prefix shared by every modern Habbo Web API endpoint. */
const API = '/api/public';

export class HabboClient extends BaseClient {
  /* ----------------------------- Service ------------------------------- */

  /**
   * Health-check endpoint.
   *
   * `GET /api/public/ping`
   *
   * @param options - Optional abort signal and per-request headers.
   * @returns Resolves (with an empty body) when the API is reachable.
   * @throws {HabboApiError} If the service is unavailable.
   */
  ping(options: RequestOptions = {}): Promise<unknown> {
    return this.http.request({
      path: `${API}/ping`,
      headers: options.headers,
      signal: options.signal,
    });
  }

  /* --------------------------- Achievements ---------------------------- */

  /**
   * Retrieves every achievement together with its level requirements.
   *
   * `GET /api/public/achievements`
   *
   * @param options - Optional abort signal and per-request headers.
   * @returns The full list of achievements.
   * @throws {HabboApiError} On a non-2xx response.
   */
  getAchievements(options: RequestOptions = {}): Promise<Achievement[]> {
    return this.http.request<Achievement[]>({
      path: `${API}/achievements`,
      headers: options.headers,
      signal: options.signal,
    });
  }

  /**
   * Retrieves the achievements unlocked by a specific user.
   *
   * `GET /api/public/achievements/{id}`
   *
   * @param uniqueId - The user's unique id (`hhxx-...`).
   * @param options - Optional abort signal and per-request headers.
   * @returns The user's achievements with level progress.
   * @throws {HabboApiError} If the user is not found (404).
   */
  getUserAchievements(
    uniqueId: string,
    options: RequestOptions = {},
  ): Promise<Achievement[]> {
    return this.http.request<Achievement[]>({
      path: `${API}/achievements/${encodeURIComponent(uniqueId)}`,
      resource: HabboResource.User,
      resourceId: uniqueId,
      headers: options.headers,
      signal: options.signal,
    });
  }

  /* ------------------------------ Badges ------------------------------- */

  /**
   * Retrieves ownership details for a badge code.
   *
   * `GET /api/public/badge/owners/{badgeCode}`
   *
   * @param badgeCode - The badge code (e.g. `ADM`).
   * @param options - Optional abort signal and per-request headers.
   * @returns The badge name, description and total owner count.
   * @throws {HabboApiError} On a non-2xx response.
   */
  getBadgeOwners(
    badgeCode: string,
    options: RequestOptions = {},
  ): Promise<BadgeOwners> {
    return this.http.request<BadgeOwners>({
      path: `${API}/badge/owners/${encodeURIComponent(badgeCode)}`,
      resource: HabboResource.Badge,
      resourceId: badgeCode,
      headers: options.headers,
      signal: options.signal,
    });
  }

  /* ------------------------------ Groups ------------------------------- */

  /**
   * Retrieves a single group by its id.
   *
   * `GET /api/public/groups/{id}`
   *
   * @param groupId - The group's unique id.
   * @param options - Optional abort signal and per-request headers.
   * @returns The group details.
   * @throws {HabboApiError} If the group is not found (404).
   */
  getGroup(groupId: string, options: RequestOptions = {}): Promise<Group> {
    return this.http.request<Group>({
      path: `${API}/groups/${encodeURIComponent(groupId)}`,
      resource: HabboResource.Group,
      resourceId: groupId,
      headers: options.headers,
      signal: options.signal,
    });
  }

  /**
   * Retrieves the members of a group.
   *
   * `GET /api/public/groups/{id}/members`
   *
   * @param groupId - The group's unique id.
   * @param options - Optional abort signal and per-request headers.
   * @returns The list of group members.
   * @throws {HabboApiError} If the group is not found (404).
   */
  getGroupMembers(
    groupId: string,
    options: RequestOptions = {},
  ): Promise<GroupMember[]> {
    return this.http.request<GroupMember[]>({
      path: `${API}/groups/${encodeURIComponent(groupId)}/members`,
      resource: HabboResource.Group,
      resourceId: groupId,
      headers: options.headers,
      signal: options.signal,
    });
  }

  /* ------------------------------ Rooms -------------------------------- */

  /**
   * Retrieves information about a specific room.
   *
   * `GET /api/public/rooms/{roomId}`
   *
   * @param roomId - The room's numeric id.
   * @param options - Optional abort signal and per-request headers.
   * @returns The room details.
   * @throws {HabboApiError} If the room is not found (404).
   */
  getRoom(roomId: string | number, options: RequestOptions = {}): Promise<Room> {
    return this.http.request<Room>({
      path: `${API}/rooms/${encodeURIComponent(String(roomId))}`,
      resource: HabboResource.Room,
      resourceId: String(roomId),
      headers: options.headers,
      signal: options.signal,
    });
  }

  /* ------------------------------ Lists -------------------------------- */

  /**
   * Retrieves the current list of "hot looks".
   *
   * `GET /api/public/lists/hotlooks`
   *
   * @param options - Optional abort signal and per-request headers.
   * @returns The hot looks list.
   * @throws {HabboApiError} On a non-2xx response.
   */
  getHotLooks(options: RequestOptions = {}): Promise<HotLook[]> {
    return this.http.request<HotLook[]>({
      path: `${API}/lists/hotlooks`,
      headers: options.headers,
      signal: options.signal,
    });
  }

  /* ------------------------------ Users -------------------------------- */

  /**
   * Looks up a user by their (case-insensitive) name.
   *
   * `GET /api/public/users?name=`
   *
   * @param name - The Habbo username to look up.
   * @param options - Abort signal, headers, and an optional `ifNoneMatch`
   *   ETag for conditional requests (a `304` resolves to `undefined`).
   * @returns The matching user.
   * @throws {HabboApiError} If no user matches the name (404).
   * @example
   * ```ts
   * const user = await sdk.habbo.getUserByName('SomeName');
   * ```
   */
  getUserByName(
    name: string,
    options: ConditionalRequestOptions = {},
  ): Promise<User> {
    return this.http.request<User>({
      path: `${API}/users`,
      query: { name },
      resource: HabboResource.User,
      resourceId: name,
      headers: this.withIfNoneMatch(options),
      signal: options.signal,
    });
  }

  /**
   * Retrieves a user by their unique id.
   *
   * `GET /api/public/users/{id}`
   *
   * @param uniqueId - The user's unique id (`hhxx-...`).
   * @param options - Abort signal, headers, and an optional `ifNoneMatch`
   *   ETag for conditional requests (a `304` resolves to `undefined`).
   * @returns The user.
   * @throws {HabboApiError} If the user is not found (404).
   */
  getUserById(
    uniqueId: string,
    options: ConditionalRequestOptions = {},
  ): Promise<User> {
    return this.http.request<User>({
      path: `${API}/users/${encodeURIComponent(uniqueId)}`,
      resource: HabboResource.User,
      resourceId: uniqueId,
      headers: this.withIfNoneMatch(options),
      signal: options.signal,
    });
  }

  /**
   * Retrieves a user's full profile (user plus groups, badges, friends, rooms).
   *
   * `GET /api/public/users/{id}/profile`
   *
   * @param uniqueId - The user's unique id.
   * @param options - Optional abort signal and per-request headers.
   * @returns The full profile.
   * @throws {HabboApiError} If the user is not found or the profile is private.
   */
  getUserProfile(
    uniqueId: string,
    options: RequestOptions = {},
  ): Promise<UserProfile> {
    return this.http.request<UserProfile>({
      path: `${API}/users/${encodeURIComponent(uniqueId)}/profile`,
      resource: HabboResource.User,
      resourceId: uniqueId,
      headers: options.headers,
      signal: options.signal,
    });
  }

  /**
   * Retrieves a user's friends.
   *
   * `GET /api/public/users/{id}/friends`
   *
   * @param uniqueId - The user's unique id.
   * @param options - Optional abort signal and per-request headers.
   * @returns The user's friend list.
   * @throws {HabboApiError} If the user is not found or the list is private.
   */
  getUserFriends(
    uniqueId: string,
    options: RequestOptions = {},
  ): Promise<Friend[]> {
    return this.http.request<Friend[]>({
      path: `${API}/users/${encodeURIComponent(uniqueId)}/friends`,
      resource: HabboResource.User,
      resourceId: uniqueId,
      headers: options.headers,
      signal: options.signal,
    });
  }

  /**
   * Retrieves the groups a user belongs to.
   *
   * `GET /api/public/users/{id}/groups`
   *
   * @param uniqueId - The user's unique id.
   * @param options - Optional abort signal and per-request headers.
   * @returns The user's groups.
   * @throws {HabboApiError} If the user is not found.
   */
  getUserGroups(
    uniqueId: string,
    options: RequestOptions = {},
  ): Promise<Group[]> {
    return this.http.request<Group[]>({
      path: `${API}/users/${encodeURIComponent(uniqueId)}/groups`,
      resource: HabboResource.User,
      resourceId: uniqueId,
      headers: options.headers,
      signal: options.signal,
    });
  }

  /**
   * Retrieves the public rooms owned by a user.
   *
   * `GET /api/public/users/{id}/rooms`
   *
   * @param uniqueId - The user's unique id.
   * @param options - Optional abort signal and per-request headers.
   * @returns The user's public rooms.
   * @throws {HabboApiError} If the user is not found.
   */
  getUserRooms(
    uniqueId: string,
    options: RequestOptions = {},
  ): Promise<Room[]> {
    return this.http.request<Room[]>({
      path: `${API}/users/${encodeURIComponent(uniqueId)}/rooms`,
      resource: HabboResource.User,
      resourceId: uniqueId,
      headers: options.headers,
      signal: options.signal,
    });
  }

  /**
   * Retrieves the badges earned by a user.
   *
   * `GET /api/public/users/{id}/badges`
   *
   * @param uniqueId - The user's unique id.
   * @param options - Optional abort signal and per-request headers.
   * @returns The user's badges.
   * @throws {HabboApiError} If the user is not found.
   */
  getUserBadges(
    uniqueId: string,
    options: RequestOptions = {},
  ): Promise<UserBadge[]> {
    return this.http.request<UserBadge[]>({
      path: `${API}/users/${encodeURIComponent(uniqueId)}/badges`,
      resource: HabboResource.User,
      resourceId: uniqueId,
      headers: options.headers,
      signal: options.signal,
    });
  }

  /* --------------------------- Marketplace ----------------------------- */

  /**
   * Retrieves marketplace statistics for a batch of room and/or wall items.
   *
   * `POST /api/public/marketplace/stats/batch`
   *
   * @param request - The room and/or wall item class names to query.
   * @param options - Optional abort signal and per-request headers.
   * @returns Marketplace stats per requested item.
   * @throws {HabboApiError} On a non-2xx response.
   * @example
   * ```ts
   * const stats = await sdk.habbo.getMarketplaceStatsBatch({
   *   roomItems: [{ item: 'throne' }],
   *   wallItems: [{ item: 'rare_dragonlamp' }],
   * });
   * ```
   */
  getMarketplaceStatsBatch(
    request: MarketplaceStatsBatchRequest,
    options: RequestOptions = {},
  ): Promise<MarketplaceStatsBatchResponse> {
    return this.http.request<MarketplaceStatsBatchResponse>({
      method: HttpMethod.POST,
      path: `${API}/marketplace/stats/batch`,
      body: request,
      headers: options.headers,
      signal: options.signal,
    });
  }

  /* ----------------------------- helpers ------------------------------- */

  /** Merges an optional `ifNoneMatch` ETag into the request headers. */
  private withIfNoneMatch(
    options: ConditionalRequestOptions,
  ): Record<string, string> | undefined {
    if (!options.ifNoneMatch) return options.headers;
    return { ...options.headers, 'If-None-Match': options.ifNoneMatch };
  }
}
