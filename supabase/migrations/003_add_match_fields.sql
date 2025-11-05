-- Add missing fields to matches table to match DBMatch interface
-- Migration: Add champion_id and other match detail fields

-- Add champion_id column
ALTER TABLE matches ADD COLUMN IF NOT EXISTS champion_id INTEGER;

-- Rename duration to game_duration for consistency
ALTER TABLE matches RENAME COLUMN duration TO game_duration;

-- Add queue_id column
ALTER TABLE matches ADD COLUMN IF NOT EXISTS queue_id INTEGER;

-- Add team_id column
ALTER TABLE matches ADD COLUMN IF NOT EXISTS team_id INTEGER;

-- Add kda column
ALTER TABLE matches ADD COLUMN IF NOT EXISTS kda DECIMAL(5, 2);

-- Add damage_taken column
ALTER TABLE matches ADD COLUMN IF NOT EXISTS damage_taken INTEGER NOT NULL DEFAULT 0;

-- Add wards_placed column
ALTER TABLE matches ADD COLUMN IF NOT EXISTS wards_placed INTEGER NOT NULL DEFAULT 0;

-- Add wards_destroyed column
ALTER TABLE matches ADD COLUMN IF NOT EXISTS wards_destroyed INTEGER NOT NULL DEFAULT 0;

-- Add items array column
ALTER TABLE matches ADD COLUMN IF NOT EXISTS items INTEGER[] DEFAULT ARRAY[]::INTEGER[];

-- Create index on champion_id for faster queries
CREATE INDEX IF NOT EXISTS idx_matches_champion_id ON matches(champion_id);

-- Create index on game_date for time-based queries
CREATE INDEX IF NOT EXISTS idx_matches_game_date ON matches(game_date);

-- Create composite index for player+champion queries
CREATE INDEX IF NOT EXISTS idx_matches_puuid_champion ON matches(puuid, champion_id);
