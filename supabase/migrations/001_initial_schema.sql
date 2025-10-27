-- Rift Rewind Database Schema
-- PostgreSQL schema for Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Players table: stores analyzed player data and AI insights
CREATE TABLE IF NOT EXISTS players (
  puuid TEXT PRIMARY KEY,
  riot_id TEXT NOT NULL,
  tag_line TEXT NOT NULL,
  region TEXT DEFAULT 'sg2',
  total_games INTEGER NOT NULL DEFAULT 0,
  win_rate DECIMAL(5, 2),
  main_role TEXT,
  top_champions JSONB,
  derived_metrics JSONB,
  narrative_story TEXT,
  insights JSONB,
  archetype TEXT,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Matches table: stores individual match data
CREATE TABLE IF NOT EXISTS matches (
  match_id TEXT PRIMARY KEY,
  puuid TEXT NOT NULL REFERENCES players(puuid) ON DELETE CASCADE,
  game_date TIMESTAMPTZ NOT NULL,
  champion_name TEXT NOT NULL,
  role TEXT,
  duration INTEGER NOT NULL, -- in seconds
  result BOOLEAN NOT NULL,
  kills INTEGER NOT NULL DEFAULT 0,
  deaths INTEGER NOT NULL DEFAULT 0,
  assists INTEGER NOT NULL DEFAULT 0,
  cs INTEGER NOT NULL DEFAULT 0, -- total CS (minions + jungle)
  gold INTEGER NOT NULL DEFAULT 0,
  damage_dealt INTEGER NOT NULL DEFAULT 0,
  vision_score INTEGER NOT NULL DEFAULT 0,
  performance_score DECIMAL(5, 2),
  is_watershed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Friend groups table
CREATE TABLE IF NOT EXISTS friend_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Friend group members junction table
CREATE TABLE IF NOT EXISTS friend_group_members (
  group_id UUID NOT NULL REFERENCES friend_groups(id) ON DELETE CASCADE,
  puuid TEXT NOT NULL REFERENCES players(puuid) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (group_id, puuid)
);

-- Analysis cache table: track when players were last analyzed
CREATE TABLE IF NOT EXISTS analysis_cache (
  puuid TEXT PRIMARY KEY REFERENCES players(puuid) ON DELETE CASCADE,
  last_analyzed TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  match_count INTEGER NOT NULL DEFAULT 0,
  needs_refresh BOOLEAN DEFAULT FALSE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_matches_puuid ON matches(puuid);
CREATE INDEX IF NOT EXISTS idx_matches_date ON matches(game_date DESC);
CREATE INDEX IF NOT EXISTS idx_matches_watershed ON matches(is_watershed) WHERE is_watershed = TRUE;
CREATE INDEX IF NOT EXISTS idx_matches_puuid_date ON matches(puuid, game_date DESC);
CREATE INDEX IF NOT EXISTS idx_players_riot_id ON players(riot_id, tag_line);
CREATE INDEX IF NOT EXISTS idx_friend_group_members_puuid ON friend_group_members(puuid);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to auto-update updated_at
CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON players
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_friend_groups_updated_at BEFORE UPDATE ON friend_groups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- View for player statistics
CREATE OR REPLACE VIEW player_statistics AS
SELECT
    p.puuid,
    p.riot_id,
    p.tag_line,
    p.region,
    p.total_games,
    p.win_rate,
    p.main_role,
    p.archetype,
    COUNT(m.match_id) as stored_matches,
    MAX(m.game_date) as last_game_date,
    p.generated_at
FROM players p
LEFT JOIN matches m ON p.puuid = m.puuid
GROUP BY p.puuid, p.riot_id, p.tag_line, p.region,
         p.total_games, p.win_rate, p.main_role,
         p.archetype, p.generated_at;

-- Comments for documentation
COMMENT ON TABLE players IS 'Stores analyzed player data including metrics, archetypes, and AI-generated insights';
COMMENT ON TABLE matches IS 'Individual match records for each player with performance metrics';
COMMENT ON TABLE friend_groups IS 'Groups of friends for comparative analysis';
COMMENT ON TABLE friend_group_members IS 'Junction table linking players to friend groups';
COMMENT ON TABLE analysis_cache IS 'Tracks when players were last analyzed to avoid unnecessary re-processing';
COMMENT ON COLUMN matches.performance_score IS 'Calculated score 0-100 based on KDA, CS, damage, vision';
COMMENT ON COLUMN matches.is_watershed IS 'Marks matches identified as breakthrough moments';
