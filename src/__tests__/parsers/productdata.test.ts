import { describe, expect, it } from 'vitest';
import { parseProductData } from '../../parsers/productdata.js';

const SAMPLE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<productdata>
  <product code="_hween12_scarecrow">
    <name>Scarecrow</name>
    <description>A spooky scarecrow.</description>
  </product>
  <product code="wf_promo1">
    <name></name>
    <description></description>
  </product>
</productdata>`;

describe('parseProductData', () => {
  it('returns an entry per product', () => {
    const entries = parseProductData(SAMPLE_XML);
    expect(entries).toHaveLength(2);
  });

  it('parses code, name, and description', () => {
    const entries = parseProductData(SAMPLE_XML);
    expect(entries[0]).toEqual({
      code: '_hween12_scarecrow',
      name: 'Scarecrow',
      description: 'A spooky scarecrow.',
    });
  });

  it('handles empty name and description', () => {
    const entries = parseProductData(SAMPLE_XML);
    expect(entries[1]).toEqual({
      code: 'wf_promo1',
      name: '',
      description: '',
    });
  });

  it('returns an empty array for empty productdata', () => {
    expect(parseProductData('<productdata></productdata>')).toHaveLength(0);
  });

  it('uses empty string as default when code attribute is missing', () => {
    // Covers the a['code'] ?? '' fallback.
    const entry = parseProductData('<productdata><product><name>X</name><description>Y</description></product></productdata>')[0]!;
    expect(entry.code).toBe('');
    expect(entry.name).toBe('X');
  });
});
