import { boolOf, extractBlocks, extractSelfClosing, intOf, parseAttrs, textOf } from './xml-utils.js';

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface FigureColor {
  id: number;
  index: number;
  club: number;
  selectable: boolean;
  /** Hex color value without the `#` prefix (e.g. `"F5DA88"`). */
  value: string;
}

export interface FigurePalette {
  id: number;
  colors: FigureColor[];
}

export interface FigurePart {
  id: number;
  type: string;
  colorable: boolean;
  index: number;
  colorindex: number;
}

export interface FigureSet {
  id: number;
  /** `"M"` | `"F"` | `"U"` */
  gender: string;
  club: number;
  colorable: boolean;
  selectable: boolean;
  preselectable: boolean;
  parts: FigurePart[];
}

export interface FigureSetType {
  /** Body-part type code, e.g. `"hr"` (hair), `"hd"` (head), `"ch"` (chest). */
  type: string;
  paletteid: number;
  mand_m_0: boolean;
  mand_f_0: boolean;
  mand_m_1: boolean;
  mand_f_1: boolean;
  sets: FigureSet[];
}

export interface FigureData {
  colors: FigurePalette[];
  sets: FigureSetType[];
}

/* -------------------------------------------------------------------------- */
/* Parser                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Parses a raw `figuredata` XML string into a typed {@link FigureData} object.
 *
 * @param xml - The raw XML string from {@link GameDataClient.getFigureData}.
 */
export function parseFigureData(xml: string): FigureData {
  const colorsBlock = /<colors>([\s\S]*?)<\/colors>/.exec(xml)?.[1] ?? '';
  const setsBlock = /<sets>([\s\S]*?)<\/sets>/.exec(xml)?.[1] ?? '';

  const colors: FigurePalette[] = extractBlocks(colorsBlock, 'palette').map(({ attrs, body }) => {
    const a = parseAttrs(attrs);
    const colorNodes = extractBlocks(body, 'color');
    return {
      id: parseInt(a['id'] ?? '0', 10),
      colors: colorNodes.map(({ attrs: ca, body: value }) => {
        const c = parseAttrs(ca);
        return {
          id: parseInt(c['id'] ?? '0', 10),
          index: parseInt(c['index'] ?? '0', 10),
          club: parseInt(c['club'] ?? '0', 10),
          selectable: c['selectable'] === '1',
          value: value.replace('#', '').trim(),
        };
      }),
    };
  });

  const sets: FigureSetType[] = extractBlocks(setsBlock, 'settype').map(({ attrs, body }) => {
    const a = parseAttrs(attrs);
    const figureSets: FigureSet[] = extractBlocks(body, 'set').map(({ attrs: sa, body: sb }) => {
      const s = parseAttrs(sa);
      const parts: FigurePart[] = extractSelfClosing(sb, 'part').map((pa) => {
        const p = parseAttrs(pa);
        return {
          id: parseInt(p['id'] ?? '0', 10),
          type: p['type'] ?? '',
          colorable: p['colorable'] === '1',
          index: parseInt(p['index'] ?? '0', 10),
          colorindex: parseInt(p['colorindex'] ?? '0', 10),
        };
      });
      return {
        id: parseInt(s['id'] ?? '0', 10),
        gender: s['gender'] ?? 'U',
        club: parseInt(s['club'] ?? '0', 10),
        colorable: s['colorable'] === '1',
        selectable: s['selectable'] === '1',
        preselectable: s['preselectable'] === '1',
        parts,
      };
    });
    return {
      type: a['type'] ?? '',
      paletteid: parseInt(a['paletteid'] ?? '0', 10),
      mand_m_0: a['mand_m_0'] === '1',
      mand_f_0: a['mand_f_0'] === '1',
      mand_m_1: a['mand_m_1'] === '1',
      mand_f_1: a['mand_f_1'] === '1',
      sets: figureSets,
    };
  });

  return { colors, sets };
}
