import { CANONICAL_OCCUPANCY_ORIGIN } from "./origins";

export type OccupancyEnv = {
  DEV?: boolean;
  VITE_OCCUPANCY_ORIGIN?: string;
};

export const resolveOccupancyOrigin = (
  env: OccupancyEnv = import.meta.env
): string => {
  const configured = env.VITE_OCCUPANCY_ORIGIN?.trim();
  if (configured !== undefined && configured.length > 0) {
    return configured.replace(/\/$/, "");
  }
  if (env.DEV === true) {
    return "http://localhost:3000";
  }
  return CANONICAL_OCCUPANCY_ORIGIN;
};

export const occupancyApiBase = (origin: string): string => {
  return `${origin.replace(/\/$/, "")}/api/agent-play`;
};
