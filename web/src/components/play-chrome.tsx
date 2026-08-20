import { useState, type PointerEvent as ReactPointerEvent } from "react";
import { PLAY_FOOTER_MENU, PLAY_TOUCH_KEYS } from "../lib/play-chrome";
import { resolveOccupancyOrigin } from "../lib/occupancy-origin";

type PlayChromeProps = {
  occupancyOrigin?: string | undefined;
  sid?: string | undefined;
  nodeId?: string | undefined;
  snapshot?: unknown;
};

const clampStick = (value: number, limit: number): number => {
  return Math.min(limit, Math.max(-limit, value));
};

export const PlayChrome = (options: PlayChromeProps = {}) => {
  const occupancyOrigin = options.occupancyOrigin ?? resolveOccupancyOrigin();
  const [debugOpen, setDebugOpen] = useState(false);
  const [stick, setStick] = useState({ x: 0, y: 0 });

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

  return (
    <div className="play-chrome">
      <section className="play-panel play-panel-messages" aria-label="Messages">
        <p className="play-panel-title">Messages</p>
        <p className="play-panel-body">No messages yet.</p>
      </section>
      <section className="play-panel play-panel-session" aria-label="Session">
        <p className="play-panel-title">Session</p>
        <p className="play-panel-body">
          {options.nodeId === undefined
            ? "World 2 play shell. The streets are empty."
            : `Citizen ${options.nodeId.slice(0, 8)}`}
        </p>
      </section>
      <div className="play-pad play-pad-center" role="group" aria-label="Play pad">
        <span className="play-pad-label">Play Pad</span>
        <div
          className="play-pad-base"
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            onPadPointer(event, true);
          }}
          onPointerMove={(event) => {
            if (event.currentTarget.hasPointerCapture(event.pointerId)) {
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
              transform: `translate(${stick.x}px, ${stick.y}px)`,
            }}
          />
        </div>
      </div>
      <div
        className="play-touch-pad play-touch-pad-cluster"
        role="group"
        aria-label="Touch pad"
      >
        {PLAY_TOUCH_KEYS.map((key) => (
          <button
            key={key.id}
            type="button"
            className={`play-touch-key play-touch-key-${key.id}`}
            aria-label={key.label}
          >
            <span className="play-touch-letter">{key.letter}</span>
            <span className="play-touch-label">{key.label}</span>
          </button>
        ))}
      </div>
      <div className="play-footer-menu" role="toolbar" aria-label="Play menu">
        {PLAY_FOOTER_MENU.map((item) => (
          <button
            key={item.id}
            type="button"
            className={
              debugOpen ? "play-footer-menu-btn is-active" : "play-footer-menu-btn"
            }
            aria-pressed={debugOpen}
            onClick={() => {
              setDebugOpen((open) => !open);
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
      {debugOpen ? (
        <aside className="play-debug-panel" role="complementary" aria-label="Debug panel">
          <p className="play-panel-title">Debug</p>
          <p>Occupancy {occupancyOrigin}</p>
          <p>Session {options.sid ?? "none"}</p>
          <p>Node {options.nodeId ?? "none"}</p>
          <pre className="play-debug-snapshot">
            {JSON.stringify(options.snapshot ?? {}, null, 2)}
          </pre>
        </aside>
      ) : null}
    </div>
  );
};
