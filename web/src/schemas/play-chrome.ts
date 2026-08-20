import { z } from "zod";

export const PlayTouchKeySchema = z.object({
  id: z.enum(["assist", "chat", "talk", "wallet"]),
  letter: z.string().min(1),
  label: z.string().min(1),
});

export type PlayTouchKey = z.infer<typeof PlayTouchKeySchema>;

export const PlayFooterMenuItemSchema = z.object({
  id: z.enum(["debug"]),
  label: z.string().min(1),
});

export type PlayFooterMenuItem = z.infer<typeof PlayFooterMenuItemSchema>;
