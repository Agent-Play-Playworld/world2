import { z } from "zod";
import { InkLevelSchema, LifeLevelSchema } from "./ink";

export const AvatarSetItemSchema = z.object({
  id: z.literal("avatar-set"),
  kind: z.literal("avatar-set"),
  title: z.string().min(1),
  summary: z.string().min(1),
});

export const InkVialItemSchema = z.object({
  id: z.string().min(1),
  kind: z.literal("ink"),
  title: z.string().min(1),
  summary: z.string().min(1),
  inkLevel: InkLevelSchema,
  life: LifeLevelSchema,
});

export const StoreItemSchema = z.discriminatedUnion("kind", [
  AvatarSetItemSchema,
  InkVialItemSchema,
]);

export type StoreItem = z.infer<typeof StoreItemSchema>;
export type AvatarSetItem = z.infer<typeof AvatarSetItemSchema>;
export type InkVialItem = z.infer<typeof InkVialItemSchema>;

export const StoreOrderSchema = z.object({
  itemId: z.string().min(1),
  nodeId: z.string().min(1),
});

export type StoreOrder = z.infer<typeof StoreOrderSchema>;
