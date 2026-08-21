import { useEffect, useRef } from "react";
import {
  formatNotificationPreview,
  isStickyNotification,
  notificationActorMark,
  NOTIFICATION_TRAY_AUTO_DISMISS_MS,
  proximityActionsForNotification,
} from "../lib/world-notification";
import type {
  PlayProximityAction,
  WorldNotificationPayload,
} from "../schemas/world-notification";

type NotificationTrayProps = {
  notifications: readonly WorldNotificationPayload[];
  onDismiss: (id: string) => void;
  onAcceptPeerCall?: (notification: WorldNotificationPayload) => void;
  onDeclinePeerCall?: (notification: WorldNotificationPayload) => void;
  onProximityAction?: (options: {
    action: PlayProximityAction;
    notification: WorldNotificationPayload;
  }) => void;
  autoDismissMs?: number;
};

const proximityActionLabel = (action: PlayProximityAction): string => {
  if (action === "assist") {
    return "Assist";
  }
  if (action === "chat") {
    return "Chat";
  }
  return "Push to Talk";
};

const NotificationCard = (options: {
  notification: WorldNotificationPayload;
  autoDismissMs: number;
  onDismiss: (id: string) => void;
  onAcceptPeerCall?: (notification: WorldNotificationPayload) => void;
  onDeclinePeerCall?: (notification: WorldNotificationPayload) => void;
  onProximityAction?: (options: {
    action: PlayProximityAction;
    notification: WorldNotificationPayload;
  }) => void;
}) => {
  const sticky = isStickyNotification(options.notification);
  const preview = formatNotificationPreview(options.notification);
  const actions = proximityActionsForNotification(options.notification);
  const focused = useRef(false);
  const remainingMs = useRef(options.autoDismissMs);
  const deadlineAt = useRef<number | null>(null);
  const timerId = useRef<number | null>(null);

  const clearTimer = (): void => {
    if (timerId.current !== null) {
      window.clearTimeout(timerId.current);
      timerId.current = null;
    }
  };

  const schedule = (): void => {
    clearTimer();
    if (sticky || focused.current) {
      return;
    }
    deadlineAt.current = Date.now() + remainingMs.current;
    timerId.current = window.setTimeout(() => {
      options.onDismiss(options.notification.id);
    }, remainingMs.current);
  };

  useEffect(() => {
    remainingMs.current = options.autoDismissMs;
    schedule();
    return clearTimer;
  }, [options.notification.id, options.autoDismissMs, options.onDismiss, sticky]);

  const pause = (): void => {
    focused.current = true;
    if (deadlineAt.current !== null) {
      remainingMs.current = Math.max(0, deadlineAt.current - Date.now());
    }
    clearTimer();
  };

  const resume = (): void => {
    focused.current = false;
    schedule();
  };

  const runProximityAction = (action: PlayProximityAction): void => {
    if (action === "talk" && options.notification.kind === "peer_call_invite") {
      options.onAcceptPeerCall?.(options.notification);
      options.onDismiss(options.notification.id);
    }
    options.onProximityAction?.({
      action,
      notification: options.notification,
    });
  };

  return (
    <article
      className="play-notification-card"
      data-notification-id={options.notification.id}
      data-notification-kind={options.notification.kind}
      tabIndex={0}
      onMouseEnter={pause}
      onMouseLeave={resume}
      onFocus={pause}
      onBlur={resume}
    >
      <header className="play-notification-header">
        <span className="play-notification-mark" aria-hidden="true">
          {notificationActorMark(options.notification)}
        </span>
        <div className="play-notification-copy">
          <p className="play-notification-kicker">{options.notification.kind.replaceAll("_", " ")}</p>
          <p className="play-notification-title">{options.notification.title}</p>
        </div>
        <button
          type="button"
          className="play-notification-dismiss"
          aria-label="Dismiss notification"
          onClick={() => {
            options.onDismiss(options.notification.id);
          }}
        >
          x
        </button>
      </header>
      <p className="play-notification-description">
        {options.notification.description}
      </p>
      {preview === null ? null : (
        <p className="play-notification-preview">{preview}</p>
      )}
      {actions.length === 0 ? null : (
        <div className="play-notification-visas" role="group" aria-label="Nearby actions">
          {actions.map((action) => (
            <button
              key={action}
              type="button"
              className={
                action === "talk"
                  ? "play-notification-visa play-notification-visa-talk"
                  : "play-notification-visa"
              }
              onClick={() => {
                runProximityAction(action);
              }}
            >
              {proximityActionLabel(action)}
            </button>
          ))}
        </div>
      )}
      {options.notification.kind === "peer_call_invite" ? (
        <div className="play-notification-actions">
          <button
            type="button"
            className="play-notification-decline"
            onClick={() => {
              options.onDeclinePeerCall?.(options.notification);
              options.onDismiss(options.notification.id);
            }}
          >
            Decline
          </button>
        </div>
      ) : null}
    </article>
  );
};

export const NotificationTray = (options: NotificationTrayProps) => {
  const autoDismissMs = options.autoDismissMs ?? NOTIFICATION_TRAY_AUTO_DISMISS_MS;
  if (options.notifications.length === 0) {
    return null;
  }
  return (
    <div
      className="play-notification-tray play-notification-toast"
      role="region"
      aria-label="Notifications"
    >
      {options.notifications.map((notification) => (
        <NotificationCard
          key={notification.id}
          notification={notification}
          autoDismissMs={autoDismissMs}
          onDismiss={options.onDismiss}
          {...(options.onAcceptPeerCall === undefined
            ? {}
            : { onAcceptPeerCall: options.onAcceptPeerCall })}
          {...(options.onDeclinePeerCall === undefined
            ? {}
            : { onDeclinePeerCall: options.onDeclinePeerCall })}
          {...(options.onProximityAction === undefined
            ? {}
            : { onProximityAction: options.onProximityAction })}
        />
      ))}
    </div>
  );
};
