import { boolOf, extractBlocks, floatOf, intOf, parseAttrs, textOf } from './xml-utils.js';

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface FurniType {
  id: number;
  classname: string;
  revision: number;
  category: string;
  name: string;
  description: string;
  adurl: string;
  offerid: number;
  buyout: boolean;
  rentofferid: number;
  rentbuyout: boolean;
  bc: boolean;
  excludeddynamic: boolean;
  bcofferid: number;
  customparams: string;
  specialtype: number;
  furniline: string;
  environment: string;
  rare: boolean;
  tradeable: boolean;
  recyclable: boolean;
  /** Part colour hex values (may be `"0"` for uncolored). Present on room items. */
  partcolors: string[];
  /** Room items only. */
  defaultdir?: number;
  /** Room items only — tile width. */
  xdim?: number;
  /** Room items only — tile height. */
  ydim?: number;
  /** Room items only. */
  canstandon?: boolean;
  /** Room items only. */
  cansiton?: boolean;
  /** Room items only. */
  canlayon?: boolean;
  /** Room items only. */
  canputstuffon?: boolean;
  /** Room items only — stack height in tiles. */
  height?: number;
}

export interface FurniData {
  roomitemtypes: FurniType[];
  wallitemtypes: FurniType[];
}

/* -------------------------------------------------------------------------- */
/* Parser                                                                     */
/* -------------------------------------------------------------------------- */

function parseFurniType(attrs: string, body: string): FurniType {
  const a = parseAttrs(attrs);

  const partcolors: string[] = extractBlocks(
    /<partcolors>([\s\S]*?)<\/partcolors>/.exec(body)?.[1] ?? '',
    'color',
  ).map(({ body: v }) => v.trim());

  const hasRoom = body.includes('<xdim>');

  return {
    id: parseInt(a['id'] ?? '0', 10),
    classname: a['classname'] ?? '',
    revision: intOf(body, 'revision'),
    category: textOf(body, 'category'),
    name: textOf(body, 'name'),
    description: textOf(body, 'description'),
    adurl: textOf(body, 'adurl'),
    offerid: intOf(body, 'offerid'),
    buyout: boolOf(body, 'buyout'),
    rentofferid: intOf(body, 'rentofferid'),
    rentbuyout: boolOf(body, 'rentbuyout'),
    bc: boolOf(body, 'bc'),
    excludeddynamic: boolOf(body, 'excludeddynamic'),
    bcofferid: intOf(body, 'bcofferid'),
    customparams: textOf(body, 'customparams'),
    specialtype: intOf(body, 'specialtype'),
    furniline: textOf(body, 'furniline'),
    environment: textOf(body, 'environment'),
    rare: boolOf(body, 'rare'),
    tradeable: boolOf(body, 'tradeable'),
    recyclable: boolOf(body, 'recyclable'),
    partcolors,
    ...(hasRoom && {
      defaultdir: intOf(body, 'defaultdir'),
      xdim: intOf(body, 'xdim'),
      ydim: intOf(body, 'ydim'),
      canstandon: boolOf(body, 'canstandon'),
      cansiton: boolOf(body, 'cansiton'),
      canlayon: boolOf(body, 'canlayon'),
      canputstuffon: boolOf(body, 'canputstuffon'),
      height: floatOf(body, 'height'),
    }),
  };
}

/**
 * Parses a raw `furnidata_xml` XML string into a typed {@link FurniData} object.
 *
 * @param xml - The raw XML string from {@link GameDataClient.getFurniData}.
 */
export function parseFurniData(xml: string): FurniData {
  const roomBlock = /<roomitemtypes>([\s\S]*?)<\/roomitemtypes>/.exec(xml)?.[1] ?? '';
  const wallBlock = /<wallitemtypes>([\s\S]*?)<\/wallitemtypes>/.exec(xml)?.[1] ?? '';

  return {
    roomitemtypes: extractBlocks(roomBlock, 'furnitype').map(({ attrs, body }) =>
      parseFurniType(attrs, body),
    ),
    wallitemtypes: extractBlocks(wallBlock, 'furnitype').map(({ attrs, body }) =>
      parseFurniType(attrs, body),
    ),
  };
}
