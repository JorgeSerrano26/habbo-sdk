/**
 * Response models for the modern Habbo Web API.
 *
 * Shapes are derived from the public OpenAPI document published at
 * `https://www.habbo.<hotel>/api/public/api-docs/`.
 */

export interface AchievementInfo {
  id: number;
  name: string;
  creationTime: string;
  state: string;
  category: string;
}

export interface AchievementLevelRequirement {
  level: number;
  requiredScore: number;
}

export interface Achievement {
  achievement: AchievementInfo;
  levelRequirements: AchievementLevelRequirement[];
}

export interface BadgeOwners {
  ownerCount: number;
  name: string;
  description: string;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  type: string;
  roomId: string;
  badgeCode: string;
}

export interface GroupMember {
  online: boolean;
  gender: string;
  motto: string;
  habboFigure: string;
  memberSince: string;
  uniqueId: string;
  name: string;
  isAdmin: boolean;
}

export interface SelectedBadge {
  badgeIndex?: number;
  code: string;
  name?: string;
  description?: string;
}

export interface User {
  uniqueId: string;
  name: string;
  figureString: string;
  motto: string;
  online: boolean;
  lastAccessTime: string;
  memberSince: string;
  profileVisible: boolean;
  currentLevel: number;
  currentLevelCompletePercent: number;
  totalExperience: number;
  starGemCount: number;
  selectedBadges: SelectedBadge[];
}

export interface UserBadge {
  code: string;
  name: string;
  description: string;
}

export interface Friend {
  name: string;
  uniqueId: string;
  figureString?: string;
  motto?: string;
  online?: boolean;
}

export interface Room {
  id: number;
  name: string;
  description: string;
  creationTime: string;
  habboGroupId: string;
  tags: string[];
  maximumVisitors: number;
  showOwnerName: boolean;
  ownerName: string;
  ownerUniqueId: string;
  categories: string[];
  thumbnailUrl: string;
  imageUrl: string;
  rating: number;
  uniqueId: string;
}

/** A user profile bundles the user with their related collections. */
export interface UserProfile extends User {
  groups: Group[];
  badges: UserBadge[];
  friends: Friend[];
  rooms: Room[];
}

/** A single "hot look" entry. Shape is loosely typed as the API is sparse. */
export type HotLook = Record<string, unknown>;

/* ---- Marketplace ---- */

export interface MarketplaceStatsBatchRequest {
  /** Room (floor) item class names to retrieve stats for. */
  roomItems?: Array<{ item: string }>;
  /** Wall item class names to retrieve stats for. */
  wallItems?: Array<{ item: string }>;
}

export interface MarketplaceHistoryPoint {
  dayOffset: string;
  averagePrice: string;
  totalSoldItems: string;
  totalCreditSum: string;
  totalOpenOffers: string;
}

export interface MarketplaceItemStats {
  item: string;
  statsDate: string;
  history: MarketplaceHistoryPoint[];
  soldItemCount: number;
  creditSum: number;
  averagePrice: number;
  totalOpenOffers: number;
  currentOpenOffers: number;
  currentPrice: number;
  historyLimitInDays: number;
}

export interface MarketplaceStatsBatchResponse {
  status: string;
  roomItemData: MarketplaceItemStats[];
  wallItemData: MarketplaceItemStats[];
}
