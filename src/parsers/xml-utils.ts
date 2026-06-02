/**
 * Minimal, zero-dependency XML utilities for parsing Habbo gamedata files.
 *
 * These parsers work in every JS runtime (Node ≥ 18, browsers, Deno, Bun)
 * without requiring a DOM or external library.
 */

/** Extracts all `key="value"` attributes from a raw XML tag string. */
export function parseAttrs(tagContent: string): Record<string, string> {
  const out: Record<string, string> = {};
  const re = /(\w+)="([^"]*)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(tagContent)) !== null) {
    out[m[1]!] = m[2]!;
  }
  return out;
}

/** Returns the text content of the first `<tag>…</tag>` match within `block`. */
export function textOf(block: string, tag: string): string {
  const re = new RegExp(`<${tag}[^>]*>([^<]*)<\/${tag}>`);
  return re.exec(block)?.[1] ?? '';
}

/** Parses the text content of `<tag>` as an integer (0 when absent or NaN). */
export function intOf(block: string, tag: string): number {
  const v = parseInt(textOf(block, tag), 10);
  return Number.isNaN(v) ? 0 : v;
}

/** Parses the text content of `<tag>` as a float (0 when absent or NaN). */
export function floatOf(block: string, tag: string): number {
  const v = parseFloat(textOf(block, tag));
  return Number.isNaN(v) ? 0 : v;
}

/** Returns `true` when the text content of `<tag>` is exactly `"1"`. */
export function boolOf(block: string, tag: string): boolean {
  return textOf(block, tag) === '1';
}

/**
 * Extracts every occurrence of `<tag attrs>body</tag>` from `xml`.
 * Returns an array of `{ attrs, body }` pairs.
 */
export function extractBlocks(
  xml: string,
  tag: string,
): Array<{ attrs: string; body: string }> {
  const results: Array<{ attrs: string; body: string }> = [];
  const re = new RegExp(`<${tag}(\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, 'g');
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    // m[1] can be undefined when the optional attrs group doesn't match (tag has no attributes).
    // m[2] is always a string (non-optional group), so the ?? '' is an unreachable safety net.
    /* v8 ignore next */
    results.push({ attrs: m[1] ?? '', body: m[2] ?? '' });
  }
  return results;
}

/**
 * Extracts every self-closing `<tag attrs/>` from `xml`.
 * Returns an array of raw attribute strings.
 */
export function extractSelfClosing(xml: string, tag: string): string[] {
  const results: string[] = [];
  const re = new RegExp(`<${tag}(\\s[^/]*?)\\s*/>`, 'g');
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    // m[1] is always a string when the regex matches (the group is required),
    // so the ?? '' is an unreachable safety net.
    /* v8 ignore next */
    results.push(m[1] ?? '');
  }
  return results;
}
