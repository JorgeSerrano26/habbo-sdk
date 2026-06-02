import { describe, expect, it } from 'vitest';
import { parseFurniData } from '../../parsers/furnidata.js';

const ROOM_ITEM = `<furnitype id="13" classname="shelves_norja"><revision>61856</revision><category>shelf</category><defaultdir>0</defaultdir><xdim>1</xdim><ydim>1</ydim><partcolors><color>#ffffff</color><color>#F7EBBC</color></partcolors><name>Estante</name><description>Para itens decorativos</description><adurl></adurl><offerid>5</offerid><buyout>1</buyout><rentofferid>-1</rentofferid><rentbuyout>0</rentbuyout><bc>1</bc><excludeddynamic>0</excludeddynamic><bcofferid>5</bcofferid><customparams></customparams><specialtype>1</specialtype><canstandon>0</canstandon><cansiton>1</cansiton><canlayon>0</canlayon><canputstuffon>1</canputstuffon><height>1.5</height><furniline>iced</furniline><environment></environment><rare>0</rare><tradeable>1</tradeable><recyclable>1</recyclable></furnitype>`;

const WALL_ITEM = `<furnitype id="1" classname="post.it"><revision>0</revision><category></category><name>Sticky Note</name><description>Sticky notes</description><adurl></adurl><offerid>-1</offerid><buyout>0</buyout><rentofferid>-1</rentofferid><rentbuyout>0</rentbuyout><bc>0</bc><excludeddynamic>0</excludeddynamic><bcofferid>-1</bcofferid><specialtype>5</specialtype><furniline></furniline><environment></environment><rare>0</rare><tradeable>0</tradeable><recyclable>0</recyclable></furnitype>`;

const SAMPLE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<furnidata>
  <roomitemtypes>${ROOM_ITEM}</roomitemtypes>
  <wallitemtypes>${WALL_ITEM}</wallitemtypes>
</furnidata>`;

describe('parseFurniData', () => {
  describe('room items', () => {
    it('parses id and classname from attributes', () => {
      const { roomitemtypes } = parseFurniData(SAMPLE_XML);
      expect(roomitemtypes[0]!.id).toBe(13);
      expect(roomitemtypes[0]!.classname).toBe('shelves_norja');
    });

    it('parses element-based text fields', () => {
      const item = parseFurniData(SAMPLE_XML).roomitemtypes[0]!;
      expect(item.revision).toBe(61856);
      expect(item.category).toBe('shelf');
      expect(item.name).toBe('Estante');
      expect(item.description).toBe('Para itens decorativos');
      expect(item.offerid).toBe(5);
      expect(item.bcofferid).toBe(5);
      expect(item.specialtype).toBe(1);
      expect(item.furniline).toBe('iced');
    });

    it('parses boolean fields', () => {
      const item = parseFurniData(SAMPLE_XML).roomitemtypes[0]!;
      expect(item.buyout).toBe(true);
      expect(item.rentbuyout).toBe(false);
      expect(item.bc).toBe(true);
      expect(item.excludeddynamic).toBe(false);
      expect(item.rare).toBe(false);
      expect(item.tradeable).toBe(true);
      expect(item.recyclable).toBe(true);
    });

    it('parses room-specific dimension and interaction fields', () => {
      const item = parseFurniData(SAMPLE_XML).roomitemtypes[0]!;
      expect(item.defaultdir).toBe(0);
      expect(item.xdim).toBe(1);
      expect(item.ydim).toBe(1);
      expect(item.canstandon).toBe(false);
      expect(item.cansiton).toBe(true);
      expect(item.canlayon).toBe(false);
      expect(item.canputstuffon).toBe(true);
      expect(item.height).toBe(1.5);
    });

    it('parses partcolors as an array of strings', () => {
      const item = parseFurniData(SAMPLE_XML).roomitemtypes[0]!;
      expect(item.partcolors).toEqual(['#ffffff', '#F7EBBC']);
    });
  });

  describe('wall items', () => {
    it('parses basic fields on wall items', () => {
      const item = parseFurniData(SAMPLE_XML).wallitemtypes[0]!;
      expect(item.id).toBe(1);
      expect(item.classname).toBe('post.it');
      expect(item.name).toBe('Sticky Note');
      expect(item.specialtype).toBe(5);
      expect(item.tradeable).toBe(false);
    });

    it('does not include room-specific fields on wall items', () => {
      const item = parseFurniData(SAMPLE_XML).wallitemtypes[0]!;
      expect(item.xdim).toBeUndefined();
      expect(item.ydim).toBeUndefined();
      expect(item.cansiton).toBeUndefined();
      expect(item.height).toBeUndefined();
    });
  });

  it('returns empty arrays for empty XML (sections present)', () => {
    const result = parseFurniData(
      '<furnidata><roomitemtypes></roomitemtypes><wallitemtypes></wallitemtypes></furnidata>',
    );
    expect(result.roomitemtypes).toHaveLength(0);
    expect(result.wallitemtypes).toHaveLength(0);
  });

  it('returns empty arrays when roomitemtypes/wallitemtypes sections are absent', () => {
    // Covers the ?.[1] ?? '' branches on lines 110-111 when the regex finds no match.
    const result = parseFurniData('<furnidata></furnidata>');
    expect(result.roomitemtypes).toHaveLength(0);
    expect(result.wallitemtypes).toHaveLength(0);
  });

  it('uses default values when furnitype attributes are missing', () => {
    // Covers the ?? '0' and ?? '' fallbacks in parseFurniType.
    const xml = '<furnidata><roomitemtypes><furnitype></furnitype></roomitemtypes><wallitemtypes></wallitemtypes></furnidata>';
    const item = parseFurniData(xml).roomitemtypes[0]!;
    expect(item.id).toBe(0);
    expect(item.classname).toBe('');
    expect(item.revision).toBe(0);
    expect(item.offerid).toBe(0);
    expect(item.buyout).toBe(false);
    expect(item.partcolors).toEqual([]);
  });
});
