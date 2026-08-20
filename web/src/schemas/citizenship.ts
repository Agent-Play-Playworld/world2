import { z } from "zod";

export const CitizenshipCredentialSchema = z.object({
  serverUrl: z.string().min(1),
  nodeId: z.string().min(1),
  passw: z.string().min(1),
  secretFilePath: z.string().min(1).optional(),
  agentNodes: z
    .array(
      z.object({
        nodeId: z.string().min(1),
        passw: z.string().min(1),
        createdAt: z.string().min(1),
      })
    )
    .optional(),
});

export type CitizenshipCredential = z.infer<typeof CitizenshipCredentialSchema>;

export const AcceptedCitizenshipSchema = z.object({
  nodeId: z.string().min(1),
  serverUrl: z.literal("https://agent-play.com"),
});

export type AcceptedCitizenship = z.infer<typeof AcceptedCitizenshipSchema>;
