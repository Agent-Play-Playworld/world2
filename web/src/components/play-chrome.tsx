import { useEffect, useState, type PointerEvent as ReactPointerEvent } from "react";
import { downloadCitizenshipCredentials } from "../lib/download-credentials";
import type { OccupancyFetch } from "../lib/occupancy-client";
import { fetchGameStats, fetchPlayerWallet } from "../lib/occupancy-client";
import type { CreateOccupancyEventSource } from "../lib/occupancy-events";
import { subscribeOccupancyEvents } from "../lib/occupancy-events";
import { resolveOccupancyOrigin } from "../lib/occupancy-origin";
import {
  COMPACT_PLAY_CHROME_QUERY,
  PLAY_TOUCH_KEYS,
  SESSION_PANEL_MAX_WIDTH_PX,
  isCompactPlayChrome,
} from "../lib/play-chrome";
import {
  defaultGameStreakPreview,
  defaultWalletPreview,
  formatApuCount,
  formatApwBalance,
  gameStreakFromOccupancyStats,
  occupancyChatLineFromIntercomEvent,
  occupancyJoinFromPlayerAdded,
  parsePlayDebugSnapshot,
  walletPreviewFromOccupancy,
} from "../lib/play-preview";
import {
  ingestIntercomNotificationResult,
  ingestRoomJoinNotification,
} from "../lib/world-notification";
import {
  WORLD_INTERCOM_SSE,
  WORLD_PLAYER_ADDED_SSE,
  OccupancyIntercomEnvelopeSchema,
} from "../schemas/occupancy-play";
import type { PlayModalId, PlayPanelId } from "../schemas/play-chrome";
import type { GameStreakPreview, WalletPreview, WorldChatLine } from "../schemas/play-preview";
import type { WorldNotificationPayload } from "../schemas/world-notification";
import { DebugRadar } from "./debug-radar";
import { FloatingPanel } from "./floating-panel";
import { NotificationTray } from "./notification-tray";
import {
  CreateNodeModal,
  GameStreakModal,
  InviteFriendsModal,
  WalletInventoryModal,
} from "./play-modals";
import { SessionBooth } from "./session-booth";
import { WorldChatRoom } from "./world-chat-room";

type PlayChromeProps = {
  occupancyOrigin?: string | undefined;
  sid?: string | undefined;
  nodeId?: string | undefined;
  passw?: string | undefined;
  snapshot?: unknown;
  fetchFn?: OccupancyFetch | undefined;
  createEventSource?: CreateOccupancyEventSource | undefined;
  onCreateNewNode?: (() => void) | undefined;
};

const clampStick = (value: number, limit: number): number => {
  return Math.min(limit, Math.max(-limit, value));
};

export const PlayChrome = (options: PlayChromeProps = {}) => {
  const occupancyOrigin = options.occupancyOrigin ?? resolveOccupancyOrigin();
  const [stick, setStick] = useState({ x: 0, y: 0 });
  const [openModal, setOpenModal] = useState<PlayModalId | null>(null);
  const [collapsed, setCollapsed] = useState<Record<PlayPanelId, boolean>>({
    messages: false,
    session: false,
    debug: false,
  });
  const [wallet, setWallet] = useState<WalletPreview>(() => defaultWalletPreview());
  const [stats, setStats] = useState<GameStreakPreview>(() =>
    defaultGameStreakPreview()
  );
  const [notifications, setNotifications] = useState<
    readonly WorldNotificationPayload[]
  >([]);
  const [liveChatLine, setLiveChatLine] = useState<WorldChatLine | null>(null);
  const debugPreview = parsePlayDebugSnapshot(options.snapshot);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") {
      return;
    }
    const media = window.matchMedia(COMPACT_PLAY_CHROME_QUERY);
    const sync = (): void => {
      const compact = isCompactPlayChrome(media);
      setCollapsed({
        messages: compact,
        session: compact,
        debug: compact,
      });
    };
    sync();
    media.addEventListener("change", sync);
    return () => {
      media.removeEventListener("change", sync);
    };
  }, []);

  useEffect(() => {
    const sid = options.sid;
    const nodeId = options.nodeId;
    if (sid === undefined || nodeId === undefined) {
      return;
    }
    let cancelled = false;
    const load = async (): Promise<void> => {
      try {
        const liveWallet = await fetchPlayerWallet({
          origin: occupancyOrigin,
          playerId: nodeId,
          sid,
          fetchFn: options.fetchFn,
        });
        if (!cancelled) {
          setWallet(walletPreviewFromOccupancy(liveWallet));
        }
      } catch {
        return;
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [occupancyOrigin, options.fetchFn, options.nodeId, options.sid]);

  useEffect(() => {
    const sid = options.sid;
    const nodeId = options.nodeId;
    if (sid === undefined || nodeId === undefined) {
      return;
    }
    let cancelled = false;
    const load = async (): Promise<void> => {
      try {
        const liveStats = await fetchGameStats({
          origin: occupancyOrigin,
          playerId: nodeId,
          sid,
          fetchFn: options.fetchFn,
        });
        if (!cancelled) {
          setStats(gameStreakFromOccupancyStats(liveStats));
        }
      } catch {
        return;
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [occupancyOrigin, options.fetchFn, options.nodeId, options.sid]);

  useEffect(() => {
    const sid = options.sid;
    const nodeId = options.nodeId;
    if (sid === undefined) {
      return;
    }
    const pushNotification = (notification: WorldNotificationPayload): void => {
      setNotifications((current) => [
        notification,
        ...current.filter((item) => item.id !== notification.id),
      ]);
    };
    const subscription = subscribeOccupancyEvents({
      origin: occupancyOrigin,
      sid,
      ...(options.createEventSource === undefined
        ? {}
        : { createEventSource: options.createEventSource }),
      onEvent: (event) => {
        if (event.type === WORLD_PLAYER_ADDED_SSE) {
          const join = occupancyJoinFromPlayerAdded(event.data);
          if (join === null) {
            return;
          }
          ingestRoomJoinNotification({
            playerId: join.playerId,
            ...(join.displayName === undefined
              ? {}
              : { displayName: join.displayName }),
            viewerPlayerId: nodeId ?? null,
            createdAt: new Date().toISOString(),
            notificationId: `join-${join.playerId}-${String(Date.now())}`,
            push: pushNotification,
          });
          return;
        }
        if (event.type !== WORLD_INTERCOM_SSE) {
          return;
        }
        const envelope = OccupancyIntercomEnvelopeSchema.safeParse(event.data);
        ingestIntercomNotificationResult({
          result: envelope.success ? envelope.data.result ?? envelope.data : event.data,
          viewerPlayerId: nodeId ?? null,
          push: pushNotification,
        });
        if (nodeId === undefined) {
          return;
        }
        const line = occupancyChatLineFromIntercomEvent({
          event: event.data,
          viewerId: nodeId,
        });
        if (line !== null) {
          setLiveChatLine(line);
        }
      },
    });
    return () => {
      subscription.close();
    };
  }, [
    occupancyOrigin,
    options.createEventSource,
    options.nodeId,
    options.sid,
  ]);

  const onPadPointer = (
    event: ReactPointerEvent<HTMLDivElement>,
    active: boolean
  ): void => {
    if (!active) {
      setStick({ x: 0, y: 0 });
      return;
    }
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - bounds.left - bounds.width / 2;
    const y = event.clientY - bounds.top - bounds.height / 2;
    setStick({
      x: clampStick(x, bounds.width / 4),
      y: clampStick(y, bounds.height / 4),
    });
  };

  const setPanelCollapsed = (id: PlayPanelId, next: boolean): void => {
    setCollapsed((current) => ({ ...current, [id]: next }));
  };

  return (
    <div className="play-chrome">
      <NotificationTray
        notifications={notifications}
        onDismiss={(id) => {
          setNotifications((current) => current.filter((item) => item.id !== id));
        }}
      />
      <div className="play-hud-dock" role="group" aria-label="Wallet and arcade controls">
        <button
          type="button"
          className="play-games-pill"
          aria-label="Games G"
          onClick={() => {
            setOpenModal("games");
          }}
        >
          Games G
        </button>
        <button
          type="button"
          className="play-wallet-chip"
          aria-label="Open wallet inventory"
          onClick={() => {
            setOpenModal("wallet");
          }}
        >
          <span className="play-wallet-chip-dot" aria-hidden="true" />
          <span>{formatApwBalance(wallet.balanceUsd)}</span>
          <span className="play-wallet-diamond" aria-hidden="true" />
          <span>{formatApuCount(wallet.powerUps)}</span>
          <span aria-hidden="true">▾</span>
        </button>
      </div>
      <div className="play-touch-pad play-touch-pad-bar play-touch-pad-top" role="group" aria-label="Touch pad">
        <span className="play-touch-pad-drag" aria-hidden="true">
          ⋮
        </span>
        {PLAY_TOUCH_KEYS.map((key) => (
          <button
            key={key.id}
            type="button"
            className={`play-touch-key play-touch-key-${key.id}`}
            aria-label={key.label}
            onClick={() => {
              if (key.id === "wallet") {
                setOpenModal("wallet");
              }
            }}
          >
            <span className="play-touch-letter">{key.letter}</span>
            <span className="play-touch-label">{key.label}</span>
          </button>
        ))}
      </div>
      <div className="play-chrome-top">
        <FloatingPanel
          label="World chat room"
          moveLabel="Move world chat panel"
          className="play-panel-messages"
          collapsed={collapsed.messages}
          onCollapsedChange={(next) => {
            setPanelCollapsed("messages", next);
          }}
        >
          <WorldChatRoom
            nodeId={options.nodeId}
            snapshot={options.snapshot}
            occupancyOrigin={occupancyOrigin}
            sid={options.sid}
            fetchFn={options.fetchFn}
            liveLine={liveChatLine}
          />
        </FloatingPanel>
        <FloatingPanel
          label="Human agent interaction"
          moveLabel="Move human agent interaction panel"
          className="play-panel-session"
          defaultWidthPx={SESSION_PANEL_MAX_WIDTH_PX}
          collapsed={collapsed.session}
          onCollapsedChange={(next) => {
            setPanelCollapsed("session", next);
          }}
        >
          <SessionBooth
            occupancyOrigin={occupancyOrigin}
            nodeId={options.nodeId}
            passw={options.passw}
            onDownload={
              options.passw !== undefined && options.nodeId !== undefined
                ? () => {
                    downloadCitizenshipCredentials({
                      nodeId: options.nodeId ?? "",
                      passw: options.passw ?? "",
                      serverUrl: occupancyOrigin,
                    });
                  }
                : undefined
            }
            onInvite={() => {
              setOpenModal("referrals");
            }}
            onCreateNode={() => {
              setOpenModal("create-node");
            }}
          />
        </FloatingPanel>
        <FloatingPanel
          label="Debug"
          moveLabel="Move debug panel"
          className="play-panel-debug"
          landmark="complementary"
          collapsed={collapsed.debug}
          onCollapsedChange={(next) => {
            setPanelCollapsed("debug", next);
          }}
        >
          <DebugRadar
            occupancyOrigin={occupancyOrigin}
            sid={options.sid}
            nodeId={options.nodeId}
            preview={debugPreview}
          />
        </FloatingPanel>
      </div>
      <div className="play-chrome-hands">
        <div className="play-pad play-pad-center" role="group" aria-label="Play pad">
          <span className="play-pad-label">Play Pad</span>
          <div
            className="play-pad-base"
            onPointerDown={(event) => {
              if (typeof event.currentTarget.setPointerCapture === "function") {
                event.currentTarget.setPointerCapture(event.pointerId);
              }
              onPadPointer(event, true);
            }}
            onPointerMove={(event) => {
              const captured =
                typeof event.currentTarget.hasPointerCapture === "function"
                  ? event.currentTarget.hasPointerCapture(event.pointerId)
                  : true;
              if (captured) {
                onPadPointer(event, true);
              }
            }}
            onPointerUp={(event) => {
              onPadPointer(event, false);
            }}
            onPointerCancel={(event) => {
              onPadPointer(event, false);
            }}
          >
            <span
              className="play-pad-stick"
              style={{
                transform: `translate(${String(stick.x)}px, ${String(stick.y)}px)`,
              }}
            />
          </div>
        </div>
      </div>
      {openModal === "games" ? (
        <GameStreakModal
          stats={stats}
          wallet={wallet}
          onClose={() => {
            setOpenModal(null);
          }}
        />
      ) : null}
      {openModal === "wallet" ? (
        <WalletInventoryModal
          wallet={wallet}
          onClose={() => {
            setOpenModal(null);
          }}
        />
      ) : null}
      {openModal === "referrals" ? (
        <InviteFriendsModal
          nodeId={options.nodeId ?? "preview"}
          onClose={() => {
            setOpenModal(null);
          }}
        />
      ) : null}
      {openModal === "create-node" ? (
        <CreateNodeModal
          onCancel={() => {
            setOpenModal(null);
          }}
          onConfirm={() => {
            setOpenModal(null);
            options.onCreateNewNode?.();
          }}
        />
      ) : null}
    </div>
  );
};
