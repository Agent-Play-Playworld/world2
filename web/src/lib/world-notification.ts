import {
  PlayProximityActionSchema,
  WorldNotificationPayloadSchema,
} from "../schemas/world-notification";
import type {
  PlayProximityAction,
  WorldNotificationKind,
  WorldNotificationPayload,
} from "../schemas/world-notification";

export const NOTIFICATION_TRAY_AUTO_DISMISS_MS = 10_000;

export const parseWorldNotificationPayload = (
  payload: unknown
): WorldNotificationPayload => {
  return WorldNotificationPayloadSchema.parse(payload);
};

export const tryParseWorldNotificationPayload = (
  payload: unknown
): WorldNotificationPayload | null => {
  const parsed = WorldNotificationPayloadSchema.safeParse(payload);
  return parsed.success ? parsed.data : null;
};

export const extractWorldNotificationFromIntercomResult = (
  result: unknown
): WorldNotificationPayload | null => {
  if (typeof result !== "object" || result === null) {
    return null;
  }
  const record = result as Record<string, unknown>;
  return tryParseWorldNotificationPayload(record.notification);
};

type BuildWorldNotificationOptions = {
  id: string;
  kind: WorldNotificationKind;
  title: string;
  description: string;
  createdAt: string;
  actorPlayerId: string;
  targetPlayerId?: string;
  messageRequestId?: string;
  metadata?: Record<string, unknown>;
};

export const buildWorldNotification = (
  options: BuildWorldNotificationOptions
): WorldNotificationPayload => {
  return WorldNotificationPayloadSchema.parse({
    id: options.id,
    kind: options.kind,
    title: options.title,
    description: options.description,
    createdAt: options.createdAt,
    actorPlayerId: options.actorPlayerId,
    ...(options.targetPlayerId === undefined
      ? {}
      : { targetPlayerId: options.targetPlayerId }),
    ...(options.messageRequestId === undefined
      ? {}
      : { messageRequestId: options.messageRequestId }),
    metadata: options.metadata ?? {},
  });
};

const clipPreview = (value: string | undefined, fallback: string): string => {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim().slice(0, 80);
  }
  return fallback;
};

export const buildMessageLikeNotification = (options: {
  id: string;
  createdAt: string;
  actorPlayerId: string;
  targetPlayerId: string;
  messageRequestId: string;
  messagePreview?: string;
}): WorldNotificationPayload => {
  const preview = clipPreview(options.messagePreview, "your message");
  return buildWorldNotification({
    id: options.id,
    kind: "message_like",
    title: "New like",
    description: `${options.actorPlayerId} liked ${preview}`,
    createdAt: options.createdAt,
    actorPlayerId: options.actorPlayerId,
    targetPlayerId: options.targetPlayerId,
    messageRequestId: options.messageRequestId,
    metadata: {
      reactionKind: "thumbs_up",
      messagePreview: preview,
    },
  });
};

export const buildMessageLoveNotification = (options: {
  id: string;
  createdAt: string;
  actorPlayerId: string;
  targetPlayerId: string;
  messageRequestId: string;
  messagePreview?: string;
}): WorldNotificationPayload => {
  const preview = clipPreview(options.messagePreview, "your message");
  return buildWorldNotification({
    id: options.id,
    kind: "message_love",
    title: "New love",
    description: `${options.actorPlayerId} loved ${preview}`,
    createdAt: options.createdAt,
    actorPlayerId: options.actorPlayerId,
    targetPlayerId: options.targetPlayerId,
    messageRequestId: options.messageRequestId,
    metadata: {
      reactionKind: "love",
      messagePreview: preview,
    },
  });
};

export const buildMessageReplyNotification = (options: {
  id: string;
  createdAt: string;
  actorPlayerId: string;
  targetPlayerId: string;
  messageRequestId: string;
  replyPreview?: string;
}): WorldNotificationPayload => {
  const preview = clipPreview(options.replyPreview, "your message");
  return buildWorldNotification({
    id: options.id,
    kind: "message_reply",
    title: "New reply",
    description: `${options.actorPlayerId} replied: ${preview}`,
    createdAt: options.createdAt,
    actorPlayerId: options.actorPlayerId,
    targetPlayerId: options.targetPlayerId,
    messageRequestId: options.messageRequestId,
    metadata: {
      replyPreview: preview,
    },
  });
};

export const PROXIMITY_ACTIONS: readonly PlayProximityAction[] = [
  PlayProximityActionSchema.parse("assist"),
  PlayProximityActionSchema.parse("chat"),
  PlayProximityActionSchema.parse("talk"),
];

export const buildProximityInviteNotification = (options: {
  id: string;
  createdAt: string;
  actorPlayerId: string;
  displayName?: string;
}): WorldNotificationPayload => {
  const name = clipPreview(options.displayName, options.actorPlayerId);
  return buildWorldNotification({
    id: options.id,
    kind: "proximity_invite",
    title: "Nearby",
    description: `${name} is in reach`,
    createdAt: options.createdAt,
    actorPlayerId: options.actorPlayerId,
    metadata: {
      displayName: name,
      sticky: true,
    },
  });
};

export const buildRoomJoinNotification = (options: {
  id: string;
  createdAt: string;
  actorPlayerId: string;
  displayName?: string;
}): WorldNotificationPayload => {
  const name = clipPreview(options.displayName, options.actorPlayerId);
  return buildWorldNotification({
    id: options.id,
    kind: "room_join",
    title: "Someone joined",
    description: `${name} joined the room`,
    createdAt: options.createdAt,
    actorPlayerId: options.actorPlayerId,
    metadata: {
      displayName: name,
    },
  });
};

export const buildPeerCallInviteNotification = (options: {
  id: string;
  createdAt: string;
  callerId: string;
  calleeId: string;
  callId: string;
  callerDisplayName?: string;
}): WorldNotificationPayload => {
  const name = clipPreview(options.callerDisplayName, options.callerId);
  return buildWorldNotification({
    id: options.id,
    kind: "peer_call_invite",
    title: "Incoming call",
    description: `${name} wants to talk`,
    createdAt: options.createdAt,
    actorPlayerId: options.callerId,
    targetPlayerId: options.calleeId,
    metadata: {
      callId: options.callId,
      callerId: options.callerId,
      callerDisplayName: name,
      sticky: true,
    },
  });
};

export const buildPeerCallDeclinedNotification = (options: {
  id: string;
  createdAt: string;
  callerId: string;
  calleeId: string;
  callId: string;
}): WorldNotificationPayload => {
  return buildWorldNotification({
    id: options.id,
    kind: "peer_call_declined",
    title: "Call declined",
    description: "Your call was declined",
    createdAt: options.createdAt,
    actorPlayerId: options.calleeId,
    targetPlayerId: options.callerId,
    metadata: {
      callId: options.callId,
      calleeId: options.calleeId,
    },
  });
};

export const shouldDeliverWorldNotification = (options: {
  notification: WorldNotificationPayload;
  viewerPlayerId: string | null;
}): boolean => {
  const viewer = options.viewerPlayerId?.trim() ?? "";
  if (viewer.length === 0) {
    return false;
  }
  if (options.notification.actorPlayerId === viewer) {
    return false;
  }
  if (
    options.notification.kind === "room_join" ||
    options.notification.kind === "proximity_invite"
  ) {
    return true;
  }
  return options.notification.targetPlayerId === viewer;
};

export type PushNotification = (notification: WorldNotificationPayload) => void;

export const ingestIntercomNotificationResult = (options: {
  result: unknown;
  viewerPlayerId: string | null;
  push: PushNotification;
}): void => {
  const notification = extractWorldNotificationFromIntercomResult(options.result);
  if (notification === null) {
    return;
  }
  if (
    !shouldDeliverWorldNotification({
      notification,
      viewerPlayerId: options.viewerPlayerId,
    })
  ) {
    return;
  }
  options.push(notification);
};

export const ingestRoomJoinNotification = (options: {
  playerId: string;
  displayName?: string;
  viewerPlayerId: string | null;
  createdAt: string;
  notificationId: string;
  push: PushNotification;
}): void => {
  const notification = buildRoomJoinNotification({
    id: options.notificationId,
    createdAt: options.createdAt,
    actorPlayerId: options.playerId,
    ...(options.displayName === undefined ? {} : { displayName: options.displayName }),
  });
  if (
    !shouldDeliverWorldNotification({
      notification,
      viewerPlayerId: options.viewerPlayerId,
    })
  ) {
    return;
  }
  options.push(notification);
};

export const isStickyNotification = (
  notification: WorldNotificationPayload
): boolean => {
  if (
    notification.kind === "peer_call_invite" ||
    notification.kind === "proximity_invite"
  ) {
    return true;
  }
  return notification.metadata.sticky === true;
};

export const proximityActionsForNotification = (
  notification: WorldNotificationPayload
): readonly PlayProximityAction[] => {
  if (notification.kind === "message_reply") {
    return [PlayProximityActionSchema.parse("chat")];
  }
  if (
    notification.kind === "proximity_invite" ||
    notification.kind === "room_join" ||
    notification.kind === "peer_call_invite"
  ) {
    return PROXIMITY_ACTIONS;
  }
  return [];
};

export const notificationActorLabel = (
  notification: WorldNotificationPayload
): string => {
  const displayName = notification.metadata.displayName;
  if (typeof displayName === "string" && displayName.trim().length > 0) {
    return displayName.trim();
  }
  const callerDisplayName = notification.metadata.callerDisplayName;
  if (typeof callerDisplayName === "string" && callerDisplayName.trim().length > 0) {
    return callerDisplayName.trim();
  }
  return notification.actorPlayerId;
};

export const notificationActorMark = (
  notification: WorldNotificationPayload
): string => {
  const label = notificationActorLabel(notification);
  const mark = label.slice(0, 1).toUpperCase();
  return mark.length > 0 ? mark : "W";
};

export const formatSessionTarget = (name?: string): string => {
  const trimmed = name?.trim() ?? "";
  if (trimmed.length === 0) {
    return "Target: (none)";
  }
  return `Target: ${trimmed}`;
};

export const formatNotificationPreview = (
  notification: WorldNotificationPayload
): string | null => {
  const parts: string[] = [];
  const reactionKind = notification.metadata.reactionKind;
  if (typeof reactionKind === "string" && reactionKind.length > 0) {
    parts.push(reactionKind === "thumbs_up" ? "like" : reactionKind);
  }
  const messagePreview = notification.metadata.messagePreview;
  if (typeof messagePreview === "string" && messagePreview.length > 0) {
    parts.push(messagePreview);
  }
  const replyPreview = notification.metadata.replyPreview;
  if (typeof replyPreview === "string" && replyPreview.length > 0) {
    parts.push(replyPreview);
  }
  const displayName = notification.metadata.displayName;
  if (typeof displayName === "string" && displayName.length > 0) {
    parts.push(displayName);
  }
  const callerDisplayName = notification.metadata.callerDisplayName;
  if (typeof callerDisplayName === "string" && callerDisplayName.length > 0) {
    parts.push(callerDisplayName);
  }
  if (parts.length === 0) {
    return null;
  }
  return parts.join(" · ");
};
