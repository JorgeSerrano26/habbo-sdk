# Gamedata — `GameDataClient`

Habbo gamedata files. Access via `sdk.gamedata` or `new GameDataClient(config)`.

`GET /gamedata/{type}/{revision}` answers with a `307` redirect to a hashed,
immutable URL. `fetch` follows the redirect transparently, so callers receive
the file contents directly. All file methods default to `revision = 1`, which
the API resolves to the current version.

> Gamedata values differ **per hotel** — this client uses the same configured
> domain as the rest of the SDK.

## How the hash is resolved (the server does it for you)

With this client **you never touch the hash**. You just request the
revision-`1` URL, and the Habbo server redirects you to the hashed file:

```
GET https://www.habbo.es/gamedata/figuredata/1
  → 307 https://www.habbo.es/gamedata/figuredata/<hash>   (fetch follows automatically)
```

- The **hotel** comes from your configured `baseUrl` (`hotel: HabboHotel.ES`).
- The **hash** is supplied by that hotel's server, in the `307` redirect.

So `getFigureData()` is fully automatic — one call, no hash management. The
trade-off is **one redirect per file** (a `307` hop + the file itself).

> Loading **several** files from the same hotel? Fetch the hash table **once**
> and use [`GameDataHashedClient`](gamedata-hashes.md) to skip the per-file
> redirect. See [which one should I use?](#which-client-should-i-use) below.

## Which client should I use?

| | `GameDataClient` (this page) | [`GameDataHashedClient`](gamedata-hashes.md) |
|---|---|---|
| **Who supplies the hash?** | The server, via the `307` redirect (automatic). | You — fetched once from `/gamedata/hashes` and reused. |
| **Who supplies the hotel?** | The configured `baseUrl`. | The configured `baseUrl`. |
| **Requests per file** | 1 call (`307` hop + file). | Direct to the CDN, no redirect. |
| **Best for** | One or two individual files. | Loading several files from the same hotel. |
| **Caching** | Nothing to cache. | Cache the hashes (or the client) — your responsibility. |

**Rule of thumb:** one file → use `GameDataClient`. Many files → fetch hashes
once with `GameDataHashedClient` and go direct.

## Raw fetches

| Method | File type | Returns |
|--------|-----------|---------|
| `getFigureData(revision?, options?)` | `figuredata` | XML string |
| `getProductData(revision?, options?)` | `productdata` | XML string |
| `getFurniData(revision?, options?)` | `furnidata_xml` | XML string |
| `getExternalVariables(revision?, options?)` | `external_variables` | raw `key=value` text |
| `getExternalVariablesMap(revision?, options?)` | `external_variables` | `Record<string, string>` |
| `getExternalTexts(revision?, options?)` | `external_flash_texts` | raw `key=value` text |
| `getExternalTextsMap(revision?, options?)` | `external_flash_texts` | `Record<string, string>` |
| `resolveUrl(type, revision?, options?)` | any `GameDataType` | resolved hashed URL (no body download) |
| `fetchRaw(type, revision?, options?)` | any `GameDataType` | raw string contents |

```ts
import { GameDataType } from '@jorgeserrano26/habbo-sdk';

const url  = await sdk.gamedata.resolveUrl(GameDataType.FurniDataXml);
// → "https://www.habbo.es/gamedata/furnidata_xml/<hash>"

const vars = await sdk.gamedata.getExternalVariablesMap();
console.log(vars['flash.client.url']);
```

The `GameDataType` enum: `FigureData`, `ProductData`, `FurniDataXml`,
`ExternalVariables`, `ExternalFlashTexts`.

## Parsed (XML → typed objects)

| Method | Endpoint type | Returns |
|--------|---------------|---------|
| `getParsedFigureData(revision?, options?)` | `figuredata` | `FigureData` (colors, palettes, set-types, sets, parts) |
| `getParsedFurniData(revision?, options?)` | `furnidata_xml` | `FurniData` (room + wall furniture types) |
| `getParsedProductData(revision?, options?)` | `productdata` | `ProductDataEntry[]` |

```ts
const furni = await sdk.gamedata.getParsedFurniData();
console.log(furni.roomitemtypes[0].name);
```

You can also call the standalone parsers on any XML string:
`parseFigureData(xml)`, `parseFurniData(xml)`, `parseProductData(xml)`.

### Figure enums

`parseFigureData` returns typed `FigureGender` and `FigurePartType` values
(falling back to `string` for unknown codes):

- `FigureGender` — `Male` (`'M'`), `Female` (`'F'`), `Unisex` (`'U'`).
- `FigurePartType` — `Hair` (`'hr'`), `Head` (`'hd'`), `Chest` (`'ch'`),
  `Legs` (`'lg'`), `Shoes` (`'sh'`), `Hat` (`'ha'`), … (18 part-type codes).

## Hashes & client URLs

| Method | Endpoint | Returns |
|--------|----------|---------|
| `getHashes(options?)` | `GET /gamedata/hashes` | `GameDataHashesResponse` — every asset hash in one request. |
| `buildHashedUrl(entry)` | — | Full immutable URL for a hash entry (`entry.url + "/" + entry.hash`). |
| `getClientUrls(options?)` | `GET /gamedata/clienturls` | `ClientUrlsResponse` — Unity/Flash client downloads + versions. |

```ts
const { hashes } = await sdk.gamedata.getHashes();
for (const entry of hashes) {
  console.log(entry.name, sdk.gamedata.buildHashedUrl(entry));
}

const urls = await sdk.gamedata.getClientUrls();
console.log(urls['unity-windows'], urls['unity-windows-version']);
```

> For repeated asset loading from those hashes, see
> [`GameDataHashedClient`](gamedata-hashes.md).

---

See [errors](errors.md) for exceptions on non-2xx responses.
