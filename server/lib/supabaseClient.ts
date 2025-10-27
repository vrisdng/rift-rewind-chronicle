/**
 * Supabase Client for Rift Rewind
 * Handles database operations for player data, matches, and friend groups
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type {
  DBPlayer,
  DBMatch,
  PlayerStats,
  FriendGroup,
  AnalyzePlayerResponse,
} from '../types/index.js';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.warn('⚠️  Supabase credentials not found. Database operations will fail.');
}

// Create singleton Supabase client
let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return supabaseClient;
}

// ==================== PLAYER OPERATIONS ====================

/**
 * Get player data from database by PUUID
 */
export async function getPlayer(puuid: string): Promise<DBPlayer | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('puuid', puuid)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found
      return null;
    }
    console.error('Error fetching player:', error);
    throw error;
  }

  return data;
}

/**
 * Get player by Riot ID
 */
export async function getPlayerByRiotId(
  riotId: string,
  tagLine: string
): Promise<DBPlayer | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('riot_id', riotId)
    .eq('tag_line', tagLine)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching player by Riot ID:', error);
    throw error;
  }

  return data;
}

/**
 * Save or update player data
 */
export async function upsertPlayer(player: Partial<DBPlayer>): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('players')
    .upsert(player, {
      onConflict: 'puuid',
    });

  if (error) {
    console.error('Error upserting player:', error);
    throw error;
  }
}

// ==================== MATCH OPERATIONS ====================

/**
 * Get matches for a player
 */
export async function getMatches(
  puuid: string,
  limit?: number
): Promise<DBMatch[]> {
  const supabase = getSupabaseClient();
  let query = supabase
    .from('matches')
    .select('*')
    .eq('puuid', puuid)
    .order('game_date', { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching matches:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get watershed moment for a player
 */
export async function getWatershedMoment(puuid: string): Promise<DBMatch | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .eq('puuid', puuid)
    .eq('is_watershed', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching watershed moment:', error);
    throw error;
  }

  return data;
}

/**
 * Bulk insert matches
 */
export async function insertMatches(matches: Partial<DBMatch>[]): Promise<void> {
  if (matches.length === 0) return;

  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('matches')
    .upsert(matches, {
      onConflict: 'match_id',
      ignoreDuplicates: true,
    });

  if (error) {
    console.error('Error inserting matches:', error);
    throw error;
  }
}

/**
 * Mark a match as a watershed moment
 */
export async function markWatershedMoment(
  matchId: string,
  isWatershed: boolean = true
): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('matches')
    .update({ is_watershed: isWatershed })
    .eq('match_id', matchId);

  if (error) {
    console.error('Error marking watershed moment:', error);
    throw error;
  }
}

// ==================== FRIEND GROUP OPERATIONS ====================

/**
 * Create a friend group
 */
export async function createFriendGroup(
  name: string,
  puuids: string[]
): Promise<string> {
  const supabase = getSupabaseClient();

  // Create the group
  const { data: group, error: groupError } = await supabase
    .from('friend_groups')
    .insert({ name })
    .select()
    .single();

  if (groupError) {
    console.error('Error creating friend group:', groupError);
    throw groupError;
  }

  // Add members
  const members = puuids.map((puuid) => ({
    group_id: group.id,
    puuid,
  }));

  const { error: membersError } = await supabase
    .from('friend_group_members')
    .insert(members);

  if (membersError) {
    console.error('Error adding group members:', membersError);
    throw membersError;
  }

  return group.id;
}

/**
 * Get friend group with members
 */
export async function getFriendGroup(groupId: string): Promise<FriendGroup | null> {
  const supabase = getSupabaseClient();

  const { data: group, error: groupError } = await supabase
    .from('friend_groups')
    .select('*')
    .eq('id', groupId)
    .single();

  if (groupError) {
    if (groupError.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching friend group:', groupError);
    throw groupError;
  }

  const { data: members, error: membersError } = await supabase
    .from('friend_group_members')
    .select('puuid, players(*)')
    .eq('group_id', groupId);

  if (membersError) {
    console.error('Error fetching group members:', membersError);
    throw membersError;
  }

  return {
    id: group.id,
    name: group.name,
    members: [], // Will be populated by the API layer
    dynamics: {
      tiltChains: [],
      mvp: { puuid: '', riotId: '', avgPerformance: 0 },
    },
  };
}

// ==================== CACHE OPERATIONS ====================

/**
 * Check if player needs refresh
 */
export async function needsRefresh(
  puuid: string,
  maxAgeHours: number = 24
): Promise<boolean> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('analysis_cache')
    .select('last_analyzed, needs_refresh')
    .eq('puuid', puuid)
    .single();

  if (error || !data) {
    // No cache entry means needs analysis
    return true;
  }

  if (data.needs_refresh) {
    return true;
  }

  const lastAnalyzed = new Date(data.last_analyzed);
  const hoursSince = (Date.now() - lastAnalyzed.getTime()) / (1000 * 60 * 60);

  return hoursSince > maxAgeHours;
}

/**
 * Update analysis cache
 */
export async function updateAnalysisCache(
  puuid: string,
  matchCount: number
): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('analysis_cache')
    .upsert({
      puuid,
      last_analyzed: new Date().toISOString(),
      match_count: matchCount,
      needs_refresh: false,
    });

  if (error) {
    console.error('Error updating analysis cache:', error);
    throw error;
  }
}

/**
 * Mark player for refresh
 */
export async function markForRefresh(puuid: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('analysis_cache')
    .update({ needs_refresh: true })
    .eq('puuid', puuid);

  if (error) {
    console.error('Error marking for refresh:', error);
    throw error;
  }
}

// ==================== STATISTICS ====================

/**
 * Get total number of analyzed players
 */
export async function getTotalPlayers(): Promise<number> {
  const supabase = getSupabaseClient();
  const { count, error } = await supabase
    .from('players')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('Error getting player count:', error);
    return 0;
  }

  return count || 0;
}

/**
 * Get total number of matches stored
 */
export async function getTotalMatches(): Promise<number> {
  const supabase = getSupabaseClient();
  const { count, error } = await supabase
    .from('matches')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('Error getting match count:', error);
    return 0;
  }

  return count || 0;
}

export default {
  getSupabaseClient,
  getPlayer,
  getPlayerByRiotId,
  upsertPlayer,
  getMatches,
  getWatershedMoment,
  insertMatches,
  markWatershedMoment,
  createFriendGroup,
  getFriendGroup,
  needsRefresh,
  updateAnalysisCache,
  markForRefresh,
  getTotalPlayers,
  getTotalMatches,
};
