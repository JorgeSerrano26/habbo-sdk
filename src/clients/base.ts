/**
 * Base class shared by every Habbo SDK client.
 *
 * Holds the {@link HttpClient} and exposes it to subclasses. Custom clients
 * with additional, non-official methods can extend this class to reuse the
 * configured HTTP layer.
 */

import { HttpClient } from '../http.js';
import type { HabboClientConfig } from '../types.js';

export abstract class BaseClient {
  /** The underlying HTTP client (shared base URL, fetch, headers, timeout). */
  public readonly http: HttpClient;

  constructor(config: HabboClientConfig | HttpClient = {}) {
    this.http = config instanceof HttpClient ? config : new HttpClient(config);
  }

  /** The resolved base URL this client targets. */
  public get baseUrl(): string {
    return this.http.baseUrl;
  }
}
