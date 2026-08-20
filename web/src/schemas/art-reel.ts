import { z } from "zod";

export const ArtReelFrameSchema = z.object({
  file: z.string().min(1),
  title: z.string().min(1),
  caption: z.string().min(1),
});

export type ArtReelFrame = z.infer<typeof ArtReelFrameSchema>;
