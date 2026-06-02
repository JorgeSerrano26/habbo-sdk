/**
 * Parser for Habbo's `key=value` text files (`external_variables`,
 * `external_flash_texts`). Shared by the gamedata clients.
 */

/**
 * Parses `key=value` text into a record. Blank lines and lines without an `=`
 * are skipped; only the first `=` splits the key from the value.
 *
 * @param raw - The raw `key=value` document.
 * @returns A record mapping each key to its (untrimmed) value.
 */
export function parseKeyValue(raw: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    result[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1);
  }
  return result;
}
