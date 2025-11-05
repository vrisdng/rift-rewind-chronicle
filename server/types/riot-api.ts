/**
 * Riot API Response Types
 * These types represent the EXACT structure returned by Riot's API
 * Source: https://developer.riotgames.com/apis
 */

// ==================== ACCOUNT-V1 API ====================

export interface RiotAccountDTO {
  puuid: string;
  gameName: string;
  tagLine: string;
}

// ==================== SUMMONER-V4 API ====================

export interface RiotSummonerDTO {
  id: string;
  accountId: string;
  puuid: string;
  profileIconId: number;
  revisionDate: number;
  summonerLevel: number;
}

// ==================== MATCH-V5 API ====================

/**
 * Full match data from Match-V5 API
 */
export interface RiotMatchDTO {
  metadata: RiotMatchMetadataDTO;
  info: RiotMatchInfoDTO;
}

export interface RiotMatchMetadataDTO {
  dataVersion: string;
  matchId: string;
  participants: string[]; // Array of PUUIDs
}

export interface RiotMatchInfoDTO {
  endOfGameResult: string;
  gameCreation: number;
  gameDuration: number;
  gameEndTimestamp: number;
  gameId: number;
  gameMode: string;
  gameName: string;
  gameStartTimestamp: number;
  gameType: string;
  gameVersion: string;
  mapId: number;
  participants: RiotParticipantDTO[];
  platformId: string;
  queueId: number;
  teams: RiotTeamDTO[];
  tournamentCode?: string;
}

export interface RiotParticipantDTO {
  // Identity
  puuid: string;
  riotIdGameName?: string;
  riotIdTagline?: string;
  summonerId: string;
  summonerName: string;
  summonerLevel: number;

  // Champion & Position
  championId: number;
  championName: string;
  championTransform?: number; // For champions like Kayn
  teamId: number;
  teamPosition: string; // TOP, JUNGLE, MIDDLE, BOTTOM, UTILITY
  individualPosition: string;
  role: string; // DUO, SOLO, etc.
  lane: string; // TOP, JUNGLE, etc.

  // Match outcome
  win: boolean;
  gameEndedInEarlySurrender: boolean;
  gameEndedInSurrender: boolean;
  teamEarlySurrendered: boolean;

  // Core stats
  kills: number;
  deaths: number;
  assists: number;
  doubleKills: number;
  tripleKills: number;
  quadraKills: number;
  pentaKills: number;
  unrealKills: number;

  // Combat stats
  totalDamageDealt: number;
  totalDamageDealtToChampions: number;
  totalDamageTaken: number;
  totalDamageShieldedOnTeammates: number;
  totalHeal: number;
  totalHealsOnTeammates: number;
  totalMinionsKilled: number;
  neutralMinionsKilled: number;

  // Economic stats
  goldEarned: number;
  goldSpent: number;

  // Vision stats
  visionScore: number;
  visionWardsBoughtInGame: number;
  wardsKilled: number;
  wardsPlaced: number;
  detectorWardsPlaced: number;

  // Items
  item0: number;
  item1: number;
  item2: number;
  item3: number;
  item4: number;
  item5: number;
  item6: number; // Trinket

  // Summoner spells
  summoner1Id: number;
  summoner2Id: number;
  summoner1Casts: number;
  summoner2Casts: number;

  // Runes
  perks: RiotPerksDTO;

  // Objectives
  baronKills: number;
  dragonKills: number;
  inhibitorKills: number;
  inhibitorTakedowns: number;
  inhibitorsLost: number;
  nexusKills: number;
  nexusLost: number;
  nexusTakedowns: number;
  objectivesStolen: number;
  objectivesStolenAssists: number;
  turretKills: number;
  turretTakedowns: number;
  turretsLost: number;

  // Performance metrics
  largestCriticalStrike: number;
  largestKillingSpree: number;
  largestMultiKill: number;
  longestTimeSpentLiving: number;
  timeCCingOthers: number;
  totalTimeCCDealt: number;
  totalTimeSpentDead: number;
  timePlayed: number;

  // Challenges (optional - newer feature)
  challenges?: RiotChallengesDTO;

  // Miscellaneous
  champExperience: number;
  champLevel: number;
  consumablesPurchased: number;
  damageSelfMitigated: number;
  eligibleForProgression: boolean;
  firstBloodAssist: boolean;
  firstBloodKill: boolean;
  firstTowerAssist: boolean;
  firstTowerKill: boolean;
  itemsPurchased: number;
  killingSprees: number;
  magicDamageDealt: number;
  magicDamageDealtToChampions: number;
  magicDamageTaken: number;
  physicalDamageDealt: number;
  physicalDamageDealtToChampions: number;
  physicalDamageTaken: number;
  profileIcon: number;
  sightWardsBoughtInGame: number;
  spell1Casts: number;
  spell2Casts: number;
  spell3Casts: number;
  spell4Casts: number;
  trueDamageDealt: number;
  trueDamageDealtToChampions: number;
  trueDamageTaken: number;
}

export interface RiotPerksDTO {
  statPerks: {
    defense: number;
    flex: number;
    offense: number;
  };
  styles: Array<{
    description: string;
    selections: Array<{
      perk: number;
      var1: number;
      var2: number;
      var3: number;
    }>;
    style: number;
  }>;
}

export interface RiotChallengesDTO {
  '12AssistStreakCount'?: number;
  abilityUses?: number;
  acesBefore15Minutes?: number;
  alliedJungleMonsterKills?: number;
  baronTakedowns?: number;
  blastConeOppositeOpponentCount?: number;
  bountyGold?: number;
  buffsStolen?: number;
  completeSupportQuestInTime?: number;
  controlWardsPlaced?: number;
  damagePerMinute?: number;
  damageTakenOnTeamPercentage?: number;
  dancedWithRiftHerald?: number;
  deathsByEnemyChamps?: number;
  dodgeSkillShotsSmallWindow?: number;
  doubleAces?: number;
  dragonTakedowns?: number;
  earliestBaron?: number;
  earlyLaningPhaseGoldExpAdvantage?: number;
  effectiveHealAndShielding?: number;
  elderDragonKillsWithOpposingSoul?: number;
  elderDragonMultikills?: number;
  enemyChampionImmobilizations?: number;
  enemyJungleMonsterKills?: number;
  epicMonsterKillsNearEnemyJungler?: number;
  epicMonsterKillsWithin30SecondsOfSpawn?: number;
  epicMonsterSteals?: number;
  epicMonsterStolenWithoutSmite?: number;
  firstTurretKilled?: number;
  flawlessAces?: number;
  fullTeamTakedown?: number;
  gameLength?: number;
  getTakedownsInAllLanesEarlyJungleAsLaner?: number;
  goldPerMinute?: number;
  hadOpenNexus?: number;
  immobilizeAndKillWithAlly?: number;
  initialBuffCount?: number;
  initialCrabCount?: number;
  jungleCsBefore10Minutes?: number;
  junglerTakedownsNearDamagedEpicMonster?: number;
  kda?: number;
  killAfterHiddenWithAlly?: number;
  killParticipation?: number;
  killedChampTookFullTeamDamageSurvived?: number;
  killingSprees?: number;
  killsNearEnemyTurret?: number;
  killsOnOtherLanesEarlyJungleAsLaner?: number;
  killsOnRecentlyHealedByAramPack?: number;
  killsUnderOwnTurret?: number;
  killsWithHelpFromEpicMonster?: number;
  knockEnemyIntoTeamAndKill?: number;
  landSkillShotsEarlyGame?: number;
  laneMinionsFirst10Minutes?: number;
  laningPhaseGoldExpAdvantage?: number;
  legendaryCount?: number;
  lostAnInhibitor?: number;
  maxCsAdvantageOnLaneOpponent?: number;
  maxKillDeficit?: number;
  maxLevelLeadLaneOpponent?: number;
  mejaisFullStackInTime?: number;
  moreEnemyJungleThanOpponent?: number;
  multiKillOneSpell?: number;
  multiTurretRiftHeraldCount?: number;
  multikills?: number;
  multikillsAfterAggressiveFlash?: number;
  outerTurretExecutesBefore10Minutes?: number;
  outnumberedKills?: number;
  outnumberedNexusKill?: number;
  perfectDragonSoulsTaken?: number;
  perfectGame?: number;
  pickKillWithAlly?: number;
  playedChampSelectPosition?: number;
  poroExplosions?: number;
  quickCleanse?: number;
  quickFirstTurret?: number;
  quickSoloKills?: number;
  riftHeraldTakedowns?: number;
  saveAllyFromDeath?: number;
  scuttleCrabKills?: number;
  skillshotsDodged?: number;
  skillshotsHit?: number;
  snowballsHit?: number;
  soloBaronKills?: number;
  soloKills?: number;
  stealthWardsPlaced?: number;
  survivedSingleDigitHpCount?: number;
  survivedThreeImmobilizesInFight?: number;
  takedownOnFirstTurret?: number;
  takedowns?: number;
  takedownsAfterGainingLevelAdvantage?: number;
  takedownsBeforeJungleMinionSpawn?: number;
  takedownsFirstXMinutes?: number;
  takedownsInAlcove?: number;
  takedownsInEnemyFountain?: number;
  teamBaronKills?: number;
  teamDamagePercentage?: number;
  teamElderDragonKills?: number;
  teamRiftHeraldKills?: number;
  tookLargeDamageSurvived?: number;
  turretPlatesTaken?: number;
  turretsTakenWithRiftHerald?: number;
  turretTakedowns?: number;
  twentyMinionsIn3SecondsCount?: number;
  twoWardsOneSweeperCount?: number;
  unseenRecalls?: number;
  visionScoreAdvantageLaneOpponent?: number;
  visionScorePerMinute?: number;
  wardTakedowns?: number;
  wardTakedownsBefore20M?: number;
  wardsGuarded?: number;
  [key: string]: any; // Riot may add new challenges
}

export interface RiotTeamDTO {
  bans: Array<{
    championId: number;
    pickTurn: number;
  }>;
  objectives: {
    baron: RiotObjectiveDTO;
    champion: RiotObjectiveDTO;
    dragon: RiotObjectiveDTO;
    horde: RiotObjectiveDTO;
    inhibitor: RiotObjectiveDTO;
    riftHerald: RiotObjectiveDTO;
    tower: RiotObjectiveDTO;
  };
  teamId: number;
  win: boolean;
}

export interface RiotObjectiveDTO {
  first: boolean;
  kills: number;
}

// ==================== CHAMPION-MASTERY-V4 API ====================

export interface RiotChampionMasteryDTO {
  puuid: string;
  championId: number;
  championLevel: number;
  championPoints: number;
  lastPlayTime: number;
  championPointsSinceLastLevel: number;
  championPointsUntilNextLevel: number;
  markRequiredForNextLevel: number;
  tokensEarned: number;
  championSeasonMilestone: number;
  milestoneGrades?: string[];
  nextSeasonMilestone?: {
    requireGradeCounts: Record<string, number>;
    rewardMarks: number;
    bonus: boolean;
  };
}

// ==================== UTILITY TYPES ====================

export type RiotRegion = 'americas' | 'asia' | 'europe' | 'sea';
export type RiotPlatform = 'br1' | 'eun1' | 'euw1' | 'jp1' | 'kr' | 'la1' | 'la2' | 'na1' | 'oc1' | 'ph2' | 'ru' | 'sg2' | 'th2' | 'tr1' | 'tw2' | 'vn2';

export const RIOT_QUEUE_IDS = {
  RANKED_SOLO: 420,
  RANKED_FLEX: 440,
  NORMAL_DRAFT: 400,
  NORMAL_BLIND: 430,
  ARAM: 450,
} as const;
