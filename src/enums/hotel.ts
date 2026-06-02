/**
 * Available Habbo hotels.
 *
 * The value is the top-level domain suffix that is appended to
 * `https://www.habbo.` to build the base URL for a hotel.
 *
 * @example
 * `HabboHotel.ES` -> https://www.habbo.es
 * `HabboHotel.BR` -> https://www.habbo.com.br
 */
export enum HabboHotel {
  /** International / English (`www.habbo.com`). */
  COM = 'com',
  /** Brazil (`www.habbo.com.br`). */
  BR = 'com.br',
  /** Germany (`www.habbo.de`). */
  DE = 'de',
  /** Spain (`www.habbo.es`). */
  ES = 'es',
  /** Finland (`www.habbo.fi`). */
  FI = 'fi',
  /** France (`www.habbo.fr`). */
  FR = 'fr',
  /** Italy (`www.habbo.it`). */
  IT = 'it',
  /** Netherlands (`www.habbo.nl`). */
  NL = 'nl',
  /** Turkey (`www.habbo.com.tr`). */
  TR = 'com.tr',
}
