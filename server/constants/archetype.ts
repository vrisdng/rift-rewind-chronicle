import type { ArchetypeProfile, ElementName } from '../types/index.ts';

interface ElementDefinition {
  name: ElementName;
  icon: string;
  description: string;
  keywords: string[];
}

interface PersonaDefinition {
  element: ElementName;
  archetype: string;
  codename: string;
  description: string;
}

// ==================== ARCHETYPE DEFINITIONS ====================

export const ARCHETYPES: ArchetypeProfile[] = [
  {
    name: 'The Duelist',
    description: 'Lives for the 1v1 and the highlight reel.',
    profile: {
      aggression: 90,
      earlyGameStrength: 85,
      snowballRate: 80,
      clutchFactor: 75,
      teamfighting: 65,
      consistency: 55,
      vision: 45,
    },
    icon: '⚔️',
  },
  {
    name: 'The Strategist',
    description: 'Sees the entire map, not just the lane.',
    profile: {
      vision: 90,
      roaming: 75,
      teamfighting: 80,
      consistency: 80,
      lateGameScaling: 70,
      comebackRate: 70,
      aggression: 55,
    },
    icon: '♟️',
  },
  {
    name: 'The Playmaker',
    description: 'Always moving, always creating chaos.',
    profile: {
      roaming: 85,
      aggression: 80,
      teamfighting: 75,
      snowballRate: 70,
      vision: 65,
      clutchFactor: 70,
      consistency: 60,
    },
    icon: '🎭',
  },
  {
    name: 'The Anchor',
    description: 'Calm in chaos, never tilts.',
    profile: {
      consistency: 90,
      tiltFactor: 20,
      teamfighting: 80,
      vision: 75,
      clutchFactor: 70,
      comebackRate: 65,
      aggression: 45,
    },
    icon: '⚓️',
  },
  {
    name: 'The Scaler',
    description: 'Weak early, unstoppable late.',
    profile: {
      lateGameScaling: 95,
      farming: 85,
      comebackRate: 75,
      consistency: 70,
      clutchFactor: 65,
      earlyGameStrength: 40,
      aggression: 45,
    },
    icon: '🌅',
  },
  {
    name: 'The Snowballer',
    description: 'Wins lane, ends game.',
    profile: {
      earlyGameStrength: 95,
      snowballRate: 90,
      aggression: 85,
      teamfighting: 65,
      vision: 50,
      consistency: 60,
      lateGameScaling: 45,
    },
    icon: '🌋',
  },
  {
    name: 'The Gambler',
    description: 'High variance, high adrenaline.',
    profile: {
      aggression: 95,
      snowballRate: 75,
      consistency: 35,
      tiltFactor: 70,
      comebackRate: 40,
      farming: 55,
      teamfighting: 60,
    },
    icon: '🎲',
  },
  {
    name: 'The Supportive Core',
    description: 'Makes others shine.',
    profile: {
      vision: 90,
      teamfighting: 85,
      roaming: 70,
      consistency: 80,
      comebackRate: 70,
      tiltFactor: 30,
      aggression: 40,
    },
    icon: '✨',
  },
];

// ==================== ELEMENT DEFINITIONS ====================

export const ELEMENTS: ElementDefinition[] = [
  {
    name: 'Inferno',
    icon: '🔥',
    description: 'Passion, impulse, burst tempo.',
    keywords: ['Passion', 'Impulse', 'Burst tempo'],
  },
  {
    name: 'Tide',
    icon: '🌊',
    description: 'Patience, adaptation, comeback.',
    keywords: ['Patience', 'Adaptation', 'Comeback'],
  },
  {
    name: 'Gale',
    icon: '🌬️',
    description: 'Mobility, awareness, initiative.',
    keywords: ['Mobility', 'Awareness', 'Initiative'],
  },
  {
    name: 'Terra',
    icon: '🪨',
    description: 'Stability, discipline, defense.',
    keywords: ['Stability', 'Discipline', 'Defense'],
  },
  {
    name: 'Void',
    icon: '👁‍🗨',
    description: 'Chaos, creativity, unpredictability.',
    keywords: ['Chaos', 'Creativity', 'Unpredictable'],
  },
];

// ==================== PERSONA DEFINITIONS ====================

export const ELEMENT_PERSONAS: PersonaDefinition[] = [
  // Inferno combinations
  { element: 'Inferno', archetype: 'The Duelist', codename: 'The Fireblade', description: 'Strikes first, burns bright.' },
  { element: 'Inferno', archetype: 'The Strategist', codename: 'The War Planner', description: 'Plans with passion, executes in flame.' },
  { element: 'Inferno', archetype: 'The Playmaker', codename: 'The Emberstorm', description: 'Every roam a spark, every map a blaze.' },
  { element: 'Inferno', archetype: 'The Anchor', codename: 'The Hearthguard', description: 'Protects allies in the fire.' },
  { element: 'Inferno', archetype: 'The Scaler', codename: 'The Phoenix Investor', description: 'Crashes, burns, then soars.' },
  { element: 'Inferno', archetype: 'The Snowballer', codename: 'The Volcano', description: 'Erupts early, ends fast.' },
  { element: 'Inferno', archetype: 'The Gambler', codename: 'The Wildfire', description: 'Uncontrollable energy; victory or ashes.' },
  { element: 'Inferno', archetype: 'The Supportive Core', codename: 'The Beacon', description: 'Lights the way through inferno.' },

  // Tide combinations
  { element: 'Tide', archetype: 'The Duelist', codename: 'The Blade Current', description: 'Flows around fights until striking.' },
  { element: 'Tide', archetype: 'The Strategist', codename: 'The Deep Thinker', description: 'Waves of patience, precise calls.' },
  { element: 'Tide', archetype: 'The Playmaker', codename: 'The Tidebreaker', description: 'Turns tides, literally.' },
  { element: 'Tide', archetype: 'The Anchor', codename: 'The Breakwater', description: 'Absorbs chaos, steadies the ship.' },
  { element: 'Tide', archetype: 'The Scaler', codename: 'The Leviathan', description: 'Scales until unstoppable.' },
  { element: 'Tide', archetype: 'The Snowballer', codename: 'The Flood', description: 'Early lead becomes tidal wave.' },
  { element: 'Tide', archetype: 'The Gambler', codename: 'The Whirlpool', description: 'Drags foes down with the current.' },
  { element: 'Tide', archetype: 'The Supportive Core', codename: 'The Lifeline', description: 'Keeps everyone afloat.' },

  // Gale combinations
  { element: 'Gale', archetype: 'The Duelist', codename: 'The Tempest Blade', description: 'Fast hands, faster decisions.' },
  { element: 'Gale', archetype: 'The Strategist', codename: 'The Windseer', description: 'Reads the map like air currents.' },
  { element: 'Gale', archetype: 'The Playmaker', codename: 'The Whirlwind', description: 'Appears everywhere the fight begins.' },
  { element: 'Gale', archetype: 'The Anchor', codename: 'The Still Breeze', description: 'Quiet presence, steady impact.' },
  { element: 'Gale', archetype: 'The Scaler', codename: 'The Sky Harvester', description: 'Waits for the perfect storm.' },
  { element: 'Gale', archetype: 'The Snowballer', codename: 'The Cyclone', description: 'Spins a lead into a win.' },
  { element: 'Gale', archetype: 'The Gambler', codename: 'The Gust Coin', description: 'Plays with air and odds.' },
  { element: 'Gale', archetype: 'The Supportive Core', codename: 'The Wind Ally', description: 'Carries teammates on a tailwind.' },

  // Terra combinations
  { element: 'Terra', archetype: 'The Duelist', codename: 'The Stoneblade', description: 'Grounded precision in every strike.' },
  { element: 'Terra', archetype: 'The Strategist', codename: 'The Architect', description: 'Builds victory from solid plans.' },
  { element: 'Terra', archetype: 'The Playmaker', codename: 'The Faultline', description: 'Cracks open fights when it matters.' },
  { element: 'Terra', archetype: 'The Anchor', codename: 'The Bulwark', description: 'Never moves, never breaks.' },
  { element: 'Terra', archetype: 'The Scaler', codename: 'The Mountain', description: 'Starts small, ends immovable.' },
  { element: 'Terra', archetype: 'The Snowballer', codename: 'The Avalanche', description: 'Momentum becomes devastation.' },
  { element: 'Terra', archetype: 'The Gambler', codename: 'The Quake', description: 'All or nothing impact.' },
  { element: 'Terra', archetype: 'The Supportive Core', codename: 'The Pillar', description: "Team's foundation in every fight." },

  // Void combinations
  { element: 'Void', archetype: 'The Duelist', codename: 'The Riftblade', description: 'Unpredictable angles, unnatural timing.' },
  { element: 'Void', archetype: 'The Strategist', codename: 'The Mind in Shadow', description: 'Thinks beyond meta.' },
  { element: 'Void', archetype: 'The Playmaker', codename: 'The Paradox', description: 'Creates chaos then profits from it.' },
  { element: 'Void', archetype: 'The Anchor', codename: 'The Null Ward', description: 'Serene in madness.' },
  { element: 'Void', archetype: 'The Scaler', codename: 'The Eclipse', description: 'Grows in darkness, emerges unstoppable.' },
  { element: 'Void', archetype: 'The Snowballer', codename: 'The Singularity', description: 'Collapses the game around itself.' },
  { element: 'Void', archetype: 'The Gambler', codename: 'The Anomaly', description: 'Coin flip made sentient.' },
  { element: 'Void', archetype: 'The Supportive Core', codename: 'The Whisper', description: 'Invisible hand guiding victory.' },
];
