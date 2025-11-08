import type { PlayerStats } from "./api";

const PLAYER_STORAGE_KEY = "rr:last-player";

export const savePlayerSnapshot = (player: PlayerStats) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    sessionStorage.setItem(PLAYER_STORAGE_KEY, JSON.stringify(player));
  } catch (error) {
    console.warn("Failed to store player snapshot:", error);
  }
};

export const loadPlayerSnapshot = (): PlayerStats | null => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = sessionStorage.getItem(PLAYER_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as PlayerStats;
  } catch (error) {
    console.warn("Failed to load player snapshot:", error);
    return null;
  }
};
