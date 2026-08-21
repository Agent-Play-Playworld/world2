import { useState } from "react";
import {
  DEBUG_SETTING_TABS,
  debugRadarScopeClass,
  formatDebugSwitch,
  formatGeographyMembers,
  loadPlayDebugSettings,
  savePlayDebugSettings,
  setPlayDebugSetting,
} from "../lib/play-preview";
import type {
  DebugSettingTab,
  PlayDebugPreview,
  PlayDebugSettings,
} from "../schemas/play-preview";

type DebugRadarProps = {
  occupancyOrigin: string;
  sid?: string | undefined;
  nodeId?: string | undefined;
  preview: PlayDebugPreview;
};

const radarPercent = (value: number): number => {
  return Math.min(92, Math.max(8, (value / 20) * 100));
};

const SettingSwitch = (options: {
  label: string;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}) => {
  return (
    <div className="play-debug-switch-row">
      <span>{options.label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={options.enabled}
        aria-label={options.label}
        className={
          options.enabled ? "play-debug-switch is-on" : "play-debug-switch"
        }
        onClick={() => {
          options.onToggle(!options.enabled);
        }}
      >
        <span className="play-debug-switch-knob" aria-hidden="true" />
        {formatDebugSwitch(options.enabled)}
      </button>
    </div>
  );
};

export const DebugRadar = (options: DebugRadarProps) => {
  const [tab, setTab] = useState<DebugSettingTab>("world");
  const [settings, setSettings] = useState<PlayDebugSettings>(() =>
    loadPlayDebugSettings(
      options.nodeId === undefined ? {} : { nodeId: options.nodeId }
    )
  );

  const setFlag = (key: keyof PlayDebugSettings, enabled: boolean): void => {
    setSettings((current) => {
      const next = setPlayDebugSetting({ settings: current, key, enabled });
      savePlayDebugSettings({
        settings: next,
        ...(options.nodeId === undefined ? {} : { nodeId: options.nodeId }),
      });
      return next;
    });
  };

  return (
    <div className="play-debug-radar play-debug-cabinet">
      <p className="play-debug-kicker">Paused · Options</p>
      <div className="play-debug-tabs" role="tablist" aria-label="Debug settings">
        {DEBUG_SETTING_TABS.map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            className={tab === id ? "play-debug-tab is-active" : "play-debug-tab"}
            onClick={() => {
              setTab(id);
            }}
          >
            {id}
          </button>
        ))}
      </div>
      {tab === "world" ? (
        <div className="play-debug-tabpanel" role="tabpanel" aria-label="World">
          <div className={debugRadarScopeClass(settings)} aria-hidden="true">
            <span className="play-radar-sweep" />
            <span className="play-radar-zones" />
            <span className="play-radar-grids" />
            {options.preview.agents.map((agent) => (
              <span
                key={agent.playerId}
                className="play-radar-blip play-radar-blip-agent"
                style={{
                  left: `${String(radarPercent(agent.worldX))}%`,
                  top: `${String(radarPercent(agent.worldY))}%`,
                }}
                title={agent.name}
              />
            ))}
            {options.preview.structures.map((structure) => (
              <span
                key={structure.id}
                className="play-radar-blip play-radar-blip-structure"
                style={{
                  left: `${String(radarPercent(structure.x))}%`,
                  top: `${String(radarPercent(structure.y))}%`,
                }}
                title={structure.id}
              />
            ))}
          </div>
          <p className="play-debug-heading">World geography</p>
          <SettingSwitch
            label="Enable world geography: view other players in your world"
            enabled={settings.worldGeographyEnabled}
            onToggle={(enabled) => {
              setFlag("worldGeographyEnabled", enabled);
            }}
          />
          {settings.worldGeographyEnabled ? (
            <p className="play-geography-members">
              {formatGeographyMembers(options.preview.memberCount)}
            </p>
          ) : null}
          <p className="play-debug-heading">Zones (street-named)</p>
          <SettingSwitch
            label="Show world layout zones (agent strip · space strip · MCP strip)"
            enabled={settings.showLayoutZones}
            onToggle={(enabled) => {
              setFlag("showLayoutZones", enabled);
            }}
          />
          <SettingSwitch
            label="Show free grids (green agent zone · cyan space zone)"
            enabled={settings.showFreeGrids}
            onToggle={(enabled) => {
              setFlag("showFreeGrids", enabled);
            }}
          />
        </div>
      ) : null}
      {tab === "roster" ? (
        <div className="play-debug-tabpanel" role="tabpanel" aria-label="Roster">
          <p className="play-debug-heading">Agents</p>
          {options.preview.agents.length === 0 ? (
            <p className="play-session-hint">No agents in this snapshot.</p>
          ) : (
            <ul className="play-debug-roster">
              {options.preview.agents.map((agent) => (
                <li key={agent.playerId} className="play-debug-card">
                  <span className="play-debug-card-mark" aria-hidden="true" />
                  <strong>{agent.name}</strong>
                  <span>{agent.playerId}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="play-debug-heading">Structures</p>
          {options.preview.structures.length === 0 ? (
            <p className="play-session-hint">No structures in this snapshot.</p>
          ) : (
            <ul className="play-debug-roster">
              {options.preview.structures.map((structure) => (
                <li key={structure.id} className="play-debug-card is-structure">
                  <span className="play-debug-card-mark" aria-hidden="true" />
                  <strong>{structure.kind}</strong>
                  <span>{structure.id}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
      {tab === "system" ? (
        <div className="play-debug-tabpanel" role="tabpanel" aria-label="System">
          <p className="play-debug-bios">Occupancy {options.occupancyOrigin}</p>
          <p className="play-debug-bios">Session {options.sid ?? "none"}</p>
          <p className="play-debug-bios">
            Party {String(options.preview.agents.length)} · Lots{" "}
            {String(options.preview.structures.length)}
          </p>
        </div>
      ) : null}
      <p className="play-debug-ticker" aria-label="Live roster">
        {options.preview.agents.length === 0 ? (
          "No agents in this snapshot."
        ) : (
          options.preview.agents.map((agent) => (
            <span key={agent.playerId}>
              <strong>{agent.name}</strong> <span>{agent.playerId}</span>
            </span>
          ))
        )}
      </p>
      <p className="play-session-hint">Occupancy {options.occupancyOrigin}</p>
      <p className="play-session-hint">Session {options.sid ?? "none"}</p>
    </div>
  );
};
