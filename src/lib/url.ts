import type { HabboHotel } from '../enums/index.js';

/**
 * Builds the base URL for a hotel.
 *
 * @example buildBaseUrl(HabboHotel.ES) -> "https://www.habbo.es"
 */
export function buildBaseUrl(hotel: HabboHotel | string): string {
  return `https://www.habbo.${hotel}`;
}
