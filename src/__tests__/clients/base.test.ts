import { describe, expect, it, vi } from 'vitest';
import { HabboHotel } from '../../enums.js';
import { HttpClient } from '../../http.js';
import { HabboClient } from '../../clients/habbo.js';

describe('BaseClient', () => {
  it('accepts a HabboClientConfig and creates an HttpClient internally', () => {
    const client = new HabboClient({ hotel: HabboHotel.ES, fetch: vi.fn() });
    expect(client.http).toBeInstanceOf(HttpClient);
    expect(client.baseUrl).toBe('https://www.habbo.es');
  });

  it('accepts a pre-built HttpClient and reuses it', () => {
    const http = new HttpClient({ hotel: HabboHotel.FR, fetch: vi.fn() });
    const client = new HabboClient(http);
    expect(client.http).toBe(http);
    expect(client.baseUrl).toBe('https://www.habbo.fr');
  });

  it('exposes baseUrl as a getter that delegates to http.baseUrl', () => {
    const http = new HttpClient({ baseUrl: 'https://custom.example.com', fetch: vi.fn() });
    const client = new HabboClient(http);
    expect(client.baseUrl).toBe('https://custom.example.com');
  });

  it('uses default config when no argument is passed', () => {
    const client = new HabboClient({ fetch: vi.fn() });
    expect(client.baseUrl).toBe('https://www.habbo.com');
  });
});
