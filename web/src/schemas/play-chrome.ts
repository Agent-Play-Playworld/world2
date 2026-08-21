import { z } from "zod";

export const PlayTouchKeySchema = z.object({
  id: z.enum(["assist", "chat", "talk", "wallet"]),
  letter: z.string().min(1),
  label: z.string().min(1),
});

export type PlayTouchKey = z.infer<typeof PlayTouchKeySchema>;

export const PlayPanelIdSchema = z.enum(["messages", "session", "debug"]);

export type PlayPanelId = z.infer<typeof PlayPanelIdSchema>;

export const PlayModalIdSchema = z.enum([
  "games",
  "wallet",
  "referrals",
  "create-node",
]);

export type PlayModalId = z.infer<typeof PlayModalIdSchema>;
