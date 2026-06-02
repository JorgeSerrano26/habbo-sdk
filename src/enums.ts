/**
 * Enumerations used across the Habbo SDK.
 */

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

/**
 * Skill types supported by the Habbo Origins skills endpoints.
 */
export enum SkillType {
  Fishing = 'FISHING',
}

/**
 * Gamedata file types served from `/gamedata/{type}/{revision}`.
 *
 * Requesting a revision performs a 307 redirect to the hashed, immutable
 * URL of the current data file.
 */
export enum GameDataType {
  /** Avatar figure/clothing definitions (XML). */
  FigureData = 'figuredata',
  /** Catalogue product definitions (XML). */
  ProductData = 'productdata',
  /** Furniture definitions (XML). */
  FurniDataXml = 'furnidata_xml',
  /** Client external variables / config (key=value text). */
  ExternalVariables = 'external_variables',
  /** Client external flash texts / UI strings (key=value text). */
  ExternalFlashTexts = 'external_flash_texts',
}

/**
 * Gender codes used in Habbo figure data.
 */
export enum FigureGender {
  Male = 'M',
  Female = 'F',
  /** Unisex — applies to both genders. */
  Unisex = 'U',
}

/**
 * Body-part type codes used in Habbo figure sets and figure parts.
 *
 * These codes identify a specific part slot in the avatar figure system.
 * A `FigureSetType.type` names a category of sets (e.g. all hairstyles),
 * and a `FigurePart.type` names the asset layer within a set.
 */
export enum FigurePartType {
  Hair = 'hr',
  HairBelow = 'hrb',
  Head = 'hd',
  Chest = 'ch',
  Legs = 'lg',
  Shoes = 'sh',
  Hat = 'ha',
  HeadAccessory = 'he',
  EarAccessory = 'ea',
  Eyes = 'ey',
  FaceAccessory = 'fa',
  Face = 'fc',
  ChestAccessory = 'ca',
  Coat = 'cc',
  ChestPrint = 'cp',
  WaistAccessory = 'wa',
  Body = 'bd',
  LeftHandItem = 'lc',
}

/**
 * Known `name` values returned by the `GET /gamedata/hashes` endpoint.
 *
 * The values match the `name` field in each {@link GameDataHashEntry}.
 * Other names may appear if Habbo adds new assets in the future.
 */
export enum GameDataHashName {
  /** Furniture data (`furnidata_xml` path). */
  Furnidata = 'furnidata',
  /** Product catalogue data (`productdata_xml` path). */
  Productdata = 'productdata',
  /** External client variables (`external_variables` path). */
  ExternalVariables = 'external_variables',
  /** External flash UI texts (`external_flash_texts` path). */
  ExternalTexts = 'external_texts',
  /** Avatar figure-part list / figuredata (`figuredata` path). */
  FigurePartList = 'figurepartlist',
}

/**
 * HTTP methods used internally by the SDK.
 */
export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
}

/**
 * Logical resource a request targets. Used to raise resource-specific,
 * controlled errors (e.g. {@link UserNotFoundError}) instead of a generic
 * {@link HabboNotFoundError} when the API answers `404`.
 */
export enum HabboResource {
  User = 'user',
  Group = 'group',
  Room = 'room',
  Badge = 'badge',
  Achievement = 'achievement',
  Match = 'match',
  Derby = 'derby',
  Player = 'player',
}
