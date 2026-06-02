import { describe, expect, it } from 'vitest';
import { FigureGender, FigurePartType } from '../../enums/index.js';
import { parseFigureData } from '../../parsers/figuredata.js';

const SAMPLE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<figuredata>
  <colors>
    <palette id="1">
      <color id="14" index="0" club="0" selectable="1">F5DA88</color>
      <color id="10" index="1" club="2" selectable="0">FFDBC1</color>
    </palette>
    <palette id="2">
      <color id="99" index="0" club="0" selectable="1">#AB1234</color>
    </palette>
  </colors>
  <sets>
    <settype type="hr" paletteid="2" mand_m_0="0" mand_f_0="1" mand_m_1="0" mand_f_1="0">
      <set id="100" gender="M" club="0" colorable="1" selectable="1" preselectable="0">
        <part id="1" type="hr" colorable="1" index="0" colorindex="1"/>
        <part id="2" type="hrb" colorable="0" index="1" colorindex="0"/>
      </set>
      <set id="200" gender="U" club="2" colorable="0" selectable="0" preselectable="1">
      </set>
    </settype>
  </sets>
</figuredata>`;

describe('parseFigureData', () => {
  it('parses palette ids', () => {
    const { colors } = parseFigureData(SAMPLE_XML);
    expect(colors).toHaveLength(2);
    expect(colors[0]!.id).toBe(1);
    expect(colors[1]!.id).toBe(2);
  });

  it('parses color entries within a palette', () => {
    const { colors } = parseFigureData(SAMPLE_XML);
    const palette = colors[0]!;
    expect(palette.colors).toHaveLength(2);

    const first = palette.colors[0]!;
    expect(first.id).toBe(14);
    expect(first.index).toBe(0);
    expect(first.club).toBe(0);
    expect(first.selectable).toBe(true);
    expect(first.value).toBe('F5DA88');

    const second = palette.colors[1]!;
    expect(second.club).toBe(2);
    expect(second.selectable).toBe(false);
  });

  it('strips leading # from hex color values', () => {
    const { colors } = parseFigureData(SAMPLE_XML);
    expect(colors[1]!.colors[0]!.value).toBe('AB1234');
  });

  it('parses settype attributes', () => {
    const { sets } = parseFigureData(SAMPLE_XML);
    expect(sets).toHaveLength(1);
    const st = sets[0]!;
    expect(st.type).toBe('hr');
    expect(st.paletteid).toBe(2);
    expect(st.mand_m_0).toBe(false);
    expect(st.mand_f_0).toBe(true);
    expect(st.mand_m_1).toBe(false);
    expect(st.mand_f_1).toBe(false);
  });

  it('parses sets within a settype', () => {
    const { sets } = parseFigureData(SAMPLE_XML);
    const figureSets = sets[0]!.sets;
    expect(figureSets).toHaveLength(2);

    const first = figureSets[0]!;
    expect(first.id).toBe(100);
    expect(first.gender).toBe(FigureGender.Male);
    expect(first.club).toBe(0);
    expect(first.colorable).toBe(true);
    expect(first.selectable).toBe(true);
    expect(first.preselectable).toBe(false);
  });

  it('parses parts within a set', () => {
    const { sets } = parseFigureData(SAMPLE_XML);
    const parts = sets[0]!.sets[0]!.parts;
    expect(parts).toHaveLength(2);

    expect(parts[0]).toEqual({
      id: 1,
      type: FigurePartType.Hair,
      colorable: true,
      index: 0,
      colorindex: 1,
    });
    expect(parts[1]).toEqual({
      id: 2,
      type: FigurePartType.HairBelow,
      colorable: false,
      index: 1,
      colorindex: 0,
    });
  });

  it('returns empty arrays for empty XML (with color/set sections)', () => {
    const result = parseFigureData('<figuredata><colors></colors><sets></sets></figuredata>');
    expect(result.colors).toHaveLength(0);
    expect(result.sets).toHaveLength(0);
  });

  it('returns empty arrays when colors/sets sections are completely absent', () => {
    // Covers the ?.[1] ?? '' branches when regex finds no match.
    const result = parseFigureData('<figuredata></figuredata>');
    expect(result.colors).toHaveLength(0);
    expect(result.sets).toHaveLength(0);
  });

  it('uses defaults for part attributes that are absent', () => {
    // <part /> (only a space, no attrs) triggers all ?? fallbacks on lines 94-98.
    // <settype> without type attr triggers the type ?? '' fallback on line 112.
    const xml = `<figuredata>
      <colors></colors>
      <sets>
        <settype paletteid="1" mand_m_0="0" mand_f_0="0" mand_m_1="0" mand_f_1="0">
          <set id="1" gender="M" club="0" colorable="0" selectable="0" preselectable="0">
            <part />
          </set>
        </settype>
      </sets>
    </figuredata>`;
    const result = parseFigureData(xml);
    const st = result.sets[0]!;
    expect(st.type).toBe(''); // ?? '' fallback
    const part = st.sets[0]!.parts[0]!;
    expect(part.id).toBe(0);
    expect(part.type).toBe('');
    expect(part.colorable).toBe(false);
    expect(part.index).toBe(0);
    expect(part.colorindex).toBe(0);
  });

  it('uses default values (0 / false / "U") when attributes are missing', () => {
    // Covers the ?? fallbacks in parseInt/parseAttrs lookups.
    const xml = `<figuredata>
      <colors>
        <palette>
          <color>F5DA88</color>
        </palette>
      </colors>
      <sets>
        <settype type="">
          <set>
          </set>
        </settype>
      </sets>
    </figuredata>`;
    const result = parseFigureData(xml);
    const palette = result.colors[0]!;
    expect(palette.id).toBe(0);
    const color = palette.colors[0]!;
    expect(color.id).toBe(0);
    expect(color.index).toBe(0);
    expect(color.club).toBe(0);
    expect(color.selectable).toBe(false);

    const st = result.sets[0]!;
    expect(st.paletteid).toBe(0);
    expect(st.mand_m_0).toBe(false);

    const set = st.sets[0]!;
    expect(set.id).toBe(0);
    expect(set.gender).toBe('U');
    expect(set.club).toBe(0);
  });
});
