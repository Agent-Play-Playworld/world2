import { z } from "zod";

export const MoneyFlowStepSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  body: z.string().min(1),
  href: z.string().url().optional(),
  hrefLabel: z.string().min(1).optional(),
});

export type MoneyFlowStep = z.infer<typeof MoneyFlowStepSchema>;
