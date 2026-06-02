/**
 * Response models for the Habbo gamedata endpoints.
 */

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
