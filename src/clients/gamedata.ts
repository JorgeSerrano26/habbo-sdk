/**
 * Client for the Habbo `gamedata` files.
 *
 * The endpoint `GET /gamedata/{type}/{revision}` answers with a `307` redirect
 * to a hashed, immutable URL holding the actual data file. `fetch` follows the
 * redirect transparently, so callers receive the file contents directly.
 *
 * Results are returned as raw strings (XML for figure/product/furni data,
 * `key=value` text for external variables) to keep the SDK dependency-free.
 * Use {@link GameDataClient.getExternalVariablesMap} for a parsed map, or pass
 * the strings to your preferred XML parser.
 *
 * Values differ per hotel — this client uses the same configured domain as the
 * rest of the SDK.
 */

import { GameDataType } from '../enums.js';
import { BaseClient } from './base.js';
import type { RequestOptions } from '../types.js';

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
    const result: Record<string, string> = {};
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      result[key] = trimmed.slice(eq + 1);
    }
    return result;
  }

  /** Builds the `/gamedata/{type}/{revision}` request path. */
  private path(type: GameDataType, revision: string | number): string {
    return `/gamedata/${type}/${encodeURIComponent(String(revision))}`;
  }
}
