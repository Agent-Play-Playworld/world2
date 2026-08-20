import { z } from "zod";

export const InductionStepIdSchema = z.enum([
  "welcome",
  "papers",
  "restore",
  "sealed",
]);

export type InductionStepId = z.infer<typeof InductionStepIdSchema>;

export const InductionGateSchema = z.object({
  id: z.enum(["new", "return"]),
  title: z.string().min(1),
  action: z.string().min(1),
  hint: z.string().min(1),
});

export type InductionGate = z.infer<typeof InductionGateSchema>;
