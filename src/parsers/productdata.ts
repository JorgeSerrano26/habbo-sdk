import { extractBlocks, parseAttrs, textOf } from './xml-utils.js';

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface ProductDataEntry {
  /** Catalogue product code. */
  code: string;
  name: string;
  description: string;
}

/* -------------------------------------------------------------------------- */
/* Parser                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Parses a raw `productdata` XML string into an array of {@link ProductDataEntry}.
 *
 * @param xml - The raw XML string from {@link GameDataClient.getProductData}.
 */
export function parseProductData(xml: string): ProductDataEntry[] {
  return extractBlocks(xml, 'product').map(({ attrs, body }) => {
    const a = parseAttrs(attrs);
    return {
      code: a['code'] ?? '',
      name: textOf(body, 'name'),
      description: textOf(body, 'description'),
    };
  });
}
