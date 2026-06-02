/**
 * habbo-sdk — type-safe, hotel-configurable SDK for the public
 * Habbo & Habbo Origins Web API and gamedata files.
 *
 * @packageDocumentation
 */

// Facade
export { HabboSDK } from './sdk.js';

// Clients
export { BaseClient } from './clients/base.js';
export { HabboClient } from './clients/habbo.js';
export { HabboOriginsClient } from './clients/origins.js';
export { GameDataClient } from './clients/gamedata.js';

// HTTP layer (useful for custom clients / advanced usage)
export { HttpClient, buildBaseUrl } from './http.js';
export type { HttpRequest, QueryValue } from './http.js';

// Errors
export {
  HabboApiError,
  HabboBadRequestError,
  HabboUnauthorizedError,
  HabboForbiddenError,
  HabboNotFoundError,
  UserNotFoundError,
  GroupNotFoundError,
  RoomNotFoundError,
  BadgeNotFoundError,
  AchievementNotFoundError,
  MatchNotFoundError,
  DerbyNotFoundError,
  PlayerNotFoundError,
  HabboRateLimitError,
  HabboServerError,
  HabboTimeoutError,
  createHabboApiError,
} from './errors.js';
export type { HabboApiErrorInit, ErrorContext } from './errors.js';

// Enums
export {
  HabboHotel,
  SkillType,
  GameDataType,
  GameDataHashName,
  HttpMethod,
  HabboResource,
} from './enums.js';

// Types
export type * from './types.js';

// Parsers (standalone functions + types)
export {
  parseFigureData,
  parseFurniData,
  parseProductData,
} from './parsers/index.js';
export type {
  FigureColor,
  FigureData,
  FigurePalette,
  FigurePart,
  FigureSet,
  FigureSetType,
  FurniData,
  FurniType,
  ProductDataEntry,
} from './parsers/index.js';
