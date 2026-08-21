import { z } from "zod";

const NonEmpty = z.string().trim().min(1);

export const WORLD_NOTIFICATION_CHANNEL = "intercom:world:notifications" as const;

export const WorldNotificationKindSchema = z.enum([
  "message_like",
  "message_love",
  "message_reply",
  "room_join",
  "peer_call_invite",
  "peer_call_declined",
  "proximity_invite",
]);

export const PlayProximityActionSchema = z.enum(["assist", "chat", "talk"]);

export type PlayProximityAction = z.infer<typeof PlayProximityActionSchema>;

export type WorldNotificationKind = z.infer<typeof WorldNotificationKindSchema>;

export const WorldNotificationPayloadSchema = z.object({
  id: NonEmpty,
  kind: WorldNotificationKindSchema,
  title: NonEmpty,
  description: NonEmpty,
  createdAt: NonEmpty,
  actorPlayerId: NonEmpty,
  targetPlayerId: NonEmpty.optional(),
  messageRequestId: NonEmpty.optional(),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export type WorldNotificationPayload = z.infer<
  typeof WorldNotificationPayloadSchema
>;
