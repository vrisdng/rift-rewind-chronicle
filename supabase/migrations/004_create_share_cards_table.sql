-- Share Cards Schema
-- Stores generated shareable card metadata and assets

CREATE TABLE IF NOT EXISTS share_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT NOT NULL UNIQUE,
  player_puuid TEXT REFERENCES players(puuid) ON DELETE SET NULL,
  player_riot_id TEXT,
  player_tag_line TEXT,
  caption TEXT,
  image_path TEXT NOT NULL,
  player_snapshot JSONB,
  download_count INTEGER NOT NULL DEFAULT 0,
  last_shared_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_share_cards_slug ON share_cards(slug);
CREATE INDEX IF NOT EXISTS idx_share_cards_player_puuid ON share_cards(player_puuid);

CREATE TRIGGER update_share_cards_updated_at
  BEFORE UPDATE ON share_cards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Public storage bucket for shareable images
INSERT INTO storage.buckets (id, name, public)
VALUES ('share-cards', 'share-cards', TRUE)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public;
