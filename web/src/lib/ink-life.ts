import type { InkLevel, LifeLevel } from "../schemas/ink";

export const lifeForInkLevel = (inkLevel: InkLevel): LifeLevel => {
  return inkLevel;
};

export const describeInkLife = (inkLevel: InkLevel): string => {
  if (inkLevel === "low") {
    return "Low ink, low life";
  }
  return "High ink, high life";
};
