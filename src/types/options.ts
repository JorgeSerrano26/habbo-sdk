/**
 * Per-request option types accepted by the client methods.
 */

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
