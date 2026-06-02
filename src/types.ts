/**
 * Type definitions for the Habbo / Habbo Origins Web API.
 *
 * Shapes are derived from the public OpenAPI document published at
 * `https://www.habbo.<hotel>/api/public/api-docs/`.
 */

import type { HabboHotel, SkillType } from './enums.js';

/* -------------------------------------------------------------------------- */
/* Configuration                                                              */
/* -------------------------------------------------------------------------- */

/** A minimal subset of the WHATWG `fetch` signature the SDK depends on. */
export type FetchLike = (
  input: string,
  init?: RequestInit,
) => Promise<Response>;

/**
 * Configuration shared by every client and the {@link HabboSDK} facade.
 */
export interface HabboClientConfig {
  /**
   * Hotel to target. Either a {@link HabboHotel} enum value or a raw domain
   * suffix (e.g. `"es"`, `"com.br"`). Ignored when {@link baseUrl} is set.
   */
  hotel?: HabboHotel | string;
  /**
   * Fully-qualified base URL override. When omitted it is built from
   * {@link hotel} as `https://www.habbo.<hotel>`.
   */
  baseUrl?: string;
  /** API key sent as the `api_key` query param on endpoints that require it. */
  apiKey?: string;
  /** Custom `fetch` implementation (defaults to the global `fetch`). */
  fetch?: FetchLike;
  /** Extra headers merged into every request. */
  headers?: Record<string, string>;
  /** Request timeout in milliseconds, applied per attempt. Defaults to `30000`. */
  timeoutMs?: number;
  /** Retry configuration for transient failures. */
  retry?: RetryConfig;
}

/**
 * Controls automatic retries with exponential backoff for transient failures
 * (network errors and retryable HTTP status codes).
 */
export interface RetryConfig {
  /**
   * Maximum number of *retries* after the initial attempt. `0` disables
   * retrying. Defaults to `2` (i.e. up to 3 attempts total).
   */
  retries?: number;
  /**
   * Base delay in milliseconds for the exponential backoff. The wait before
   * attempt `n` is `baseDelayMs * 2 ** (n - 1)` (plus optional jitter), capped
   * at {@link maxDelayMs}. Defaults to `500`.
   */
  baseDelayMs?: number;
  /** Upper bound for any single backoff wait, in ms. Defaults to `10000`. */
  maxDelayMs?: number;
  /**
   * HTTP status codes that should be retried.
   * Defaults to `[429, 500, 502, 503, 504]`.
   */
  retryableStatuses?: number[];
  /**
   * Whether per-attempt timeouts should be retried.
   * Defaults to `true`.
   */
  retryOnTimeout?: boolean;
  /**
   * Whether to add random jitter (0–100% of the computed delay) to spread out
   * retries. Defaults to `true`.
   */
  jitter?: boolean;
}

/* -------------------------------------------------------------------------- */
/* Request option types                                                       */
/* -------------------------------------------------------------------------- */

/** Per-request options that can be passed to any endpoint method. */
export interface RequestOptions {
  /** An `AbortSignal` to cancel the request. */
  signal?: AbortSignal;
  /** Additional headers for this single request. */
  headers?: Record<string, string>;
}

/** Options for endpoints that support conditional `If-None-Match` requests. */
export interface ConditionalRequestOptions extends RequestOptions {
  /** Value for the `If-None-Match` header (an ETag). */
  ifNoneMatch?: string;
}

/** Pagination / time-window options for Origins match listings. */
export interface MatchListOptions extends RequestOptions {
  /** Number of items to skip before collecting the result set. */
  offset?: number;
  /** Number of items to return. */
  limit?: number;
  /** Only include matches starting after this time (`YYYY-MM-DD HH:mm:ss.SSS`). */
  startTime?: string;
  /** Only include matches ending before this time (`YYYY-MM-DD HH:mm:ss.SSS`). */
  endTime?: string;
}

/** Options for Origins fishing-derby listings. */
export interface DerbyListOptions extends MatchListOptions {
  /** Override the configured API key for this request. */
  apiKey?: string;
}

/** Options carrying an optional per-request API key. */
export interface ApiKeyOptions extends RequestOptions {
  /** Override the configured API key for this request. */
  apiKey?: string;
}

/** Options for the skills leaderboard. */
export interface SkillsLeaderboardOptions extends RequestOptions {
  /** Page number to retrieve. */
  page?: number;
}

/* -------------------------------------------------------------------------- */
/* Habbo (modern) response models                                            */
/* -------------------------------------------------------------------------- */

export interface AchievementInfo {
  id: number;
  name: string;
  creationTime: string;
  state: string;
  category: string;
}

export interface AchievementLevelRequirement {
  level: number;
  requiredScore: number;
}

export interface Achievement {
  achievement: AchievementInfo;
  levelRequirements: AchievementLevelRequirement[];
}

export interface BadgeOwners {
  ownerCount: number;
  name: string;
  description: string;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  type: string;
  roomId: string;
  badgeCode: string;
}

export interface GroupMember {
  online: boolean;
  gender: string;
  motto: string;
  habboFigure: string;
  memberSince: string;
  uniqueId: string;
  name: string;
  isAdmin: boolean;
}

export interface SelectedBadge {
  badgeIndex?: number;
  code: string;
  name?: string;
  description?: string;
}

export interface User {
  uniqueId: string;
  name: string;
  figureString: string;
  motto: string;
  online: boolean;
  lastAccessTime: string;
  memberSince: string;
  profileVisible: boolean;
  currentLevel: number;
  currentLevelCompletePercent: number;
  totalExperience: number;
  starGemCount: number;
  selectedBadges: SelectedBadge[];
}

export interface UserBadge {
  code: string;
  name: string;
  description: string;
}

export interface Friend {
  name: string;
  uniqueId: string;
  figureString?: string;
  motto?: string;
  online?: boolean;
}

export interface Room {
  id: number;
  name: string;
  description: string;
  creationTime: string;
  habboGroupId: string;
  tags: string[];
  maximumVisitors: number;
  showOwnerName: boolean;
  ownerName: string;
  ownerUniqueId: string;
  categories: string[];
  thumbnailUrl: string;
  imageUrl: string;
  rating: number;
  uniqueId: string;
}

/** A user profile bundles the user with their related collections. */
export interface UserProfile extends User {
  groups: Group[];
  badges: UserBadge[];
  friends: Friend[];
  rooms: Room[];
}

/** A single "hot look" entry. Shape is loosely typed as the API is sparse. */
export type HotLook = Record<string, unknown>;

/* ---- Marketplace ---- */

export interface MarketplaceStatsBatchRequest {
  /** Room (floor) item class names to retrieve stats for. */
  roomItems?: Array<{ item: string }>;
  /** Wall item class names to retrieve stats for. */
  wallItems?: Array<{ item: string }>;
}

export interface MarketplaceHistoryPoint {
  dayOffset: string;
  averagePrice: string;
  totalSoldItems: string;
  totalCreditSum: string;
  totalOpenOffers: string;
}

export interface MarketplaceItemStats {
  item: string;
  statsDate: string;
  history: MarketplaceHistoryPoint[];
  soldItemCount: number;
  creditSum: number;
  averagePrice: number;
  totalOpenOffers: number;
  currentOpenOffers: number;
  currentPrice: number;
  historyLimitInDays: number;
}

export interface MarketplaceStatsBatchResponse {
  status: string;
  roomItemData: MarketplaceItemStats[];
  wallItemData: MarketplaceItemStats[];
}

/* -------------------------------------------------------------------------- */
/* Habbo Origins response models                                             */
/* -------------------------------------------------------------------------- */

export interface MatchParticipant {
  gamePlayerId: string;
  gameScore: number;
  playerPlacement: number;
  teamId: number;
  teamPlacement: number;
  timesStunned: number;
  powerUpPickups: number;
  powerUpActivations: number;
  tilesCleaned: number;
  tilesColoured: number;
  tilesStolen: number;
  tilesLocked: number;
  tilesColouredForOpponents: number;
}

export interface MatchTeam {
  teamId: number;
  win: boolean;
  teamScore: number;
  teamPlacement: number;
}

export interface MatchDetails {
  metadata: {
    matchId: string;
    participantPlayerIds: string[];
  };
  info: {
    gameCreation: number;
    gameDuration: number;
    gameEnd: number;
    gameMode: string;
    mapId: number;
    ranked: boolean;
    participants: MatchParticipant[];
    teams: MatchTeam[];
  };
}

/** Fishing derby details. Loosely typed as the schema is unspecified. */
export type DerbyDetails = Record<string, unknown>;

/** Current fishing derby status. Loosely typed as the schema is unspecified. */
export type DerbyStatus = Record<string, unknown>;

export interface PlayerSkill {
  level: number;
  experience: number;
}

export interface SkillsLeaderboardEntry {
  uniqueId: string;
  level: number;
  experience: number;
}

export interface SkillsLeaderboard {
  entries: SkillsLeaderboardEntry[];
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

/** Re-exported for convenience so callers can reference the skill enum value. */
export type { SkillType };

/* -------------------------------------------------------------------------- */
/* Gamedata hashes                                                            */
/* -------------------------------------------------------------------------- */

/**
 * A single entry from the `GET /gamedata/hashes` response.
 *
 * The `url` field is the base URL for the asset **without** the hash.
 * Append `/${hash}` to construct the full, immutable download URL:
 *
 * ```ts
 * const fullUrl = sdk.gamedata.buildHashedUrl(entry);
 * ```
 */
export interface GameDataHashEntry {
  /** Logical name of the asset (e.g. `"furnidata"`, `"figurepartlist"`). */
  name: string;
  /** Base URL for the asset, without the hash suffix. */
  url: string;
  /** Current content hash of the asset. */
  hash: string;
}

/** Response shape of `GET /gamedata/hashes`. */
export interface GameDataHashesResponse {
  hashes: GameDataHashEntry[];
}

/* -------------------------------------------------------------------------- */
/* Client URLs                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Response shape of `GET /gamedata/clienturls`.
 *
 * Contains the current version numbers and download URLs for all Habbo client
 * builds (Unity and Flash, Windows and macOS).
 */
export interface ClientUrlsResponse {
  /** Unity client version for Windows. */
  'unity-windows-version': string;
  /** Unity client version for macOS. */
  'unity-osx-version': string;
  /** Flash/AIR client version for Windows. */
  'flash-windows-version': string;
  /** Flash/AIR client version for macOS. */
  'flash-osx-version': string;
  /** Unity Windows client download URL. */
  'unity-windows': string;
  /** Unity macOS client download URL. */
  'unity-osx': string;
  /** Flash/AIR Windows client download URL. */
  'flash-windows': string;
  /** Flash/AIR macOS client download URL. */
  'flash-osx': string;
  /** Windows client version (generic / latest). */
  'windows-version': string;
  /** macOS client version (generic / latest). */
  'osx-version': string;
}
