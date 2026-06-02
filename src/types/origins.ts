/**
 * Response models for the Habbo Origins Web API.
 */

import type { SkillType } from '../enums/index.js';

export interface MatchParticipant {
  gamePlayerId: string;
  gameScore: number;
  playerPlacement: number;
  teamId: number;
  teamPlacement: number;
  timesStunned: number;
  powerUpPickups: number;
  powerUpActivations: number;
  tilesCleaned: number;
  tilesColoured: number;
  tilesStolen: number;
  tilesLocked: number;
  tilesColouredForOpponents: number;
}

export interface MatchTeam {
  teamId: number;
  win: boolean;
  teamScore: number;
  teamPlacement: number;
}

export interface MatchDetails {
  metadata: {
    matchId: string;
    participantPlayerIds: string[];
  };
  info: {
    gameCreation: number;
    gameDuration: number;
    gameEnd: number;
    gameMode: string;
    mapId: number;
    ranked: boolean;
    participants: MatchParticipant[];
    teams: MatchTeam[];
  };
}

/** Fishing derby details. Loosely typed as the schema is unspecified. */
export type DerbyDetails = Record<string, unknown>;

/** Current fishing derby status. Loosely typed as the schema is unspecified. */
export type DerbyStatus = Record<string, unknown>;

export interface PlayerSkill {
  level: number;
  experience: number;
}

export interface SkillsLeaderboardEntry {
  uniqueId: string;
  level: number;
  experience: number;
}

export interface SkillsLeaderboard {
  entries: SkillsLeaderboardEntry[];
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

/** Re-exported for convenience so callers can reference the skill enum value. */
export type { SkillType };
