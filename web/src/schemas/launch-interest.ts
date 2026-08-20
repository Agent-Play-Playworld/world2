import { z } from "zod";

export const LaunchInterestSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).optional(),
});

export type LaunchInterest = {
  email: string;
  name?: string;
};
