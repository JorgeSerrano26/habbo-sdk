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
