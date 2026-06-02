/**
 * Top-level facade tying together every Habbo client against a single,
 * hotel-configured HTTP layer.
 */

import { HttpClient } from './http.js';
import { HabboClient } from './clients/habbo.js';
import { HabboOriginsClient } from './clients/origins.js';
import { GameDataClient } from './clients/gamedata.js';
import type { HabboClientConfig } from './types.js';

/**
 * The main entry point of the SDK.
 *
 * @example
 * ```ts
 * import { HabboSDK, HabboHotel } from 'habbo-sdk';
 *
 * const sdk = new HabboSDK({ hotel: HabboHotel.ES });
 *
 * const user = await sdk.habbo.getUserByName('Sulake');
 * const skill = await sdk.origins.getPlayerSkill(user.uniqueId);
 * const figureXml = await sdk.gamedata.getFigureData();
 * ```
 *
 * The same config (hotel/domain) flows to every client, so switching hotels is
 * a single constructor argument.
 */
export class HabboSDK {
  /** Shared HTTP client (base URL, fetch, headers, timeout, api key). */
  public readonly http: HttpClient;
  /** Modern Habbo Web API client. */
  public readonly habbo: HabboClient;
  /** Habbo Origins Web API client. */
  public readonly origins: HabboOriginsClient;
  /** Gamedata files client (figure/product/furni data, external variables). */
  public readonly gamedata: GameDataClient;

  constructor(config: HabboClientConfig = {}) {
    this.http = new HttpClient(config);
    // Every client reuses the same HttpClient instance.
    this.habbo = new HabboClient(this.http);
    this.origins = new HabboOriginsClient(this.http);
    this.gamedata = new GameDataClient(this.http);
  }

  /** The resolved base URL the SDK targets. */
  public get baseUrl(): string {
    return this.http.baseUrl;
  }
}
