import { describe, expect, it, vi } from "vitest";
import {
  buildMessageLikeNotification,
  buildMessageLoveNotification,
  buildMessageReplyNotification,
  buildPeerCallDeclinedNotification,
  buildPeerCallInviteNotification,
  buildProximityInviteNotification,
  buildRoomJoinNotification,
  extractWorldNotificationFromIntercomResult,
  formatNotificationPreview,
  ingestIntercomNotificationResult,
  ingestRoomJoinNotification,
  isStickyNotification,
  parseWorldNotificationPayload,
  proximityActionsForNotification,
  shouldDeliverWorldNotification,
} from "./world-notification";

describe("world notifications", () => {
  it("parses a notification with title, description, and preview metadata", () => {
    const notification = parseWorldNotificationPayload({
      id: "n-1",
      kind: "message_like",
      title: "New like",
      description: "alice liked hello street",
      createdAt: "2026-08-21T12:00:00.000Z",
      actorPlayerId: "alice",
      targetPlayerId: "bob",
      messageRequestId: "msg-1",
      metadata: { reactionKind: "thumbs_up", messagePreview: "hello street" },
    });
    expect(notification.title).toBe("New like");
    expect(notification.description).toContain("alice");
    expect(formatNotificationPreview(notification)).toContain("hello street");
  });

  it("builds like, love, reply, and room join notifications", () => {
    expect(
      buildMessageLikeNotification({
        id: "n-like",
        createdAt: "2026-08-21T12:00:00.000Z",
        actorPlayerId: "alice",
        targetPlayerId: "bob",
        messageRequestId: "msg-1",
        messagePreview: "hello world",
      }).kind
    ).toBe("message_like");
    expect(
      buildMessageLoveNotification({
        id: "n-love",
        createdAt: "2026-08-21T12:00:00.000Z",
        actorPlayerId: "alice",
        targetPlayerId: "bob",
        messageRequestId: "msg-1",
      }).kind
    ).toBe("message_love");
    expect(
      buildMessageReplyNotification({
        id: "n-reply",
        createdAt: "2026-08-21T12:00:00.000Z",
        actorPlayerId: "alice",
        targetPlayerId: "bob",
        messageRequestId: "msg-1",
        replyPreview: "thanks",
      }).kind
    ).toBe("message_reply");
    expect(
      buildRoomJoinNotification({
        id: "n-join",
        createdAt: "2026-08-21T12:00:00.000Z",
        actorPlayerId: "carol",
        displayName: "Carol",
      }).description
    ).toContain("Carol");
  });

  it("extracts notification payloads from occupancy intercom results", () => {
    const notification = buildRoomJoinNotification({
      id: "n-join",
      createdAt: "2026-08-21T12:00:00.000Z",
      actorPlayerId: "carol",
    });
    expect(
      extractWorldNotificationFromIntercomResult({
        seq: 1,
        notification,
      })
    ).toEqual(notification);
    expect(extractWorldNotificationFromIntercomResult({ seq: 1 })).toBeNull();
  });

  it("delivers targeted notifications only to the target viewer", () => {
    const like = buildMessageLikeNotification({
      id: "n-like",
      createdAt: "2026-08-21T12:00:00.000Z",
      actorPlayerId: "alice",
      targetPlayerId: "bob",
      messageRequestId: "msg-1",
    });
    expect(
      shouldDeliverWorldNotification({
        notification: like,
        viewerPlayerId: "bob",
      })
    ).toBe(true);
    expect(
      shouldDeliverWorldNotification({
        notification: like,
        viewerPlayerId: "alice",
      })
    ).toBe(false);
    expect(
      shouldDeliverWorldNotification({
        notification: like,
        viewerPlayerId: "carol",
      })
    ).toBe(false);
  });

  it("pushes occupancy intercom notifications for the player who was tagged", () => {
    const push = vi.fn();
    const notification = buildMessageLikeNotification({
      id: "n-1",
      createdAt: "2026-08-21T12:00:00.000Z",
      actorPlayerId: "alice",
      targetPlayerId: "bob",
      messageRequestId: "msg-1",
      messagePreview: "hello street",
    });
    ingestIntercomNotificationResult({
      result: { notification },
      viewerPlayerId: "bob",
      push,
    });
    expect(push).toHaveBeenCalledWith(notification);
    push.mockClear();
    ingestIntercomNotificationResult({
      result: { notification },
      viewerPlayerId: "carol",
      push,
    });
    expect(push).not.toHaveBeenCalled();
  });

  it("pushes room join notifications for other players", () => {
    const push = vi.fn();
    ingestRoomJoinNotification({
      playerId: "carol",
      displayName: "Carol",
      viewerPlayerId: "bob",
      createdAt: "2026-08-21T12:00:00.000Z",
      notificationId: "join-carol",
      push,
    });
    expect(push).toHaveBeenCalledWith(
      buildRoomJoinNotification({
        id: "join-carol",
        createdAt: "2026-08-21T12:00:00.000Z",
        actorPlayerId: "carol",
        displayName: "Carol",
      })
    );
  });

  it("offers assist, chat, and push to talk on nearby and incoming-call toasts", () => {
    const nearby = buildProximityInviteNotification({
      id: "n-near",
      createdAt: "2026-08-21T12:00:00.000Z",
      actorPlayerId: "ag-1",
      displayName: "Maple bot",
    });
    expect(nearby.kind).toBe("proximity_invite");
    expect(nearby.title).toBe("Nearby");
    expect(nearby.description).toContain("Maple bot");
    expect(isStickyNotification(nearby)).toBe(true);
    expect(proximityActionsForNotification(nearby)).toEqual([
      "assist",
      "chat",
      "talk",
    ]);
    expect(
      proximityActionsForNotification(
        buildRoomJoinNotification({
          id: "n-join",
          createdAt: "2026-08-21T12:00:00.000Z",
          actorPlayerId: "carol",
          displayName: "Carol",
        })
      )
    ).toEqual(["assist", "chat", "talk"]);
    expect(
      proximityActionsForNotification(
        buildPeerCallInviteNotification({
          id: "n-invite",
          createdAt: "2026-08-21T12:00:00.000Z",
          callerId: "caller-1",
          calleeId: "callee-1",
          callId: "call-1",
        })
      )
    ).toEqual(["assist", "chat", "talk"]);
    expect(
      proximityActionsForNotification(
        buildMessageLikeNotification({
          id: "n-like",
          createdAt: "2026-08-21T12:00:00.000Z",
          actorPlayerId: "alice",
          targetPlayerId: "bob",
          messageRequestId: "msg-1",
        })
      )
    ).toEqual([]);
    expect(
      proximityActionsForNotification(
        buildMessageReplyNotification({
          id: "n-reply",
          createdAt: "2026-08-21T12:00:00.000Z",
          actorPlayerId: "alice",
          targetPlayerId: "bob",
          messageRequestId: "msg-1",
          replyPreview: "thanks",
        })
      )
    ).toEqual(["chat"]);
  });

  it("keeps incoming call notifications sticky until the player answers", () => {
    const invite = buildPeerCallInviteNotification({
      id: "n-invite",
      createdAt: "2026-08-21T12:00:00.000Z",
      callerId: "caller-1",
      calleeId: "callee-1",
      callId: "call-1",
      callerDisplayName: "Alex",
    });
    expect(isStickyNotification(invite)).toBe(true);
    expect(
      shouldDeliverWorldNotification({
        notification: invite,
        viewerPlayerId: "callee-1",
      })
    ).toBe(true);
    expect(
      isStickyNotification(
        buildPeerCallDeclinedNotification({
          id: "n-declined",
          createdAt: "2026-08-21T12:00:01.000Z",
          callerId: "caller-1",
          calleeId: "callee-1",
          callId: "call-1",
        })
      )
    ).toBe(false);
  });
});
