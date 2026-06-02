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
 * Known `name` values returned by the `GET /gamedata/hashes` endpoint.
 *
 * The values match the `name` field in each `GameDataHashEntry`.
 * Other names may appear if Habbo adds new assets in the future.
 */
export enum GameDataHashName {
  /** Furniture data (`furnidata_xml` path). */
  Furnidata = 'furnidata',
  /** Product catalogue data (`productdata_xml` path). */
  Productdata = 'productdata',
  /** External client variables (`external_variables` path). */
  ExternalVariables = 'external_variables',
  /** External flash UI texts (`external_texts` path). */
  ExternalTexts = 'external_texts',
  /** Avatar figure-part list / figuredata (`figuredata` path). */
  FigurePartList = 'figurepartlist',
}
