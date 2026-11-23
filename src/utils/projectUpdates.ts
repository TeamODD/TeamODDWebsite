import type { Game } from "../types/game";

export type ProjectUpdate = NonNullable<Game["updates"]>[number];

export const sortProjectUpdates = (updates: ProjectUpdate[]) => [...updates].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
