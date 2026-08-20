import { z } from "zod";

export const MoneyFlowMapNodeSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
});

export type MoneyFlowMapNode = z.infer<typeof MoneyFlowMapNodeSchema>;

export const MoneyFlowHopSchema = z.object({
  fromId: z.string().min(1),
  toId: z.string().min(1),
  d: z.string().min(1),
});

export type MoneyFlowHop = z.infer<typeof MoneyFlowHopSchema>;
