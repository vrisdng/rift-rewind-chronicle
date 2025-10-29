# Rift Rewind: League of Legends Year-in-Review

A full-stack application that creates personalized "Spotify Wrapped" style year-in-review experiences for League of Legends players, powered by AWS Bedrock (Claude) and the Riot Games API.

![Tech Stack](https://img.shields.io/badge/React-18.3-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)
![Node.js](https://img.shields.io/badge/Node.js-Express-green)
![AWS Bedrock](https://img.shields.io/badge/AWS-Bedrock-orange)

## Features

### 🎯 Core Analytics (100% Free - Pure Math)
- **Derived Metrics**: 14 playstyle metrics calculated from match data
  - Aggression, Farming, Vision, Consistency
  - Early/Late game strength, Comeback rate, Clutch factor
  - Tilt factor, Champion pool depth, Improvement velocity
- **Player Archetypes**: 15 predefined archetypes using distance-based matching (NO AI embeddings)
- **Watershed Moment Detection**: Statistical analysis to find breakthrough matches
- **Performance Trends**: Weekly performance aggregation and visualization

### 🤖 AI-Powered Insights (Single $0.04 Call per Player)
- **Personalized Narrative**: AI-generated story arc of the player's year
- **Surprising Insights**: 3 non-obvious patterns discovered in gameplay
- **Improvement Tips**: 3 actionable, metric-driven recommendations
- **Archetype Explanation**: Why the player fits their archetype
- **Season Prediction**: Data-driven forecast for next season

### 📊 Visualizations
- Interactive performance charts (Recharts)
- Champion mastery breakdown
- Role distribution
- Win/loss streaks
- Growth trajectory

### 💰 Cost Optimization
- **Database Caching**: All analysis cached in Supabase
- **Single AI Call**: ~$0.04 per player (Claude 3.5 Sonnet via AWS Bedrock)
- **No Embeddings**: Distance metrics instead of vector embeddings
- **No Image Generation**: Canvas API for shareable cards
- **Target**: <$50 total for development/testing

## Tech Stack

### Frontend
- **Framework**: React 18.3 + TypeScript 5.8
- **Build Tool**: Vite 5.4
- **Styling**: TailwindCSS 3.4
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Charts**: Recharts 2.15
- **Routing**: React Router 7

### Backend
- **Runtime**: Node.js + Express 5.1
- **Language**: TypeScript 5.8
- **Database**: Supabase (PostgreSQL)
- **AI**: AWS Bedrock (Claude 3.5 Sonnet)
- **External API**: Riot Games Developer API

## Quick Start

```bash
# Install dependencies
npm install
cd server && npm install && cd ..

# Configure environment variables (see .env.example files)
cp .env.example .env
cp server/.env.example server/.env

# Start dev servers (runs both frontend and backend)
npm run dev
```

Visit http://localhost:8080 to use the app.

## Environment Variables

**Frontend** (`.env`):
```env
VITE_API_URL=http://localhost:3000
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Backend** (`server/.env`):
```env
RIOT_API_KEY=your_riot_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key

# Optional (uses mock insights if not provided)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key

PORT=3000
```

## API Endpoints

- `POST /api/analyze` - Analyze a player
- `GET /api/player/:riotId/:tagLine` - Get cached player data
- `POST /api/group` - Create friend group
- `GET /api/group/:groupId` - Get friend group stats
- `GET /api/health` - Health check

## Architecture

The app follows a cost-optimized architecture:

1. **Data Collection** (Riot API) - Free
2. **Analysis** (Pure Math) - Free
3. **AI Insights** (AWS Bedrock) - ~$0.04/player
4. **Caching** (Supabase) - Free tier
5. **Visualization** (React + Recharts) - Free

Total cost per player: **~$0.04** (only the AI call)

## Key Features

### Archetype System
15 predefined archetypes matched using Euclidean distance:
- Calculated Assassin, Scaling Specialist, Vision Mastermind
- Teamfight Commander, Early Game Bully, Consistent Performer
- Clutch Player, CS God, Roaming Terror, Comeback King
- And 5 more...

### Watershed Detection
Statistical analysis finds the breakthrough match where performance improved significantly (15+ point jump in rolling average).

### Derived Metrics
14 metrics calculated from match data:
- Playstyle: aggression, farming, vision, consistency
- Performance: early/late game, comeback rate, clutch factor, tilt factor
- Meta: champion pool depth, improvement velocity, roaming, teamfighting, snowball rate

## Development

```bash
# Lint code
npm run lint

# Build for production
npm run build
cd server && npx tsc
```

## License

MIT

---

**Disclaimer**: Not affiliated with Riot Games. All League of Legends assets are property of Riot Games.
