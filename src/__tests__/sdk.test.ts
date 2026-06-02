import { describe, expect, it, vi } from 'vitest';
import { GameDataClient } from '../clients/gamedata.js';
import { GameDataHashedClient } from '../clients/gamedata-hashes.js';
import { HabboClient } from '../clients/habbo.js';
import { HabboOriginsClient } from '../clients/origins.js';
import { HabboHotel } from '../enums.js';
import { HttpClient } from '../http.js';
import { HabboSDK } from '../sdk.js';

// Also exercise the public index barrel to get index.ts coverage.
import {
  AchievementNotFoundError,
  BadgeNotFoundError,
  buildBaseUrl,
  createHabboApiError,
  DerbyNotFoundError,
  FigureGender,
  FigurePartType,
  GameDataHashName,
  GameDataType,
  GroupNotFoundError,
  HabboApiError,
  HabboBadRequestError,
  HabboForbiddenError,
  HabboNotFoundError,
  HabboRateLimitError,
  HabboResource,
  HabboServerError,
  HabboTimeoutError,
  HabboUnauthorizedError,
  HttpMethod,
  MatchNotFoundError,
  PlayerNotFoundError,
  RoomNotFoundError,
  SkillType,
  UserNotFoundError,
  parseFigureData,
  parseFurniData,
  parseProductData,
} from '../index.js';

describe('HabboSDK', () => {
  const fetch = vi.fn();

  it('exposes habbo, origins and gamedata clients', () => {
    const sdk = new HabboSDK({ hotel: HabboHotel.ES, fetch });
    expect(sdk.habbo).toBeInstanceOf(HabboClient);
    expect(sdk.origins).toBeInstanceOf(HabboOriginsClient);
    expect(sdk.gamedata).toBeInstanceOf(GameDataClient);
  });

  it('exposes the shared HttpClient', () => {
    const sdk = new HabboSDK({ hotel: HabboHotel.ES, fetch });
    expect(sdk.http).toBeInstanceOf(HttpClient);
  });

  it('all sub-clients share the same HttpClient instance', () => {
    const sdk = new HabboSDK({ hotel: HabboHotel.ES, fetch });
    expect(sdk.habbo.http).toBe(sdk.http);
    expect(sdk.origins.http).toBe(sdk.http);
    expect(sdk.gamedata.http).toBe(sdk.http);
  });

  it('exposes baseUrl from the underlying HttpClient', () => {
    const sdk = new HabboSDK({ hotel: HabboHotel.BR, fetch });
    expect(sdk.baseUrl).toBe('https://www.habbo.com.br');
  });

  it('defaults to HabboHotel.COM when no hotel is specified', () => {
    const sdk = new HabboSDK({ fetch });
    expect(sdk.baseUrl).toBe('https://www.habbo.com');
  });

  it('accepts a baseUrl override', () => {
    const sdk = new HabboSDK({ baseUrl: 'https://custom.habbo.test', fetch });
    expect(sdk.baseUrl).toBe('https://custom.habbo.test');
  });
});

// Verify that all public API surface items are correctly re-exported from index.ts.
describe('index.ts public API surface', () => {
  it('re-exports HabboSDK', async () => {
    const { HabboSDK: SDK } = await import('../index.js');
    expect(SDK).toBe(HabboSDK);
  });

  it('re-exports error classes', () => {
    // Just asserting they are functions (constructors) is sufficient.
    for (const cls of [
      HabboApiError, HabboBadRequestError, HabboUnauthorizedError,
      HabboForbiddenError, HabboNotFoundError, UserNotFoundError,
      GroupNotFoundError, RoomNotFoundError, BadgeNotFoundError,
      AchievementNotFoundError, MatchNotFoundError, DerbyNotFoundError,
      PlayerNotFoundError, HabboRateLimitError, HabboServerError,
      HabboTimeoutError,
    ]) {
      expect(typeof cls).toBe('function');
    }
  });

  it('re-exports factory and utility functions', () => {
    expect(typeof createHabboApiError).toBe('function');
    expect(typeof buildBaseUrl).toBe('function');
  });

  it('re-exports parser functions', () => {
    expect(typeof parseFigureData).toBe('function');
    expect(typeof parseFurniData).toBe('function');
    expect(typeof parseProductData).toBe('function');
  });

  it('re-exports GameDataHashedClient', async () => {
    const mod = await import('../index.js');
    expect(mod.GameDataHashedClient).toBe(GameDataHashedClient);
  });

  it('re-exports enums with the correct values', () => {
    expect(HabboHotel.ES).toBe('es');
    expect(SkillType.Fishing).toBe('FISHING');
    expect(GameDataType.FurniDataXml).toBe('furnidata_xml');
    expect(GameDataType.ExternalFlashTexts).toBe('external_flash_texts');
    expect(GameDataHashName.Furnidata).toBe('furnidata');
    expect(GameDataHashName.ExternalTexts).toBe('external_texts');
    expect(GameDataHashName.FigurePartList).toBe('figurepartlist');
    expect(FigureGender.Male).toBe('M');
    expect(FigurePartType.Hair).toBe('hr');
    expect(HttpMethod.POST).toBe('POST');
    expect(HabboResource.User).toBe('user');
  });
});
