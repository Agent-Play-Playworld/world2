import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildMessageLikeNotification,
  buildPeerCallInviteNotification,
  buildProximityInviteNotification,
  NOTIFICATION_TRAY_AUTO_DISMISS_MS,
} from "../lib/world-notification";
import type { WorldNotificationPayload } from "../schemas/world-notification";
import { NotificationTray } from "./notification-tray";

const Harness = (options: {
  first: WorldNotificationPayload;
  second?: WorldNotificationPayload;
}) => {
  const [notifications, setNotifications] = useState<WorldNotificationPayload[]>(
    () => [options.first, ...(options.second === undefined ? [] : [options.second])]
  );
  return (
    <NotificationTray
      notifications={notifications}
      onDismiss={(id) => {
        setNotifications((current) => current.filter((item) => item.id !== id));
      }}
    />
  );
};

describe("notification tray", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows title, description, and a message preview for the player", () => {
    vi.useRealTimers();
    render(
      <NotificationTray
        notifications={[
          buildMessageLikeNotification({
            id: "n-1",
            createdAt: "2026-08-21T12:00:00.000Z",
            actorPlayerId: "alice",
            targetPlayerId: "bob",
            messageRequestId: "msg-1",
            messagePreview: "hello street",
          }),
        ]}
        onDismiss={() => undefined}
      />
    );
    const tray = screen.getByRole("region", { name: /notifications/i });
    expect(tray).toHaveClass("play-notification-tray", "play-notification-toast");
    expect(tray).toHaveTextContent("New like");
    expect(tray).toHaveTextContent("alice liked hello street");
    expect(tray).toHaveTextContent("hello street");
  });

  it("wraps a long preview instead of clipping it on one line", () => {
    vi.useRealTimers();
    const longPreview =
      "supercalifragilisticexpialidocious-notification-preview-that-must-wrap";
    render(
      <NotificationTray
        notifications={[
          buildMessageLikeNotification({
            id: "n-long",
            createdAt: "2026-08-21T12:00:00.000Z",
            actorPlayerId: "alice",
            targetPlayerId: "bob",
            messageRequestId: "msg-1",
            messagePreview: longPreview,
          }),
        ]}
        onDismiss={() => undefined}
      />
    );
    expect(document.querySelector(".play-notification-preview")).toHaveClass(
      "play-notification-preview"
    );
    expect(document.querySelector(".play-notification-title")).toHaveClass(
      "play-notification-title"
    );
  });

  it("auto-dismisses unfocused notifications after 10 seconds", () => {
    render(
      <Harness
        first={buildMessageLikeNotification({
          id: "n-auto",
          createdAt: "2026-08-21T12:00:00.000Z",
          actorPlayerId: "alice",
          targetPlayerId: "bob",
          messageRequestId: "msg-1",
          messagePreview: "hello street",
        })}
      />
    );
    expect(screen.getByText(/new like/i)).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(NOTIFICATION_TRAY_AUTO_DISMISS_MS - 1);
    });
    expect(screen.getByText(/new like/i)).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.queryByText(/new like/i)).not.toBeInTheDocument();
  });

  it("keeps a focused notification until it is dismissed", () => {
    render(
      <Harness
        first={buildMessageLikeNotification({
          id: "n-focus",
          createdAt: "2026-08-21T12:00:00.000Z",
          actorPlayerId: "alice",
          targetPlayerId: "bob",
          messageRequestId: "msg-1",
        })}
      />
    );
    fireEvent.mouseEnter(screen.getByRole("article"));
    act(() => {
      vi.advanceTimersByTime(NOTIFICATION_TRAY_AUTO_DISMISS_MS + 1000);
    });
    expect(screen.getByText(/new like/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /dismiss notification/i }));
    expect(screen.queryByText(/new like/i)).not.toBeInTheDocument();
  });

  it("answers an incoming call with push to talk and still offers decline", async () => {
    vi.useRealTimers();
    const user = userEvent.setup();
    const onAccept = vi.fn();
    const onDecline = vi.fn();
    const invite = buildPeerCallInviteNotification({
      id: "invite-2",
      createdAt: "2026-08-21T12:00:00.000Z",
      callerId: "caller-1",
      calleeId: "callee-1",
      callId: "call-1",
      callerDisplayName: "Alex",
    });
    const Tray = () => {
      const [notifications, setNotifications] = useState([invite]);
      return (
        <NotificationTray
          notifications={notifications}
          onDismiss={(id) => {
            setNotifications((current) => current.filter((item) => item.id !== id));
          }}
          onAcceptPeerCall={onAccept}
          onDeclinePeerCall={onDecline}
        />
      );
    };
    render(<Tray />);
    expect(screen.getByText(/incoming call/i)).toBeInTheDocument();
    expect(screen.getByText(/alex wants to talk/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^decline$/i })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /push to talk/i }));
    expect(onAccept).toHaveBeenCalledWith(invite);
    expect(screen.queryByText(/incoming call/i)).not.toBeInTheDocument();
  });

  it("lets the player assist, chat, or push to talk from a nearby toast", async () => {
    vi.useRealTimers();
    const user = userEvent.setup();
    const onProximityAction = vi.fn();
    const nearby = buildProximityInviteNotification({
      id: "n-near",
      createdAt: "2026-08-21T12:00:00.000Z",
      actorPlayerId: "ag-1",
      displayName: "Maple bot",
    });
    render(
      <NotificationTray
        notifications={[nearby]}
        onDismiss={() => undefined}
        onProximityAction={onProximityAction}
      />
    );
    const actions = screen.getByRole("group", { name: /nearby actions/i });
    expect(within(actions).getByRole("button", { name: /^assist$/i })).toBeInTheDocument();
    expect(within(actions).getByRole("button", { name: /^chat$/i })).toBeInTheDocument();
    expect(within(actions).getByRole("button", { name: /^push to talk$/i })).toBeInTheDocument();
    await user.click(within(actions).getByRole("button", { name: /^assist$/i }));
    expect(onProximityAction).toHaveBeenCalledWith({
      action: "assist",
      notification: nearby,
    });
  });
});
