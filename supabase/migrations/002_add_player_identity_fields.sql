-- Add Player Identity Fields
-- Adds pro comparison and player strengths/weaknesses to players table

-- Add new columns for player identity system
ALTER TABLE players
ADD COLUMN IF NOT EXISTS pro_comparison JSONB,
ADD COLUMN IF NOT EXISTS top_strengths JSONB,
ADD COLUMN IF NOT EXISTS needs_work JSONB,
ADD COLUMN IF NOT EXISTS playful_comparison TEXT;

-- Add comments for documentation
COMMENT ON COLUMN players.pro_comparison IS 'Pro player comparison data including primary/secondary matches';
COMMENT ON COLUMN players.top_strengths IS 'Array of player top 3 strengths with percentiles';
COMMENT ON COLUMN players.needs_work IS 'Array of weaknesses with improvement suggestions';
COMMENT ON COLUMN players.playful_comparison IS 'Shareable playful comparison quote';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_players_archetype ON players(archetype);
