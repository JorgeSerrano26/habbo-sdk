import { describe, expect, it } from 'vitest';
import {
  boolOf,
  extractBlocks,
  extractSelfClosing,
  floatOf,
  intOf,
  parseAttrs,
  textOf,
} from '../../parsers/xml-utils.js';

describe('parseAttrs', () => {
  it('extracts multiple key=value attributes', () => {
    expect(parseAttrs(' id="42" type="hr" colorable="1"')).toEqual({
      id: '42',
      type: 'hr',
      colorable: '1',
    });
  });

  it('returns an empty object when there are no attributes', () => {
    expect(parseAttrs('')).toEqual({});
  });

  it('handles empty attribute values', () => {
    expect(parseAttrs(' adurl=""')).toEqual({ adurl: '' });
  });
});

describe('textOf', () => {
  it('returns the text content of a tag', () => {
    expect(textOf('<revision>61856</revision>', 'revision')).toBe('61856');
  });

  it('returns empty string when the tag is absent', () => {
    expect(textOf('<name>Shelf</name>', 'revision')).toBe('');
  });

  it('returns empty string for a self-closing or empty tag', () => {
    expect(textOf('<adurl></adurl>', 'adurl')).toBe('');
  });
});

describe('intOf', () => {
  it('parses a positive integer', () => {
    expect(intOf('<xdim>2</xdim>', 'xdim')).toBe(2);
  });

  it('parses a negative integer', () => {
    expect(intOf('<offerid>-1</offerid>', 'offerid')).toBe(-1);
  });

  it('returns 0 when the tag is absent', () => {
    expect(intOf('<name>x</name>', 'missing')).toBe(0);
  });

  it('returns 0 for non-numeric content', () => {
    expect(intOf('<val>abc</val>', 'val')).toBe(0);
  });
});

describe('floatOf', () => {
  it('parses a float string', () => {
    expect(floatOf('<height>1.5</height>', 'height')).toBe(1.5);
  });

  it('returns 0 when absent', () => {
    expect(floatOf('<x>other</x>', 'height')).toBe(0);
  });
});

describe('boolOf', () => {
  it('returns true for "1"', () => {
    expect(boolOf('<buyout>1</buyout>', 'buyout')).toBe(true);
  });

  it('returns false for "0"', () => {
    expect(boolOf('<buyout>0</buyout>', 'buyout')).toBe(false);
  });

  it('returns false when the tag is absent', () => {
    expect(boolOf('<other>1</other>', 'buyout')).toBe(false);
  });
});

describe('extractBlocks', () => {
  it('extracts multiple blocks with attrs and body', () => {
    const xml = '<color id="1" index="0">F5DA88</color><color id="2" index="1">FFDBC1</color>';
    const blocks = extractBlocks(xml, 'color');
    expect(blocks).toHaveLength(2);
    expect(blocks[0]!.attrs).toContain('id="1"');
    expect(blocks[0]!.body).toBe('F5DA88');
    expect(blocks[1]!.body).toBe('FFDBC1');
  });

  it('returns an empty array when there are no matches', () => {
    expect(extractBlocks('<other/>', 'color')).toHaveLength(0);
  });

  it('handles tags with no attributes', () => {
    const xml = '<name>Shelf</name>';
    const blocks = extractBlocks(xml, 'name');
    expect(blocks[0]!.attrs).toBe('');
    expect(blocks[0]!.body).toBe('Shelf');
  });

  it('handles multiline body content', () => {
    const xml = '<set id="1">\n<part id="2"/>\n</set>';
    const blocks = extractBlocks(xml, 'set');
    expect(blocks).toHaveLength(1);
    expect(blocks[0]!.body).toContain('<part');
  });
});

describe('extractSelfClosing', () => {
  it('extracts self-closing tags and returns attribute strings', () => {
    const xml = '<part id="1" type="hr" colorable="1" index="0" colorindex="1"/>';
    const result = extractSelfClosing(xml, 'part');
    expect(result).toHaveLength(1);
    expect(result[0]).toContain('id="1"');
    expect(result[0]).toContain('type="hr"');
  });

  it('extracts multiple self-closing tags', () => {
    const xml = '<part id="1" type="hr"/><part id="2" type="hrb"/>';
    expect(extractSelfClosing(xml, 'part')).toHaveLength(2);
  });

  it('returns empty array when none found', () => {
    expect(extractSelfClosing('<name>x</name>', 'part')).toHaveLength(0);
  });
});
