-- Add Element & Persona fields to players table
-- Stores elemental micropersona data for fast retrieval

ALTER TABLE players
ADD COLUMN IF NOT EXISTS element_profile JSONB,
ADD COLUMN IF NOT EXISTS persona JSONB;

COMMENT ON COLUMN players.element_profile IS 'Elemental identity (Inferno/Tide/Gale/Terra/Void) with scoring metadata';
COMMENT ON COLUMN players.persona IS 'Combined archetype × element codename/description';
