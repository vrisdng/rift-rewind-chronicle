# Rift Rewind: League of Legends Year-in-Review

A cost-optimized full-stack application that creates personalized "Spotify Wrapped" style year-in-review experiences for League of Legends players. Features AI-powered insights via AWS Bedrock (Claude 3.5 Sonnet), statistical analysis, and shareable recap cards.

![React](https://img.shields.io/badge/React-18.3-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)
![Node.js](https://img.shields.io/badge/Express-5.1-green)
![AWS Bedrock](https://img.shields.io/badge/AWS-Bedrock-orange)
![Supabase](https://img.shields.io/badge/Database-Supabase-green)

## Features

### 🎯 Core Analytics (100% Free - Pure Math)
- **14 Derived Metrics**: Calculated from match statistics (no AI)
  - Playstyle: Aggression, Farming, Vision, Consistency, Roaming
  - Performance: Early Game, Late Game, Comeback Rate, Clutch Factor, Tilt Factor
  - Meta: Champion Pool Depth, Improvement Velocity, Teamfighting, Snowball Rate
- **Player Archetypes**: 15 predefined archetypes matched via Euclidean distance (no AI embeddings)
- **Elemental Profiles**: 5 elemental identities (Inferno, Tide, Gale, Terra, Void) combined with archetypes for unique personas
- **Pro Player Comparisons**: Match playstyle to professional players based on metric similarity
- **Watershed Moment Detection**: Statistical sliding window analysis (10-game windows, 15+ point improvement threshold)
- **Performance Scoring**: Weighted formula across KDA (30%), CS (20%), Damage (25%), Vision (15%), Gold (10%)

### 🤖 AI-Powered Insights (Single ~$0.0008 Call per Player)
- **Personalized Story Arc**: AI-generated narrative of the player's season journey
- **Surprising Insights**: 3 non-obvious patterns discovered from gameplay data
- **Improvement Tips**: 3 actionable, metric-driven recommendations
- **Archetype Explanation**: Context for why the player fits their assigned archetype
- **Season Prediction**: Data-driven forecast for improvement trajectory
- **Strengths & Weaknesses**: Top 3 performing metrics with percentiles + areas needing work
- **Powered by**: Claude 3 Haiku via AWS Bedrock (~1,000 input + 420 output tokens)

### 📊 Interactive Visualizations
- **Performance Charts**: Time-series trends with Recharts
- **Radar Charts**: Multi-metric playstyle visualization (5-axis: vision, farming, roaming, aggression, teamfighting)
- **Champion Mastery**: Top champions by games played and win rate
- **Role Distribution**: Main role identification and breakdown
- **Win/Loss Streaks**: Current and longest streaks tracked
- **Shareable Cards**: Customizable background options (8 presets: gradients, images, solid colors)

### 💬 AI Chatbot Coach (~$0.0034 for 10 interactions)
- **Brutally Honest Personality**: Roasting yet helpful coaching style
- **Context-Aware**: Full access to player stats, insights, and metrics
- **Streaming Responses**: Real-time token streaming for smooth UX (NDJSON)
- **Conversation History**: Session-based memory using sessionStorage
- **Smart Navigation**: Can navigate users to specific slides/insights
- **Prompt Suggestions**: Quick-start questions based on player data
- **Poro Avatar**: League of Legends themed UI with floating button
- **Roasting Notifications**: Periodic "wiggle" animations to re-engage users
- **Powered by**: Claude 3 Haiku with optimized prompts

### 🎨 Sharing & Social
- **Downloadable Recap Cards**: JPEG generation via html-to-image
- **Customizable Backgrounds**: 8 preset options with carousel + arrow navigation
- **Auto-Generated Captions**: AI-powered share text for social platforms
- **Quick Share Links**: WhatsApp, Telegram, Instagram integration
- **Stored Share Cards**: Supabase storage with unique slugs for link sharing

### 💰 Cost Optimization Strategy
- **Zero AI Cost for Math**: All metrics, archetypes, watersheds use pure statistics
- **Single AI Call**: ~$0.0008 per player (Claude 3 Haiku via AWS Bedrock)
- **24-Hour Cache**: Supabase stores all analysis to prevent redundant API calls
- **No Vector Embeddings**: Euclidean distance for archetype matching
- **Server-Side Image Processing**: No external image generation services
- **Streaming Analysis**: Server-Sent Events (SSE) for real-time progress updates
- **Target**: <$1 for 1,000 players analyzed (actual: ~$0.78)

## Tech Stack

### Frontend
- **Framework**: React 18.3 + TypeScript 5.8
- **Build Tool**: Vite 5.4
- **Styling**: TailwindCSS 3.4 with custom League of Legends theme (gold #C8AA6E)
- **UI Components**: shadcn/ui (Radix UI primitives) - 22 active components
- **Charts**: Recharts 2.15 (line charts, radar charts)
- **Routing**: React Router 7
- **Animations**: Framer Motion 12.23
- **Image Generation**: html-to-image 1.11
- **State Management**: React hooks (useState, useCallback, useMemo)

### Backend
- **Runtime**: Node.js + Express 5.1
- **Language**: TypeScript 5.8 (ES modules with .ts extensions)
- **Database**: Supabase (PostgreSQL with JSONB columns)
- **AI**: AWS Bedrock (Claude 3 Haiku via Converse API)
- **External APIs**:
  - Riot Games Developer API (rate limited: 20 req/sec)
  - Data Dragon (champion data)
- **Real-time**: Server-Sent Events (SSE) for streaming progress updates

## Quick Start

### Prerequisites
- Node.js 18+ installed
- Riot Games Developer API key ([get one here](https://developer.riotgames.com/))
- Supabase project ([create free account](https://supabase.com/))
- (Optional) AWS account with Bedrock access for AI insights

### Installation

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd rift-rewind-chronicle

# 2. Install dependencies
npm install
cd server && npm install && cd ..

# 3. Configure environment variables
cp .env.example .env
cp server/.env.example server/.env

# Edit .env files with your credentials (see Environment Variables section below)

# 4. Set up database schema
# Run migrations in Supabase SQL Editor:
# - supabase/migrations/001_initial_schema.sql
# - supabase/migrations/002_add_player_identity_fields.sql
# - supabase/migrations/003_add_match_fields.sql
# - supabase/migrations/004_create_share_cards_table.sql
# - supabase/migrations/005_add_element_persona_fields.sql

# 5. Start development servers (runs both frontend and backend concurrently)
npm run dev
```

The app will be available at:
- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:3000

## Environment Variables

**Frontend** (`.env`):
```env
VITE_API_URL=http://localhost:3000
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Backend** (`server/.env`):
```env
# Required
RIOT_API_KEY=your_riot_api_key                    # From https://developer.riotgames.com/
SUPABASE_URL=your_supabase_url                    # From Supabase project settings
SUPABASE_SERVICE_KEY=your_supabase_service_key    # Service role key (NOT anon key)

# Optional - AWS Bedrock for AI insights (falls back to mock insights if not provided)
AWS_REGION=us-east-1                              # Region with Bedrock model access
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key

# Optional
PORT=3000                                         # Default: 3000
SHARE_CARDS_BUCKET=share-cards                    # Supabase storage bucket name
```

**Important Notes**:
- Use **SUPABASE_SERVICE_KEY** (not anon key) in backend for admin operations
- AWS credentials are optional - app works without AI insights using mock data
- Ensure Bedrock model access is enabled in your AWS region

## API Endpoints

### Player Analysis
- **POST** `/api/analyze-stream` - Analyze player with SSE progress updates
  - Body: `{ riotId, tagLine, region? }`
  - Returns: Server-Sent Events stream with progress updates
  - Final event includes complete `PlayerStats` object

- **GET** `/api/player/:riotId/:tagLine` - Get cached player data
  - Returns cached analysis if available (404 if not analyzed)

### Friend Groups
- **POST** `/api/group` - Create friend group
  - Body: `{ name, players: Array<{riotId, tagLine, region?}> }`
  - Analyzes all players first if needed

- **GET** `/api/group/:groupId` - Get friend group statistics
  - Returns group dynamics, MVP, tilt chains

### Share Cards
- **POST** `/api/share-card/upload` - Upload generated share card image
  - Multipart form data: `{ image, caption, riotId, tagLine, puuid? }`
  - Returns: `{ slug, shareUrl }` for social sharing

- **GET** `/api/share-card/:slug` - Retrieve share card by slug
  - Returns share card metadata and public image URL

### System
- **GET** `/api/health` - Health check endpoint
  - Returns service status and configuration (Riot API, Supabase, AWS Bedrock)

## Architecture

### Data Flow Pipeline

The application follows a cost-optimized, streaming architecture:

1. **Data Collection** (Riot API) → `$0`
   - `server/lib/riot.ts` - Riot API client with automatic rate limiting (20 req/sec)
   - Fetches up to 100 ranked solo queue matches per player
   - `RiotClient.getMatchIdsByPuuid()` → `RiotClient.getMatch()` for each match

2. **Match Processing** (Pure Math) → `$0`
   - `server/lib/matchAnalyzer.ts` - Converts Riot match data to internal `DBMatch` format
   - Performance scoring algorithm: Weighted formula across 5 categories
   - All calculations happen in-memory without external services

3. **Metrics Calculation** (Pure Math) → `$0`
   - `server/lib/playerMetrics.ts` - Calculates 14 derived metrics from matches
   - Each metric scored 0-100 based on percentile thresholds
   - No AI or embeddings - pure statistical calculations

4. **Archetype Matching** (Distance Metrics) → `$0`
   - `server/lib/playerMetrics.ts` - 15 predefined `ARCHETYPES` constant
   - Uses Euclidean distance (NOT AI embeddings) to find closest match
   - Each archetype has a profile with expected metric values

5. **Elemental Profiles** (Statistical Analysis) → `$0`
   - `server/lib/elementSystem.ts` - 5 elements based on metric thresholds
   - Combined with archetypes to create unique personas

6. **Watershed Detection** (Statistical Analysis) → `$0`
   - `server/lib/watershedDetector.ts` - Sliding window analysis
   - Algorithm: For each match, compare avg performance 10 games before vs 10 after
   - Returns match with largest improvement (minimum 15-point threshold)

7. **AI Insights** (AWS Bedrock Claude 3 Haiku) → `~$0.0008`
   - `server/lib/bedrockClient.ts` - Claude 3 Haiku via AWS Bedrock Converse API
   - `server/lib/insightGenerator.ts` - Builds optimized prompt with all context
   - **ONLY 1 CALL PER PLAYER** - prompt includes: stats, metrics, archetype, watershed
   - Returns: story_arc, insights (3), improvement_tips (3), archetype_explanation, season_prediction
   - Falls back to `getMockInsights()` if AWS credentials missing
   - Token usage: ~1,000 input + 420 output tokens per analysis

8. **Caching** (Supabase PostgreSQL) → `$0` (free tier)
   - `server/lib/supabaseClient.ts` - Database operations
   - `analysis_cache` table tracks last analysis time
   - `needsRefresh(puuid, maxAgeHours)` - checks 24-hour cache window
   - Stores: `players`, `matches`, `friend_groups`, `share_cards` tables

9. **Streaming Updates** (Server-Sent Events) → `$0`
   - Real-time progress updates during analysis
   - Stages: Fetching account → Loading matches → Calculating stats → Generating insights → Complete

10. **Frontend Visualization** (React + Recharts) → `$0`
    - Interactive charts, radar plots, shareable cards
    - Client-side JPEG generation via html-to-image

**Total cost per player** (analysis only): **~$0.0008**
**Total cost for 100 players** (analysis only): **~$0.078** (under 8 cents)

### Chatbot Cost Estimation

The application includes an AI-powered chatbot ("RiftRewind Coach") that provides personalized gameplay advice using the same Claude 3 Haiku model.

**Estimated token usage per interaction:**
- User message: ~50-100 tokens (average: 75 tokens)
- Bot response: ~150-200 tokens (average: 175 tokens)
- Context overhead (conversation history): ~100 tokens per turn
- **Total per exchange: ~350 tokens** (~100 input + 250 output)

**Cost per chatbot exchange:**
- Input: 100 tokens × $0.00025 = $0.000025
- Output: 250 tokens × $0.00125 = $0.0003125
- **Total: ~$0.00034 per exchange**

**For 10 interactions (10 user messages + 10 bot replies):**
- **Total chatbot cost: ~$0.0034** (1/3 of a cent)

**Complete cost per player (analysis + 10 chatbot exchanges):**
- Analysis: $0.0008
- Chatbot (10 exchanges): $0.0034
- **Total: ~$0.0042** (less than half a cent)

**Volume pricing with chatbot usage:**
- **100 players** (with 10 chatbot exchanges each): **~$0.42** (under 50 cents)
- **1,000 players** (with 10 chatbot exchanges each): **~$4.20**
- **10,000 players** (with 10 chatbot exchanges each): **~$42.00**

### Module Structure

```
server/
├── lib/
│   ├── riot.ts              # Riot API client (rate limiting, match fetching)
│   ├── matchAnalyzer.ts     # Match data processing & performance scoring
│   ├── playerMetrics.ts     # 14 metrics calculation + archetype matching
│   ├── elementSystem.ts     # 5 elemental profiles + personas
│   ├── watershedDetector.ts # Statistical breakpoint detection
│   ├── bedrockClient.ts     # AWS Bedrock Claude integration
│   ├── insightGenerator.ts  # AI prompt building + mock fallback
│   ├── playerAnalyzer.ts    # Main orchestration pipeline
│   ├── supabaseClient.ts    # Database operations
│   └── proPlayers.ts        # Pro player comparison data
├── types/
│   ├── index.ts             # Shared application types
│   ├── database.ts          # Database schema types (DBPlayer, DBMatch, etc.)
│   └── application.ts       # Business logic types (PlayerStats, AIInsights, etc.)
└── index.ts                 # Express server + API routes

src/
├── components/
│   ├── slides/              # Carousel slides for recap presentation
│   ├── finale/              # Share card customizer with background options
│   └── ui/                  # shadcn/ui components (22 active)
├── lib/
│   ├── api.ts               # Type-safe API client (fetch wrappers)
│   └── utils.ts             # Utilities (cn, formatting)
└── pages/
    ├── Landing.tsx          # Input form + streaming analysis progress
    └── Dashboard.tsx        # Results presentation with slides
```

## Database Schema

The application uses Supabase (PostgreSQL) with 5 migrations:

### Core Tables
- **players** - Player identity, stats, metrics (JSONB), AI insights (JSONB), archetype, element, persona
- **matches** - Individual match records with performance metrics, watershed flags
- **analysis_cache** - Tracks last analysis timestamp and refresh status
- **friend_groups** + **friend_group_members** - Group comparison feature
- **share_cards** - Stored shareable card metadata with slugs

### Key Design Decisions
- **JSONB columns** for complex nested data (`derived_metrics`, `insights`, `element_profile`, `persona`)
- **24-hour cache policy** to prevent redundant Riot API calls
- **Watershed boolean flag** on matches for efficient querying
- **Composite indexes** on (puuid, game_date) for performance
- **Automatic updated_at triggers** via PostgreSQL functions

Run all 5 migration files (in order) from `supabase/migrations/` in your Supabase SQL editor.

## Key Implementation Details

### Performance Scoring Formula
```typescript
// matchAnalyzer.ts - calculatePerformanceScore()
// Weighted: KDA (30%) + CS (20%) + Damage (25%) + Vision (15%) + Gold (10%)
// Normalized to 0-100 scale, +10 bonus for wins
```

### Archetype Distance Calculation
```typescript
// playerMetrics.ts - calculateDistance()
// Euclidean distance: sqrt(sum((metric - profile)^2) / count)
// Lower distance = better archetype match
```

### 15 Player Archetypes
Each archetype has a defined metric profile (which stats matter most):

1. **Calculated Assassin** - High aggression + roaming, low consistency
2. **Scaling Specialist** - High late game + farming, low early game
3. **Vision Mastermind** - High vision + consistency
4. **Teamfight Commander** - High teamfighting + late game
5. **Early Game Bully** - High early game + aggression
6. **Consistent Performer** - High consistency + low tilt
7. **Clutch Player** - High clutch factor + comeback rate
8. **CS God** - High farming + low aggression
9. **Roaming Terror** - High roaming + aggression
10. **Comeback King** - High comeback rate + clutch factor
11. **Snowball Specialist** - High snowball rate + early game
12. **Supportive Pillar** - High vision + teamfighting
13. **Versatile Adapt** - Balanced across all metrics
14. **Aggressive Carry** - High aggression + snowball
15. **Late Game Insurance** - High late game + consistency

### 5 Elemental Profiles
Each element represents a combat philosophy:

- **Inferno** (Fire) - High aggression, high risk/reward
- **Tide** (Water) - Adaptive, flow-state gameplay
- **Gale** (Wind) - Speed, roaming, map pressure
- **Terra** (Earth) - Defensive, consistent, reliable
- **Void** (Dark) - Calculated, strategic, cerebral

### Watershed Detection Algorithm
```typescript
// watershedDetector.ts
const WINDOW_SIZE = 10;                    // Games before/after
const MIN_IMPROVEMENT_THRESHOLD = 15;      // Minimum performance jump

// For each match:
// - Calculate avg performance of 10 games before
// - Calculate avg performance of 10 games after
// - Find match with largest positive delta
```

## Development

### Available Scripts

```bash
# Start both frontend and backend concurrently
npm run dev

# Frontend only (Vite dev server on port 8080)
vite

# Backend only (Express server on port 3000)
cd server && npm run dev

# Lint code (ESLint)
npm run lint

# Build for production
npm run build              # Frontend (outputs to dist/)
cd server && npx tsc       # Backend TypeScript compilation
```

### Development Tips

- **Hot Module Replacement**: Frontend auto-reloads on file changes (Vite HMR)
- **Backend Watch Mode**: `npm run dev` in server/ uses `tsx --watch` for auto-restart
- **Type Safety**: All API calls are type-safe via shared TypeScript interfaces
- **Mock Mode**: Remove AWS credentials from `.env` to test without AI costs
- **Rate Limiting**: Riot API has strict rate limits - app auto-sleeps every 20 requests

### Common Modifications

**Add a new derived metric**:
1. Add to `DerivedMetrics` interface in `server/types/application.ts`
2. Implement calculation function in `server/lib/playerMetrics.ts`
3. Call from `calculateDerivedMetrics()`
4. Update archetype profiles if relevant

**Add a new archetype**:
1. Add to `ARCHETYPES` array in `server/lib/playerMetrics.ts`
2. Define metric profile values (which metrics define this playstyle)
3. Add icon emoji

**Modify AI insights structure**:
1. Edit prompt template in `server/lib/insightGenerator.ts` → `buildInsightPrompt()`
2. Update `AIInsights` interface in `server/types/application.ts`
3. Test with mock mode first (no AWS costs)

**Add a new background option**:
1. Add to `backgroundOptions` array in `src/components/finale/FinaleShareCustomizer.tsx`
2. Define type (`image`, `gradient`, or `color`) and value

## Deployment

### Frontend (Vercel/Netlify)
- Build command: `npm run build`
- Output directory: `dist/`
- Environment variables: `VITE_API_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

### Backend (Heroku/Railway/Fly.io)
- Build command: `cd server && npx tsc`
- Start command: `cd server && node index.js`
- Node version: 18+
- Environment variables: See "Backend (.env)" section above

### Database
- Supabase automatically handles migrations - run them manually in SQL editor
- Enable Row Level Security (RLS) if needed for production
- Create storage bucket `share-cards` with public access

## Troubleshooting

### "Riot API rate limit exceeded"
- Reduce `MAX_MATCHES_TO_FETCH` in `server/lib/playerAnalyzer.ts` (default: 100)
- Increase sleep intervals in match fetching loop

### "Supabase error" during analysis
- Verify all 5 migrations ran successfully in order
- Check you're using `SUPABASE_SERVICE_KEY` (NOT anon key) in backend
- Inspect error - may be JSONB serialization issue

### AWS Bedrock not working
- Verify Claude 3.5 Sonnet model access granted in AWS console
- Check region supports Bedrock (`us-east-1`, `us-west-2` recommended)
- App gracefully falls back to mock insights if AWS unavailable

### TypeScript errors in server
- All imports must include `.ts` extension (ES modules)
- Server uses `"type": "module"` in `package.json`
- Run `cd server && npx tsc` to check compilation errors

### Frontend can't connect to backend
- Verify `VITE_API_URL` in root `.env` (default: `http://localhost:3000`)
- Check CORS settings in `server/index.ts` allow frontend origin
- Confirm backend running on expected port (check terminal output)

## Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see LICENSE file for details

---

**Disclaimer**: Rift Rewind is not affiliated with or endorsed by Riot Games. League of Legends and all associated properties are trademarks or registered trademarks of Riot Games, Inc.
