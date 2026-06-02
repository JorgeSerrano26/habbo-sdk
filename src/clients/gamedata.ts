/**
 * Client for the Habbo `gamedata` files.
 *
 * The endpoint `GET /gamedata/{type}/{revision}` answers with a `307` redirect
 * to a hashed, immutable URL holding the actual data file. `fetch` follows the
 * redirect transparently, so callers receive the file contents directly.
 *
 * Results are returned as raw strings (XML for figure/product/furni data,
 * `key=value` text for external variables) to keep the SDK dependency-free.
 * Use {@link GameDataClient.getExternalVariablesMap} for a parsed map, or the
 * standalone `parseFigureData`, `parseFurniData`, `parseProductData` functions
 * exported from the package for typed XML parsing.
 *
 * Values differ per hotel — this client uses the same configured domain as the
 * rest of the SDK.
 *
 * ## Efficient multi-asset loading with hashes
 *
 * `GET /gamedata/hashes` returns every asset hash in one request. Use
 * {@link getHashes} + {@link buildHashedUrl} to build direct CDN URLs and
 * avoid 307 redirects. Caching the result is intentionally left to the caller
 * (server-side cache, edge cache, etc.) since caching strategies vary widely.
 *
 * ```ts
 * const { hashes } = await sdk.gamedata.getHashes();
 * // Build all direct URLs at once — no further /gamedata requests needed:
 * for (const entry of hashes) {
 *   const directUrl = sdk.gamedata.buildHashedUrl(entry);
 *   // fetch(directUrl) → immutable CDN response
 * }
 * ```
 */

import { GameDataType } from '../enums.js';
import { parseFigureData } from '../parsers/figuredata.js';
import { parseFurniData } from '../parsers/furnidata.js';
import { parseProductData } from '../parsers/productdata.js';
import { BaseClient } from './base.js';
import type {
  ClientUrlsResponse,
  GameDataHashEntry,
  GameDataHashesResponse,
  RequestOptions,
} from '../types.js';
import type { FigureData } from '../parsers/figuredata.js';
import type { FurniData } from '../parsers/furnidata.js';
import type { ProductDataEntry } from '../parsers/productdata.js';

export class GameDataClient extends BaseClient {
  /**
   * Resolves the hashed, immutable URL for a gamedata file without downloading
   * its body. Follows the `307` redirect and returns the final URL.
   *
   * @param type - The gamedata file type.
   * @param revision - The revision to request (defaults to `1`, which the API
   *   resolves to the current hash).
   * @param options - Optional abort signal and per-request headers.
   * @returns The resolved, hashed file URL.
   * @throws {HabboApiError} On a non-2xx response.
   * @example
   * ```ts
   * const url = await sdk.gamedata.resolveUrl(GameDataType.FurniDataXml);
   * // -> https://www.habbo.es/gamedata/furnidata_xml/<hash>
   * ```
   */
  async resolveUrl(
    type: GameDataType,
    revision: string | number = 1,
    options: RequestOptions = {},
  ): Promise<string> {
    const response = await this.http.send({
      path: this.path(type, revision),
      headers: { Accept: '*/*', ...options.headers },
      signal: options.signal,
      raw: true,
    });
    return response.url;
  }

  /**
   * Fetches the raw contents of a gamedata file for the given type.
   *
   * @param type - The gamedata file type.
   * @param revision - The revision to request (defaults to `1`).
   * @param options - Optional abort signal and per-request headers.
   * @returns The raw file contents.
   * @throws {HabboApiError} On a non-2xx response.
   */
  async fetchRaw(
    type: GameDataType,
    revision: string | number = 1,
    options: RequestOptions = {},
  ): Promise<string> {
    const response = await this.http.send({
      path: this.path(type, revision),
      headers: { Accept: '*/*', ...options.headers },
      signal: options.signal,
      raw: true,
    });
    return response.text();
  }

  /**
   * Fetches the avatar `figuredata` document (XML), describing figure sets,
   * colours and palettes.
   *
   * @param revision - The revision to request (defaults to `1`).
   * @param options - Optional abort signal and per-request headers.
   * @returns The `figuredata` XML as a string.
   * @throws {HabboApiError} On a non-2xx response.
   */
  getFigureData(
    revision: string | number = 1,
    options: RequestOptions = {},
  ): Promise<string> {
    return this.fetchRaw(GameDataType.FigureData, revision, options);
  }

  /**
   * Fetches the catalogue `productdata` document (XML).
   *
   * @param revision - The revision to request (defaults to `1`).
   * @param options - Optional abort signal and per-request headers.
   * @returns The `productdata` XML as a string.
   * @throws {HabboApiError} On a non-2xx response.
   */
  getProductData(
    revision: string | number = 1,
    options: RequestOptions = {},
  ): Promise<string> {
    return this.fetchRaw(GameDataType.ProductData, revision, options);
  }

  /**
   * Fetches the `furnidata_xml` document (XML), describing all furniture.
   *
   * @param revision - The revision to request (defaults to `1`).
   * @param options - Optional abort signal and per-request headers.
   * @returns The `furnidata_xml` XML as a string.
   * @throws {HabboApiError} On a non-2xx response.
   */
  getFurniData(
    revision: string | number = 1,
    options: RequestOptions = {},
  ): Promise<string> {
    return this.fetchRaw(GameDataType.FurniDataXml, revision, options);
  }

  /**
   * Fetches the raw `external_variables` document (`key=value` text) holding
   * client configuration for the hotel.
   *
   * @param revision - The revision to request (defaults to `1`).
   * @param options - Optional abort signal and per-request headers.
   * @returns The raw `external_variables` text.
   * @throws {HabboApiError} On a non-2xx response.
   * @see {@link GameDataClient.getExternalVariablesMap} for a parsed map.
   */
  getExternalVariables(
    revision: string | number = 1,
    options: RequestOptions = {},
  ): Promise<string> {
    return this.fetchRaw(GameDataType.ExternalVariables, revision, options);
  }

  /**
   * Fetches `external_variables` and parses it into a key/value record.
   *
   * Lines are formatted as `key=value`; blank lines and lines without an `=`
   * are skipped.
   *
   * @param revision - The revision to request (defaults to `1`).
   * @param options - Optional abort signal and per-request headers.
   * @returns A record mapping each variable name to its value.
   * @throws {HabboApiError} On a non-2xx response.
   */
  async getExternalVariablesMap(
    revision: string | number = 1,
    options: RequestOptions = {},
  ): Promise<Record<string, string>> {
    const raw = await this.getExternalVariables(revision, options);
    return this.parseKeyValue(raw);
  }

  /**
   * Fetches the raw `external_flash_texts` document (`key=value` text) holding
   * the client's UI string table for the hotel.
   *
   * @param revision - The revision to request (defaults to `1`).
   * @param options - Optional abort signal and per-request headers.
   * @returns The raw `external_flash_texts` text.
   * @throws {HabboApiError} On a non-2xx response.
   */
  getExternalTexts(
    revision: string | number = 1,
    options: RequestOptions = {},
  ): Promise<string> {
    return this.fetchRaw(GameDataType.ExternalFlashTexts, revision, options);
  }

  /**
   * Fetches `external_flash_texts` and parses it into a key/value record.
   * Identical format to `external_variables` (`key=value` per line).
   *
   * @param revision - The revision to request (defaults to `1`).
   * @param options - Optional abort signal and per-request headers.
   * @returns A record mapping each text key to its value.
   * @throws {HabboApiError} On a non-2xx response.
   */
  async getExternalTextsMap(
    revision: string | number = 1,
    options: RequestOptions = {},
  ): Promise<Record<string, string>> {
    const raw = await this.getExternalTexts(revision, options);
    return this.parseKeyValue(raw);
  }

  /**
   * Fetches all current gamedata hashes in a single request.
   *
   * `GET /gamedata/hashes`
   *
   * Returns every gamedata asset's current hash in one round-trip. Combine
   * with {@link buildHashedUrl} to build direct, immutable CDN URLs — no
   * further redirects needed. Caching the result is left to the caller.
   *
   * @param options - Optional abort signal and per-request headers.
   * @returns All known gamedata entries with their current hashes.
   * @throws {HabboApiError} On a non-2xx response.
   * @example
   * ```ts
   * const { hashes } = await sdk.gamedata.getHashes();
   * for (const entry of hashes) {
   *   console.log(entry.name, sdk.gamedata.buildHashedUrl(entry));
   * }
   * ```
   */
  getHashes(options: RequestOptions = {}): Promise<GameDataHashesResponse> {
    return this.http.request<GameDataHashesResponse>({
      path: '/gamedata/hashes',
      headers: options.headers,
      signal: options.signal,
    });
  }

  /**
   * Builds the full, immutable download URL for a gamedata entry returned by
   * {@link getHashes}.
   *
   * The URL is constructed as `entry.url + "/" + entry.hash`.
   *
   * @param entry - A single entry from the {@link GameDataHashesResponse}.
   * @returns The absolute, hashed URL ready for direct download.
   * @example
   * ```ts
   * const { hashes } = await sdk.gamedata.getHashes();
   * const furni = hashes.find(h => h.name === 'furnidata');
   * const url = sdk.gamedata.buildHashedUrl(furni!);
   * // → "https://www.habbo.es/gamedata/furnidata_xml/<hash>"
   * ```
   */
  buildHashedUrl(entry: GameDataHashEntry): string {
    return `${entry.url}/${entry.hash}`;
  }

  /* ------------------------------ Parsed ---------------------------------- */

  /**
   * Fetches and parses the `figuredata` XML into a typed {@link FigureData}
   * object, containing all figure palettes, set-types, sets and parts.
   *
   * @param revision - The revision to request (defaults to `1`).
   * @param options - Optional abort signal and per-request headers.
   * @returns Parsed figure data.
   * @throws {HabboApiError} On a non-2xx response.
   */
  async getParsedFigureData(
    revision: string | number = 1,
    options: RequestOptions = {},
  ): Promise<FigureData> {
    const xml = await this.getFigureData(revision, options);
    return parseFigureData(xml);
  }

  /**
   * Fetches and parses the `furnidata_xml` XML into a typed {@link FurniData}
   * object, containing all room and wall furniture types.
   *
   * @param revision - The revision to request (defaults to `1`).
   * @param options - Optional abort signal and per-request headers.
   * @returns Parsed furni data.
   * @throws {HabboApiError} On a non-2xx response.
   */
  async getParsedFurniData(
    revision: string | number = 1,
    options: RequestOptions = {},
  ): Promise<FurniData> {
    const xml = await this.getFurniData(revision, options);
    return parseFurniData(xml);
  }

  /**
   * Fetches and parses the `productdata` XML into an array of
   * {@link ProductDataEntry} objects.
   *
   * @param revision - The revision to request (defaults to `1`).
   * @param options - Optional abort signal and per-request headers.
   * @returns Parsed product data entries.
   * @throws {HabboApiError} On a non-2xx response.
   */
  async getParsedProductData(
    revision: string | number = 1,
    options: RequestOptions = {},
  ): Promise<ProductDataEntry[]> {
    const xml = await this.getProductData(revision, options);
    return parseProductData(xml);
  }

  /* ----------------------------- Client URLs ------------------------------ */

  /**
   * Fetches the current Habbo client download URLs and version numbers.
   *
   * `GET /gamedata/clienturls`
   *
   * Returns direct download links for the Unity and Flash/AIR clients on
   * Windows and macOS, along with their respective version strings.
   *
   * @param options - Optional abort signal and per-request headers.
   * @returns Client URLs and version information.
   * @throws {HabboApiError} On a non-2xx response.
   * @example
   * ```ts
   * const urls = await sdk.gamedata.getClientUrls();
   * console.log(urls['unity-windows']);
   * console.log(urls['unity-windows-version']);
   * ```
   */
  getClientUrls(options: RequestOptions = {}): Promise<ClientUrlsResponse> {
    return this.http.request<ClientUrlsResponse>({
      path: '/gamedata/clienturls',
      headers: options.headers,
      signal: options.signal,
    });
  }

  /* ----------------------------- helpers ---------------------------------- */

  /** Parses `key=value` text into a record; blank lines and no-`=` lines are skipped. */
  private parseKeyValue(raw: string): Record<string, string> {
    const result: Record<string, string> = {};
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      result[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1);
    }
    return result;
  }

  /** Builds the `/gamedata/{type}/{revision}` request path. */
  private path(type: GameDataType, revision: string | number): string {
    return `/gamedata/${type}/${encodeURIComponent(String(revision))}`;
  }
}
