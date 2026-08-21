import { useEffect, useState, type FormEvent } from "react";
import type { OccupancyFetch } from "../lib/occupancy-client";
import { loadWorldChatHistory, publishWorldChat, reactWorldChat } from "../lib/occupancy-client";
import {
  WORLD_CHAT_COMPOSE_PLACEHOLDER,
  WORLD_CHAT_FLAP_WORDS,
  WORLD_CHAT_SELF_NAME,
  WORLD_CHAT_STREET_REQUEST_ID,
  appendWorldChatLine,
  buildWorldChatLink,
  canReplyToWorldChatDepth,
  createStreetPreviewLine,
  formatCompactCount,
  defaultInstalledContentPacks,
  insertChatGlyph,
  installChatContentPack,
  listeningNamesFromSnapshot,
  mergeWorldChatHistory,
  PLAZA_STICKER_PACK,
  reactToWorldChatLine,
  worldChatLinesFromHistory,
} from "../lib/play-preview";
import type { ChatContentPack, MessageReactionKind, WorldChatLine } from "../schemas/play-preview";
import { ActionButton } from "./action-button";

type WorldChatRoomProps = {
  nodeId?: string | undefined;
  snapshot?: unknown;
  occupancyOrigin?: string | undefined;
  sid?: string | undefined;
  fetchFn?: OccupancyFetch | undefined;
  liveLine?: WorldChatLine | null | undefined;
};

const ACTION_PATHS = {
  reply:
    "M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z",
  link: "M3.9 12a5 5 0 0 1 5-5h3v2h-3a3 3 0 1 0 0 6h3v2h-3a5 5 0 0 1-5-5zm7-1h2v2h-2v-2zm4-4h3a5 5 0 1 1 0 10h-3v-2h3a3 3 0 1 0 0-6h-3V7z",
  love: "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z",
  like: "M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z",
} as const;

const ActionGlyph = (options: { path: string }) => {
  return (
    <svg viewBox="0 0 24 24" className="play-chat-action-icon" aria-hidden="true">
      <path d={options.path} fill="currentColor" />
    </svg>
  );
};

const formatTapeTime = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

export const WorldChatRoom = (options: WorldChatRoomProps) => {
  const playerId = options.nodeId ?? WORLD_CHAT_SELF_NAME;
  const [draft, setDraft] = useState("");
  const [lines, setLines] = useState<readonly WorldChatLine[]>(() => [
    createStreetPreviewLine(),
  ]);
  const [replyTo, setReplyTo] = useState<WorldChatLine | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [packOpen, setPackOpen] = useState(false);
  const [installedPacks, setInstalledPacks] = useState<readonly ChatContentPack[]>(
    () => defaultInstalledContentPacks()
  );
  const listeners = listeningNamesFromSnapshot(options.snapshot);
  const citizenLines = lines.filter(
    (line) => line.requestId !== WORLD_CHAT_STREET_REQUEST_ID
  );
  const showStreetBoard = citizenLines.length === 0;
  const plazaInstalled = installedPacks.some((pack) => pack.id === PLAZA_STICKER_PACK.id);

  useEffect(() => {
    const sid = options.sid;
    const nodeId = options.nodeId;
    const origin = options.occupancyOrigin;
    if (sid === undefined || nodeId === undefined || origin === undefined) {
      return;
    }
    let cancelled = false;
    const load = async (): Promise<void> => {
      try {
        const history = await loadWorldChatHistory({
          origin,
          sid,
          fetchFn: options.fetchFn,
        });
        if (cancelled) {
          return;
        }
        const incoming = worldChatLinesFromHistory({
          messages: history.messages,
          viewerId: nodeId,
        });
        if (incoming.length === 0) {
          return;
        }
        setLines(incoming);
      } catch {
        return;
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [options.fetchFn, options.nodeId, options.occupancyOrigin, options.sid]);

  useEffect(() => {
    const liveLine = options.liveLine;
    if (liveLine === null || liveLine === undefined) {
      return;
    }
    setLines((current) =>
      mergeWorldChatHistory({
        lines: current,
        incoming: [liveLine],
      })
    );
  }, [options.liveLine]);

  const sendDraft = (): void => {
    const requestId =
      typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `local-${String(Date.now())}`;
    const nodeId = options.nodeId;
    const sid = options.sid;
    const origin = options.occupancyOrigin;
    setLines((current) =>
      appendWorldChatLine({
        lines: current,
        message: draft,
        requestId,
        fromSelf: true,
        ...(replyTo === null ? {} : { parent: replyTo }),
      })
    );
    if (
      sid !== undefined &&
      nodeId !== undefined &&
      origin !== undefined &&
      draft.trim().length > 0
    ) {
      void publishWorldChat({
        origin,
        sid,
        fetchFn: options.fetchFn,
        requestId,
        mainNodeId: nodeId,
        fromPlayerId: nodeId,
        message: draft.trim(),
        ...(replyTo === null ? {} : { parentRequestId: replyTo.requestId }),
      });
    }
    setDraft("");
    setReplyTo(null);
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    sendDraft();
  };

  const react = (requestId: string, kind: MessageReactionKind): void => {
    if (requestId === WORLD_CHAT_STREET_REQUEST_ID) {
      return;
    }
    setLines((current) => {
      const next = reactToWorldChatLine({
        lines: current,
        requestId,
        playerId,
        kind,
      });
      const line = next.find((item) => item.requestId === requestId);
      const sid = options.sid;
      const nodeId = options.nodeId;
      const origin = options.occupancyOrigin;
      if (line !== undefined && sid !== undefined && nodeId !== undefined && origin !== undefined) {
        const action = line.reactions[kind].includes(playerId) ? "set" : "cancel";
        void reactWorldChat({
          origin,
          sid,
          fetchFn: options.fetchFn,
          requestId,
          mainNodeId: nodeId,
          fromPlayerId: nodeId,
          kind,
          action,
        });
      }
      return next;
    });
  };

  const copyLink = (requestId: string): void => {
    const link = buildWorldChatLink({
      requestId,
      baseUrl: window.location.href,
    });
    void navigator.clipboard?.writeText(link).then(() => {
      setCopiedId(requestId);
    });
  };

  return (
    <div className="play-chat-booth">
      <div className="play-chat-grille" aria-hidden="true" />
      <div className="play-chat-title-row">
        <span className="play-chat-count" aria-label={`${formatCompactCount(lines.length)} world messages`}>
          {formatCompactCount(lines.length)}
        </span>
      </div>
      {showStreetBoard ? (
        <div className="play-chat-empty-board">
          <div className="play-chat-flaps" aria-hidden="true">
            {WORLD_CHAT_FLAP_WORDS.map((word) => (
              <span key={word} className="play-chat-flap">
                {word}
              </span>
            ))}
          </div>
          {listeners.length === 0 ? (
            <p className="play-chat-listen">Nobody on the tape yet.</p>
          ) : (
            <ul className="play-chat-listen-list" aria-label="Listening on the street">
              {listeners.map((name) => (
                <li key={name}>{name} is on the tape</li>
              ))}
            </ul>
          )}
        </div>
      ) : listeners.length === 0 ? null : (
        <ul className="play-chat-listen-list" aria-label="Listening on the street">
          {listeners.map((name) => (
            <li key={name}>{name} is on the tape</li>
          ))}
        </ul>
      )}
      <ol className="play-chat-tape" aria-label="World chat tape">
          {lines.map((line) => {
            const parent = lines.find((item) => item.requestId === line.parentRequestId);
            return (
              <li
                key={line.requestId}
                className={`play-chat-strip${line.fromSelf ? " is-self" : ""}${line.depth > 0 ? ` is-depth-${String(line.depth)}` : ""}`}
              >
                <span className="play-chat-strip-meta">
                  {line.senderName} · {formatTapeTime(line.ts)}
                </span>
                {parent !== undefined ? (
                  <span className="play-chat-reply-ref">
                    Replying to {parent.senderName}: {parent.message.slice(0, 64)}
                  </span>
                ) : null}
                <span className="play-chat-strip-body">{line.message}</span>
                <div className="play-chat-actions">
                  {canReplyToWorldChatDepth(line.depth) ? (
                    <button
                      type="button"
                      className="play-chat-action"
                      onClick={() => {
                        setReplyTo(line);
                      }}
                    >
                      <ActionGlyph path={ACTION_PATHS.reply} />
                      Reply
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="play-chat-action"
                    onClick={() => {
                      copyLink(line.requestId);
                    }}
                  >
                    <ActionGlyph path={ACTION_PATHS.link} />
                    {copiedId === line.requestId ? "Copied" : "Copy link"}
                  </button>
                  <button
                    type="button"
                    className="play-chat-action"
                    aria-pressed={line.reactions.love.includes(playerId)}
                    onClick={() => {
                      react(line.requestId, "love");
                    }}
                  >
                    <ActionGlyph path={ACTION_PATHS.love} />
                    Love
                    {line.reactions.love.length > 0
                      ? ` ${String(line.reactions.love.length)}`
                      : ""}
                  </button>
                  <button
                    type="button"
                    className="play-chat-action"
                    aria-pressed={line.reactions.thumbs_up.includes(playerId)}
                    onClick={() => {
                      react(line.requestId, "thumbs_up");
                    }}
                  >
                    <ActionGlyph path={ACTION_PATHS.like} />
                    Like
                    {line.reactions.thumbs_up.length > 0
                      ? ` ${String(line.reactions.thumbs_up.length)}`
                      : ""}
                  </button>
                </div>
              </li>
            );
          })}
        </ol>
      {replyTo !== null ? (
        <div className="play-chat-reply-chip">
          <span>Replying to {replyTo.senderName}: {replyTo.message.slice(0, 48)}</span>
          <button
            type="button"
            aria-label="Cancel reply"
            onClick={() => {
              setReplyTo(null);
            }}
          >
            ×
          </button>
        </div>
      ) : null}
      <form className="play-chat-compose-row" onSubmit={onSubmit}>
        <button
          type="button"
          className="play-chat-pack-toggle"
          aria-expanded={packOpen}
          aria-label="Content pack"
          onClick={() => {
            setPackOpen((open) => !open);
          }}
        >
          Pack
        </button>
        <input
          className="play-chat-compose"
          name="message"
          value={draft}
          placeholder={WORLD_CHAT_COMPOSE_PLACEHOLDER}
          aria-label={WORLD_CHAT_COMPOSE_PLACEHOLDER}
          onChange={(event) => {
            setDraft(event.target.value);
          }}
        />
        <ActionButton label="Send" onClick={sendDraft} />
      </form>
      {packOpen ? (
        <div className="play-chat-pack-drawer" aria-label="Installed content packs">
          {plazaInstalled ? null : (
            <button
              type="button"
              className="play-chat-pack-install"
              onClick={() => {
                setInstalledPacks((current) =>
                  installChatContentPack({
                    installed: current,
                    pack: PLAZA_STICKER_PACK,
                  })
                );
              }}
            >
              Install Plaza stickers
            </button>
          )}
          {installedPacks.flatMap((pack) =>
            pack.glyphs.map((glyph) => (
              <button
                key={`${pack.id}-${glyph}`}
                type="button"
                className="play-chat-pack-glyph"
                aria-label={`Insert ${glyph}`}
                onClick={() => {
                  setDraft((current) => insertChatGlyph({ draft: current, glyph }));
                }}
              >
                {glyph}
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
};
