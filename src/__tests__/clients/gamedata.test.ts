import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GameDataClient } from '../../clients/gamedata.js';
import { GameDataHashedClient } from '../../clients/gamedata-hashes.js';
import { GameDataType, HabboHotel } from '../../enums.js';
import type { GameDataHashEntry, GameDataHashesResponse } from '../../types.js';

const HASHED_URLS: Record<GameDataType, string> = {
  [GameDataType.FigureData]: 'https://www.habbo.es/gamedata/figuredata/abc123',
  [GameDataType.ProductData]: 'https://www.habbo.es/gamedata/productdata/def456',
  [GameDataType.FurniDataXml]: 'https://www.habbo.es/gamedata/furnidata_xml/ghi789',
  [GameDataType.ExternalVariables]: 'https://www.habbo.es/gamedata/external_variables/jkl012',
};

function mockSend(text: string, url = 'https://www.habbo.es/resolved') {
  return {
    url,
    text: vi.fn().mockResolvedValue(text),
    status: 200,
    ok: true,
    headers: new Headers(),
  } as unknown as Response;
}

function makeClient() {
  const client = new GameDataClient({ hotel: HabboHotel.ES, fetch: vi.fn() });
  const sendSpy = vi.spyOn(client.http, 'send').mockResolvedValue(mockSend(''));
  return { client, sendSpy };
}

const MOCK_HASHES: GameDataHashesResponse = {
  hashes: [
    { name: 'figurepartlist', url: 'https://www.habbo.es/gamedata/figuredata', hash: 'fig-hash' },
    { name: 'furnidata', url: 'https://www.habbo.es/gamedata/furnidata_xml', hash: 'furni-hash' },
    { name: 'productdata', url: 'https://www.habbo.es/gamedata/productdata_xml', hash: 'prod-hash' },
    { name: 'external_variables', url: 'https://www.habbo.es/gamedata/external_variables', hash: 'ext-hash' },
    { name: 'external_texts', url: 'https://www.habbo.es/gamedata/external_flash_texts', hash: 'txt-hash' },
  ],
};

describe('GameDataClient', () => {
  let client: GameDataClient;
  let sendSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    ({ client, sendSpy } = makeClient());
  });

  // ── resolveUrl ────────────────────────────────────────────────────────────
  describe('resolveUrl', () => {
    it.each(Object.entries(HASHED_URLS) as [GameDataType, string][])(
      'returns the response.url for %s',
      async (type, expectedUrl) => {
        sendSpy.mockResolvedValue(mockSend('', expectedUrl));
        const result = await client.resolveUrl(type);
        expect(result).toBe(expectedUrl);
      },
    );

    it('calls send with the correct path and default revision 1', async () => {
      await client.resolveUrl(GameDataType.FigureData);
      expect(sendSpy).toHaveBeenCalledWith(
        expect.objectContaining({ path: '/gamedata/figuredata/1' }),
      );
    });

    it('encodes a custom revision string in the path', async () => {
      await client.resolveUrl(GameDataType.FigureData, 'v2 hash');
      expect(sendSpy).toHaveBeenCalledWith(
        expect.objectContaining({ path: '/gamedata/figuredata/v2%20hash' }),
      );
    });

    it('accepts a numeric revision', async () => {
      await client.resolveUrl(GameDataType.FurniDataXml, 42);
      expect(sendSpy).toHaveBeenCalledWith(
        expect.objectContaining({ path: '/gamedata/furnidata_xml/42' }),
      );
    });

    it('sets Accept: */* header', async () => {
      await client.resolveUrl(GameDataType.FigureData);
      const call = sendSpy.mock.calls[0]![0] as { headers?: Record<string, string> };
      expect(call.headers?.Accept).toBe('*/*');
    });

    it('merges per-request headers with Accept', async () => {
      const signal = new AbortController().signal;
      await client.resolveUrl(GameDataType.FigureData, 1, {
        headers: { 'X-Custom': 'yes' },
        signal,
      });
      const call = sendSpy.mock.calls[0]![0] as {
        headers?: Record<string, string>;
        signal?: AbortSignal;
      };
      expect(call.headers?.Accept).toBe('*/*');
      expect(call.headers?.['X-Custom']).toBe('yes');
      expect(call.signal).toBe(signal);
    });
  });

  // ── fetchRaw ──────────────────────────────────────────────────────────────
  describe('fetchRaw', () => {
    it('returns the response text', async () => {
      sendSpy.mockResolvedValue(mockSend('<figuredata/>'));
      const result = await client.fetchRaw(GameDataType.FigureData);
      expect(result).toBe('<figuredata/>');
    });

    it('calls send with the correct path', async () => {
      await client.fetchRaw(GameDataType.ProductData, 5);
      expect(sendSpy).toHaveBeenCalledWith(
        expect.objectContaining({ path: '/gamedata/productdata/5' }),
      );
    });
  });

  // ── getFigureData ─────────────────────────────────────────────────────────
  describe('getFigureData', () => {
    it('delegates to fetchRaw with FigureData type', async () => {
      sendSpy.mockResolvedValue(mockSend('<figuredata/>'));
      const result = await client.getFigureData();
      expect(result).toBe('<figuredata/>');
      expect(sendSpy).toHaveBeenCalledWith(
        expect.objectContaining({ path: '/gamedata/figuredata/1' }),
      );
    });

    it('passes a custom revision', async () => {
      await client.getFigureData(99);
      expect(sendSpy).toHaveBeenCalledWith(
        expect.objectContaining({ path: '/gamedata/figuredata/99' }),
      );
    });
  });

  // ── getProductData ────────────────────────────────────────────────────────
  describe('getProductData', () => {
    it('delegates to fetchRaw with ProductData type', async () => {
      sendSpy.mockResolvedValue(mockSend('<productdata/>'));
      const result = await client.getProductData();
      expect(result).toBe('<productdata/>');
      expect(sendSpy).toHaveBeenCalledWith(
        expect.objectContaining({ path: '/gamedata/productdata/1' }),
      );
    });
  });

  // ── getFurniData ──────────────────────────────────────────────────────────
  describe('getFurniData', () => {
    it('delegates to fetchRaw with FurniDataXml type', async () => {
      sendSpy.mockResolvedValue(mockSend('<furnidata/>'));
      const result = await client.getFurniData();
      expect(result).toBe('<furnidata/>');
      expect(sendSpy).toHaveBeenCalledWith(
        expect.objectContaining({ path: '/gamedata/furnidata_xml/1' }),
      );
    });
  });

  // ── getExternalTexts ──────────────────────────────────────────────────────
  describe('getExternalTexts', () => {
    it('delegates to fetchRaw with ExternalFlashTexts type', async () => {
      sendSpy.mockResolvedValue(mockSend('key=value'));
      const result = await client.getExternalTexts();
      expect(result).toBe('key=value');
      expect(sendSpy).toHaveBeenCalledWith(
        expect.objectContaining({ path: '/gamedata/external_flash_texts/1' }),
      );
    });
  });

  // ── getExternalVariables ──────────────────────────────────────────────────
  describe('getExternalVariables', () => {
    it('delegates to fetchRaw with ExternalVariables type', async () => {
      sendSpy.mockResolvedValue(mockSend('key=value'));
      const result = await client.getExternalVariables();
      expect(result).toBe('key=value');
      expect(sendSpy).toHaveBeenCalledWith(
        expect.objectContaining({ path: '/gamedata/external_variables/1' }),
      );
    });
  });

  // ── getHashes ─────────────────────────────────────────────────────────────
  describe('getHashes', () => {
    it('calls GET /gamedata/hashes via http.request', async () => {
      const requestSpy = vi.spyOn(client.http, 'request').mockResolvedValue({
        hashes: [
          { name: 'furnidata', url: 'https://www.habbo.es/gamedata/furnidata_xml', hash: 'abc123' },
        ],
      } as never);

      const result = await client.getHashes();
      expect(requestSpy).toHaveBeenCalledWith(
        expect.objectContaining({ path: '/gamedata/hashes' }),
      );
      expect(result.hashes).toHaveLength(1);
      expect(result.hashes[0]!.name).toBe('furnidata');
    });

    it('passes signal and headers', async () => {
      const requestSpy = vi.spyOn(client.http, 'request').mockResolvedValue({ hashes: [] } as never);
      const signal = new AbortController().signal;
      await client.getHashes({ signal, headers: { 'X-H': '1' } });
      expect(requestSpy).toHaveBeenCalledWith(
        expect.objectContaining({ signal, headers: { 'X-H': '1' } }),
      );
    });
  });

  // ── buildHashedUrl ────────────────────────────────────────────────────────
  describe('buildHashedUrl', () => {
    it('concatenates entry.url and entry.hash with a slash', () => {
      const entry: GameDataHashEntry = {
        name: 'furnidata',
        url: 'https://www.habbo.es/gamedata/furnidata_xml',
        hash: 'abc123def456',
      };
      expect(client.buildHashedUrl(entry)).toBe(
        'https://www.habbo.es/gamedata/furnidata_xml/abc123def456',
      );
    });

    it('works for any entry type', () => {
      const entry: GameDataHashEntry = {
        name: 'external_variables',
        url: 'https://www.habbo.com.br/gamedata/external_variables',
        hash: 'deadbeef',
      };
      expect(client.buildHashedUrl(entry)).toBe(
        'https://www.habbo.com.br/gamedata/external_variables/deadbeef',
      );
    });
  });

  // ── getParsedFigureData ───────────────────────────────────────────────────
  describe('getParsedFigureData', () => {
    it('fetches XML and returns a parsed FigureData object', async () => {
      sendSpy.mockResolvedValue(
        mockSend('<figuredata><colors></colors><sets></sets></figuredata>'),
      );
      const result = await client.getParsedFigureData();
      expect(result).toHaveProperty('colors');
      expect(result).toHaveProperty('sets');
      expect(Array.isArray(result.colors)).toBe(true);
    });
  });

  // ── getParsedFurniData ────────────────────────────────────────────────────
  describe('getParsedFurniData', () => {
    it('fetches XML and returns a parsed FurniData object', async () => {
      sendSpy.mockResolvedValue(
        mockSend('<furnidata><roomitemtypes></roomitemtypes><wallitemtypes></wallitemtypes></furnidata>'),
      );
      const result = await client.getParsedFurniData();
      expect(result).toHaveProperty('roomitemtypes');
      expect(result).toHaveProperty('wallitemtypes');
      expect(Array.isArray(result.roomitemtypes)).toBe(true);
    });
  });

  // ── getParsedProductData ──────────────────────────────────────────────────
  describe('getParsedProductData', () => {
    it('fetches XML and returns an array of ProductDataEntry', async () => {
      sendSpy.mockResolvedValue(mockSend('<productdata></productdata>'));
      const result = await client.getParsedProductData();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  // ── getExternalTextsMap ───────────────────────────────────────────────────
  describe('getExternalTextsMap', () => {
    it('fetches and parses external_flash_texts into a record', async () => {
      sendSpy.mockResolvedValue(mockSend('greeting=Hello\nfarewell=Goodbye'));
      const map = await client.getExternalTextsMap();
      expect(map).toEqual({ greeting: 'Hello', farewell: 'Goodbye' });
    });

    it('skips blank lines and lines without equals', async () => {
      sendSpy.mockResolvedValue(mockSend('a=1\n\nnoequalssign\nb=2'));
      const map = await client.getExternalTextsMap();
      expect(map).toEqual({ a: '1', b: '2' });
    });
  });

  // ── getClientUrls ─────────────────────────────────────────────────────────
  describe('getClientUrls', () => {
    it('calls GET /gamedata/clienturls via http.request', async () => {
      const requestSpy = vi.spyOn(client.http, 'request').mockResolvedValue({
        'unity-windows-version': '2370',
        'unity-osx-version': '2370',
      } as never);
      const result = await client.getClientUrls();
      expect(requestSpy).toHaveBeenCalledWith(
        expect.objectContaining({ path: '/gamedata/clienturls' }),
      );
      expect(result['unity-windows-version']).toBe('2370');
    });

    it('passes signal and headers', async () => {
      const requestSpy = vi.spyOn(client.http, 'request').mockResolvedValue({} as never);
      const signal = new AbortController().signal;
      await client.getClientUrls({ signal, headers: { 'X-H': '1' } });
      expect(requestSpy).toHaveBeenCalledWith(
        expect.objectContaining({ signal, headers: { 'X-H': '1' } }),
      );
    });
  });

  // ── getExternalVariablesMap ───────────────────────────────────────────────
  describe('getExternalVariablesMap', () => {
    it('parses key=value pairs into a record', async () => {
      sendSpy.mockResolvedValue(mockSend('foo=bar\nbaz=qux'));
      const map = await client.getExternalVariablesMap();
      expect(map).toEqual({ foo: 'bar', baz: 'qux' });
    });

    it('handles CRLF line endings', async () => {
      sendSpy.mockResolvedValue(mockSend('a=1\r\nb=2\r\n'));
      const map = await client.getExternalVariablesMap();
      expect(map).toEqual({ a: '1', b: '2' });
    });

    it('skips blank lines', async () => {
      sendSpy.mockResolvedValue(mockSend('a=1\n\nb=2\n'));
      const map = await client.getExternalVariablesMap();
      expect(map).toEqual({ a: '1', b: '2' });
    });

    it('skips lines without an equals sign', async () => {
      sendSpy.mockResolvedValue(mockSend('no-equals\na=1'));
      const map = await client.getExternalVariablesMap();
      expect(map).toEqual({ a: '1' });
    });

    it('preserves everything after the first = as the value', async () => {
      sendSpy.mockResolvedValue(mockSend('url=https://example.com/path?a=1&b=2'));
      const map = await client.getExternalVariablesMap();
      expect(map['url']).toBe('https://example.com/path?a=1&b=2');
    });

    it('handles an empty document', async () => {
      sendSpy.mockResolvedValue(mockSend(''));
      const map = await client.getExternalVariablesMap();
      expect(map).toEqual({});
    });

    it('trims whitespace from keys', async () => {
      sendSpy.mockResolvedValue(mockSend('  key  =value'));
      const map = await client.getExternalVariablesMap();
      expect(map['key']).toBe('value');
    });
  });
});

// ---------------------------------------------------------------------------
// GameDataHashedClient
// ---------------------------------------------------------------------------
describe('GameDataHashedClient', () => {
  function makeHashed(hashes = MOCK_HASHES) {
    const gamedata = new GameDataClient({ hotel: HabboHotel.ES, fetch: vi.fn() });
    const sendSpy = vi.spyOn(gamedata.http, 'send').mockResolvedValue(mockSend('<data/>'));
    const client = new GameDataHashedClient(gamedata, hashes);
    return { gamedata, client, sendSpy };
  }

  describe('fromHotel', () => {
    it('fetches hashes and returns a ready client', async () => {
      const gamedata = new GameDataClient({ hotel: HabboHotel.ES, fetch: vi.fn() });
      const requestSpy = vi
        .spyOn(gamedata.http, 'request')
        .mockResolvedValue(MOCK_HASHES as never);
      const client = await GameDataHashedClient.fromHotel(gamedata);
      expect(requestSpy).toHaveBeenCalledWith(
        expect.objectContaining({ path: '/gamedata/hashes' }),
      );
      expect(client).toBeInstanceOf(GameDataHashedClient);
      expect(client.hashes).toEqual(MOCK_HASHES);
    });

    it('forwards signal and headers to the hashes request', async () => {
      const gamedata = new GameDataClient({ hotel: HabboHotel.ES, fetch: vi.fn() });
      const requestSpy = vi
        .spyOn(gamedata.http, 'request')
        .mockResolvedValue(MOCK_HASHES as never);
      const signal = new AbortController().signal;
      await GameDataHashedClient.fromHotel(gamedata, { signal, headers: { 'X-H': '1' } });
      expect(requestSpy).toHaveBeenCalledWith(
        expect.objectContaining({ signal, headers: { 'X-H': '1' } }),
      );
    });
  });

  describe('resolveUrl', () => {
    it('builds the full hashed URL for a known type', () => {
      const { client } = makeHashed();
      expect(client.resolveUrl(GameDataType.FurniDataXml)).toBe(
        'https://www.habbo.es/gamedata/furnidata_xml/furni-hash',
      );
      expect(client.resolveUrl(GameDataType.FigureData)).toBe(
        'https://www.habbo.es/gamedata/figuredata/fig-hash',
      );
    });

    it('returns undefined when the type is not present in hashes', () => {
      const { client } = makeHashed({ hashes: [] });
      expect(client.resolveUrl(GameDataType.FigureData)).toBeUndefined();
    });
  });

  describe('fetchRaw', () => {
    it('uses the resolved hashed path (no redirect)', async () => {
      const { client, sendSpy } = makeHashed();
      await client.fetchRaw(GameDataType.FigureData);
      expect(sendSpy).toHaveBeenCalledWith(
        expect.objectContaining({ path: '/gamedata/figuredata/fig-hash' }),
      );
    });

    it('maps every type to its correct hashed path', async () => {
      const { client, sendSpy } = makeHashed();
      await client.getFigureData();
      await client.getFurniData();
      await client.getProductData();
      await client.getExternalVariables();
      await client.getExternalTexts();
      const paths = sendSpy.mock.calls.map((c) => (c[0] as { path: string }).path);
      expect(paths).toContain('/gamedata/figuredata/fig-hash');
      expect(paths).toContain('/gamedata/furnidata_xml/furni-hash');
      expect(paths).toContain('/gamedata/productdata_xml/prod-hash');
      expect(paths).toContain('/gamedata/external_variables/ext-hash');
      expect(paths).toContain('/gamedata/external_flash_texts/txt-hash');
    });

    it('sets Accept: */* and merges per-request headers', async () => {
      const { client, sendSpy } = makeHashed();
      const signal = new AbortController().signal;
      await client.fetchRaw(GameDataType.FigureData, { headers: { 'X-C': 'y' }, signal });
      const call = sendSpy.mock.calls[0]![0] as {
        headers?: Record<string, string>;
        signal?: AbortSignal;
      };
      expect(call.headers?.Accept).toBe('*/*');
      expect(call.headers?.['X-C']).toBe('y');
      expect(call.signal).toBe(signal);
    });

    it('falls back to the redirect-based fetch when type is missing', async () => {
      const { client, sendSpy } = makeHashed({ hashes: [] });
      await client.fetchRaw(GameDataType.FigureData);
      expect(sendSpy).toHaveBeenCalledWith(
        expect.objectContaining({ path: '/gamedata/figuredata/1' }),
      );
    });

    it('returns the response text', async () => {
      const { client, sendSpy } = makeHashed();
      sendSpy.mockResolvedValue(mockSend('<figuredata/>'));
      await expect(client.getFigureData()).resolves.toBe('<figuredata/>');
    });
  });

  describe('parsed maps', () => {
    it('getExternalVariablesMap parses key=value', async () => {
      const { client, sendSpy } = makeHashed();
      sendSpy.mockResolvedValue(mockSend('a=1\nb=2'));
      await expect(client.getExternalVariablesMap()).resolves.toEqual({ a: '1', b: '2' });
    });

    it('getExternalTextsMap parses key=value and skips bad lines', async () => {
      const { client, sendSpy } = makeHashed();
      sendSpy.mockResolvedValue(mockSend('greeting=Hi\n\nnoequals\nbye=Bye'));
      await expect(client.getExternalTextsMap()).resolves.toEqual({ greeting: 'Hi', bye: 'Bye' });
    });
  });

  describe('typed parsers', () => {
    it('getParsedFigureData returns a FigureData object', async () => {
      const { client, sendSpy } = makeHashed();
      sendSpy.mockResolvedValue(mockSend('<figuredata><colors></colors><sets></sets></figuredata>'));
      const result = await client.getParsedFigureData();
      expect(result).toHaveProperty('colors');
      expect(result).toHaveProperty('sets');
    });

    it('getParsedFurniData returns a FurniData object', async () => {
      const { client, sendSpy } = makeHashed();
      sendSpy.mockResolvedValue(
        mockSend('<furnidata><roomitemtypes></roomitemtypes><wallitemtypes></wallitemtypes></furnidata>'),
      );
      const result = await client.getParsedFurniData();
      expect(result).toHaveProperty('roomitemtypes');
      expect(result).toHaveProperty('wallitemtypes');
    });

    it('getParsedProductData returns an array', async () => {
      const { client, sendSpy } = makeHashed();
      sendSpy.mockResolvedValue(mockSend('<productdata></productdata>'));
      await expect(client.getParsedProductData()).resolves.toEqual([]);
    });
  });
});
