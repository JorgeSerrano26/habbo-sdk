/**
 * A pre-resolved gamedata client that fetches assets directly from CDN hashed
 * URLs, bypassing the `307` redirect normally required by the vanilla
 * `GameDataClient` endpoints.
 *
 * ## Pattern
 *
 * ```
 * 1. Obtain hashes → GET /gamedata/hashes  (one request per hotel)
 * 2. Instantiate    → new GameDataHashedClient(gamedata, hashes)
 *                     or await GameDataHashedClient.fromHotel(gamedata)
 * 3. Fetch assets   → hashedClient.getFigureData()
 *                     → https://<hotel>/gamedata/figuredata/<hash>  (direct, no redirect)
 * ```
 *
 * When and how to cache the hashes is left entirely to the caller.
 * In a Node.js server you might store the response in-process with a TTL;
 * in an edge worker you might use KV storage; in a browser SPA you might
 * keep it for the lifetime of the page.
 *
 * @example
 * ```ts
 * import { HabboSDK, HabboHotel, GameDataHashedClient } from '@jorgeserrano26/habbo-sdk';
 *
 * const sdk = new HabboSDK({ hotel: HabboHotel.ES });
 *
 * // One-liner factory (fetches hashes automatically):
 * const hashed = await GameDataHashedClient.fromHotel(sdk.gamedata);
 *
 * // All subsequent asset fetches go directly to CDN (no redirects):
 * const figureXml = await hashed.getFigureData();
 * const furniXml  = await hashed.getFurniData();
 * const vars      = await hashed.getExternalVariablesMap();
 * ```
 */

import { GameDataType } from '../enums/index.js';
import { parseFigureData } from '../parsers/figuredata.js';
import { parseFurniData } from '../parsers/furnidata.js';
import { parseKeyValue } from '../parsers/keyvalue.js';
import { parseProductData } from '../parsers/productdata.js';
import type {
  FigureData,
  FurniData,
  ProductDataEntry,
} from '../parsers/index.js';
import type { GameDataHashesResponse, RequestOptions } from '../types/index.js';
import type { GameDataClient } from './gamedata.js';

/**
 * Maps each {@link GameDataType} to the URL path suffix used in a
 * `GameDataHashEntry.url` (the last path segment).
 *
 * The suffix may differ from the `GameDataType` value itself — e.g.
 * `GameDataType.ProductData = 'productdata'` but its hash entry URL ends with
 * `'productdata_xml'`.
 */
const HASH_URL_SUFFIX: Record<GameDataType, string> = {
  [GameDataType.FigureData]: 'figuredata',
  [GameDataType.ProductData]: 'productdata_xml',
  [GameDataType.FurniDataXml]: 'furnidata_xml',
  [GameDataType.ExternalVariables]: 'external_variables',
  [GameDataType.ExternalFlashTexts]: 'external_flash_texts',
};

export class GameDataHashedClient {
  /**
   * The raw hashes response this client was created from.
   * Inspect it to check asset names, hashes, or base URLs.
   */
  public readonly hashes: GameDataHashesResponse;

  private readonly gamedata: GameDataClient;

  constructor(gamedata: GameDataClient, hashes: GameDataHashesResponse) {
    this.gamedata = gamedata;
    this.hashes = hashes;
  }

  /**
   * Convenience factory: fetches `GET /gamedata/hashes` for the configured
   * hotel and returns a ready-to-use `GameDataHashedClient`.
   *
   * @param gamedata - A configured {@link GameDataClient} (or `sdk.gamedata`).
   * @param options - Optional abort signal and per-request headers.
   * @returns A new `GameDataHashedClient` backed by the freshly fetched hashes.
   */
  static async fromHotel(
    gamedata: GameDataClient,
    options: RequestOptions = {},
  ): Promise<GameDataHashedClient> {
    const hashes = await gamedata.getHashes(options);
    return new GameDataHashedClient(gamedata, hashes);
  }

  /* ─────────────────────────── URL resolution ─────────────────────────── */

  /**
   * Returns the fully-resolved, immutable CDN URL for the given type, or
   * `undefined` if the hash was not present in the response.
   *
   * @example
   * ```ts
   * const url = hashed.resolveUrl(GameDataType.FurniDataXml);
   * // → "https://www.habbo.es/gamedata/furnidata_xml/<hash>"
   * ```
   */
  resolveUrl(type: GameDataType): string | undefined {
    const entry = this.findEntry(type);
    return entry ? this.gamedata.buildHashedUrl(entry) : undefined;
  }

  /* ──────────────────────────── Raw fetches ───────────────────────────── */

  /**
   * Fetches the raw content of the given gamedata type using the resolved
   * hashed URL. Falls back to the redirect-based fetch if no hash was found.
   *
   * @param type - The gamedata type to fetch.
   * @param options - Optional abort signal and per-request headers.
   * @returns The raw file contents.
   * @throws {HabboApiError} On a non-2xx response.
   */
  async fetchRaw(type: GameDataType, options: RequestOptions = {}): Promise<string> {
    const entry = this.findEntry(type);
    if (!entry) {
      return this.gamedata.fetchRaw(type, 1, options);
    }
    const path = new URL(entry.url).pathname + '/' + entry.hash;
    const response = await this.gamedata.http.send({
      path,
      headers: { Accept: '*/*', ...options.headers },
      signal: options.signal,
      raw: true,
    });
    return response.text();
  }

  /** Fetches the `figuredata` XML directly from the CDN hashed URL. */
  getFigureData(options: RequestOptions = {}): Promise<string> {
    return this.fetchRaw(GameDataType.FigureData, options);
  }

  /** Fetches the `productdata` XML directly from the CDN hashed URL. */
  getProductData(options: RequestOptions = {}): Promise<string> {
    return this.fetchRaw(GameDataType.ProductData, options);
  }

  /** Fetches the `furnidata_xml` XML directly from the CDN hashed URL. */
  getFurniData(options: RequestOptions = {}): Promise<string> {
    return this.fetchRaw(GameDataType.FurniDataXml, options);
  }

  /** Fetches the raw `external_variables` text directly from the CDN hashed URL. */
  getExternalVariables(options: RequestOptions = {}): Promise<string> {
    return this.fetchRaw(GameDataType.ExternalVariables, options);
  }

  /** Fetches the raw `external_flash_texts` text directly from the CDN hashed URL. */
  getExternalTexts(options: RequestOptions = {}): Promise<string> {
    return this.fetchRaw(GameDataType.ExternalFlashTexts, options);
  }

  /* ──────────────────────────── Parsed maps ───────────────────────────── */

  /** Fetches and parses `external_variables` into a `Record<string, string>`. */
  async getExternalVariablesMap(options: RequestOptions = {}): Promise<Record<string, string>> {
    return parseKeyValue(await this.getExternalVariables(options));
  }

  /** Fetches and parses `external_flash_texts` into a `Record<string, string>`. */
  async getExternalTextsMap(options: RequestOptions = {}): Promise<Record<string, string>> {
    return parseKeyValue(await this.getExternalTexts(options));
  }

  /* ─────────────────────────── Typed parsers ─────────────────────────── */

  /** Fetches and parses `figuredata` into a typed {@link FigureData} object. */
  async getParsedFigureData(options: RequestOptions = {}): Promise<FigureData> {
    return parseFigureData(await this.getFigureData(options));
  }

  /** Fetches and parses `furnidata_xml` into a typed {@link FurniData} object. */
  async getParsedFurniData(options: RequestOptions = {}): Promise<FurniData> {
    return parseFurniData(await this.getFurniData(options));
  }

  /** Fetches and parses `productdata` into a typed {@link ProductDataEntry}[]. */
  async getParsedProductData(options: RequestOptions = {}): Promise<ProductDataEntry[]> {
    return parseProductData(await this.getProductData(options));
  }

  /* ───────────────────────────── Internals ────────────────────────────── */

  private findEntry(type: GameDataType) {
    const suffix = HASH_URL_SUFFIX[type];
    return this.hashes.hashes.find((h) => h.url.endsWith('/' + suffix));
  }
}
