# World 2 design

Presentation rules for a **browser 3D** view of the existing 2D occupancy plane. Coordinates and kinds come from the host snapshot on **`https://agent-play.com`**. Height, camera, meshes, and atmosphere are client-only.

Three.js is **Y-up**. Mapping is `(x, y) → (X, 0, Z)`. v1 uses that mapping in the Three.js WebGL scene (ADR-008). If ADR-011 (parked Godot) is ever activated, it would reuse the same mapping; it is not a v1 engine choice.

Kit GLBs, png2glb, parking/house instance rules, and the player install pack are in [presentation-kit.md](presentation-kit.md). This page is mapping, overworld art direction, chrome, camera, HUD, and failure modes.

## 2D → 3D mapping

Agent Play world space is an axis-aligned rectangle in grid units (`WorldBounds`: `minX`, `minY`, `maxX`, `maxY`). Default seeded layout with parking lives in `@agent-play/sdk` `world-bounds.ts`:

- Column streets: Y 0–2, height 3 (`COLUMN_STREET_ROW_HEIGHT`)
- Gap: 2.5 rows
- Parking band: Y 6–9 (`PARKING_STREET_ROW_HEIGHT` 4)
- Default X: 0–19
- `DEFAULT_LAYOUT_BOUNDS_WITH_PARKING.maxY` is 9; play-ui also expands clamp/camera toward `MINIMUM_PLAY_WORLD_BOUNDS` (0–19, 0–19). World 2 must clamp locomotion to the **snapshot** `worldMap.bounds`, not a hardcoded rectangle.

Occupant positions are `x` and `y` in that plane.

| Snapshot | 3D scene (Y-up) |
|----------|-----------------|
| `x` | `position.x` |
| `y` | `position.z` |
| (none) | `position.y` = 0 on the ground plane |

Call this mapping **`(x, y) → (X, 0, Z)`**. Inverse: world `x = X`, world `y = Z`.

Do not rotate the plane so that snapshot `y` becomes scene `Y`. That would fight gravity and camera.

**Scale.** One world unit is one scene unit in v1 (treat as 1 m later if art needs it). Changing scale is a client constant, never a server field.

**Occupancy keys.** Server allocation uses quantized keys (`occupancyKeyForPosition`: round to 0.2 via multiplier 5, format `x,y` with 3 decimal places). Two durable occupants must not share a key. Local human locomotion in play-ui is continuous inside bounds; World 2 may interpolate visually but must not invent a second occupancy grid. Camera lerp (distance, height, FOV) is presentation only; it does not create a second grid.

**Layout zones** (from `snapshot.worldLayout` when present), not from tool names:

| Zone id | Typical street | Group |
|---------|----------------|-------|
| `zone-agent-strip` | St. John St. (`st-john`) | `agent` |
| `zone-space-strip` | Peterson St. (`peterson`) | `space` |
| `zone-arcade-strip` | Maple Ave. (`maple`) | `arcade` |
| `zone-parking-strip` | fourth street from the pool | `parking` |

Live labels and rects come from the snapshot. Seed pool also includes Oak Lane and others; do not freeze names in art. Streets are **first-class presentation**: column streets + gap + parking band, labeled from live `worldLayout`. They are not leftover ground between buildings. See [presentation-kit.md](presentation-kit.md).

## Occupant presentation

Kinds in Occupant Model v1 (plus legacy `mcp`):

| `kind` | Identity fields | 3D stand-in (v1) | Kit / later art |
|--------|-----------------|------------------|-----------------|
| `human` | `id`, `name`, `x`, `y` | Capsule | Walk cycle; humans visible to humans |
| `agent` | `agentId`, `name`, `x`, `y`, optional `nodeId` | Distinct capsule / marker | **Robotic** figure standing in a **stall** on the agent strip |
| `structure` | `id`, `name`, `worldId`, `spaceIds` and/or `gameId` | Box | Space **mall** vs arcade **game-center terminal** |
| `mcp` | `id`, `name`, `x`, `y` | Box, distinct material | Legacy; new worlds seed arcade instead |

**Structure split:**

- `gameId` present → arcade **terminal** on Maple Ave (game center). Entering is a game stage, not a space yard.
- `spaceIds` nonempty → authored space anchor. Presented as a **mall**: walk through a **gate** with a mall **signpost**; `A` enters; interior is the yard. `primaryAmenity` / `amenities` are `shop` \| `supermarket` \| `car_wash` only. Amenity pads sit in the yard; `P` on a pad enters that amenity.

**Agents are robotic and stationary** at allocated cells on the agent strip (St. John / `zone-agent-strip`). Each agent stands in a stall. `world:journey` may carry a `path` of positioned steps for 2D preview animation. World 2 v1 may ignore journey paths or show a simple line; do not treat path playback as occupancy authority. `chat_tool` / `assist_*` on an agent row only drive whether the watch HUD shows Chat / Assist. They do **not** spawn buildings or stalls.

**Arcade** is a **game center** with one **terminal** per `gameId`. The pawn walks to the terminal; `A` plays. Host scoring is `computeEventPuDelta` inside `applyGameOutcome`. There is no featured-cabinet +10% PU.

**Cars and houses** come from `snapshot.parkingStreet` and `snapshot.houseStreet`, not from `worldMap.occupants`. Keep both. Rules are in [presentation-kit.md](presentation-kit.md).

**Local viewer.** play-ui uses `__human__` as the proximity `fromPlayerId`. The wallet and intercom actor is the restored **main node id**. World 2 should keep that split: pawn id `__human__`, credentialed actor = `credentials.json` `nodeId` (Phase 2+).

**Public URL.** `https://world2.v0peer.org` is **view-only by default**: session, snapshot, SSE, local walk. Credentials are not required to see the live map.

**Interaction policy (host-enforced, client-mirrored):**

- Humans see other humans.
- Text H2H chat / assist / proximity actions: **disallowed**.
- Human → agent assist / chat / zone / yield: **allowed** (`POST /proximity-action`) once identity exists.
- Human enters arcade terminals: **allowed** (later stages).
- Peer voice: **opt-in** via `peerCallInvite` → Accept/Decline. Not `recordProximityAction`. Later phase.

Proximity radii in play-ui (reuse, do not invent):

- Agent partner: `0.72` world units (`DEFAULT_PROXIMITY_RADIUS`)
- Structure / cabinet / mall gate: `2.4` (`DEFAULT_STRUCTURE_PROXIMITY_RADIUS`)
- Parking bay: `2.4` (`findNearestParkingBay` default)
- House door: `2.0` (`HOUSE_DOOR_PROXIMITY_RADIUS`)
- Nearby **agent members beat objects** (cabinets, malls, parking, houses) when both are in range.

`chat_tool` / `assist_*` on an agent row only drive whether the watch HUD shows Chat / Assist. They do not spawn structures.

## Overworld art direction

The overworld is the live map, not a diorama. Occupancy JSON decides what exists. Kit GLBs dress it.

**Agent strip (St. John / `zone-agent-strip`).** Agents are **robotic**. Each stands in a **stall**. They do not walk the street as NPCs. Stalls are kit instances at agent occupant poses. Tool names do not add extra architecture.

**Space strip (Peterson / `zone-space-strip`).** Spaces are **malls**. Presentation sequence:

1. Exterior mall massing with a **gate** and a **signpost** (live space name from the snapshot / catalog).
2. Pawn walks to the gate. `A` enters (`enterSpace`).
3. Interior is the existing **space yard** stage, not a second occupancy server.
4. Amenity **pads** in the yard: `shop` | `supermarket` | `car_wash` only. `P` on a pad enters that amenity (`enterAmenity`, audit on the host).

**Arcade strip (Maple Ave / `zone-arcade-strip`).** A **game center**. One **terminal** per `gameId` occupant. Pawn walks to the terminal. `A` starts play. Scoring stays on the host (`computeEventPuDelta`). Featured (`daily-rotator`) routes to the UTC weekday title; it is not a +10% PU bonus.

**Streets.** Column streets + gap + parking band are first-class meshes or tiled ground with live `worldLayout` labels. Do not leave unlabeled leftover ground between strips.

**Parking.** Keep the existing 4 bays × 2 layers = 8 spots and `PARKING_BAY_ANCHORS`. Empty stall always. Car GLB only when that parkingStreet occupant is active (tint `colorHex`, model variant). See [presentation-kit.md](presentation-kit.md).

**Houses.** Keep four house GLBs at `HOUSE_WORLD_X` `[3, 8, 13, 18]`. Vacant vs owned is sign/material, not despawn. `A` enter if owner; `P` inspect. Interior is still the `houseInterior` stage.

**Look.** After meshes load, apply a toon/cel pass (materials, fog, camera) so the frame can read Ghibli-like. That pass is presentation, not a reason to bake occupancy into a GLB.

World 2 v1 ships overworld stand-ins first. Kit meshes and the look pass can land on those stand-ins without waiting for mall/arcade interiors.

## Stage / scene model

play-ui `StageId` values to preserve:

- `overworld`
- `spaceYard`
- `amenityShop`, `amenitySupermarket`, `amenityCarWash`
- Arcade: `gameHiddenGems`, `gameMapRecall`, `gamePriceCheck`, `gameSignalHunt`, `gameDeliveryDash`, `gameLeaseLocker`, `gameTalkTimer`
- `houseInterior`

2D uses a Pixi stage stack with ease-out / ease-in. 3D uses **scenes** (or additive rooms) with a camera + collision volumes. Stage is client presentation. Host RPCs that exist today:

- `enterSpace` — `{ playerId, structureId, spaceId? }` → transition payload; analytics + world transition event
- `enterAmenity` — `{ playerId, spaceId, amenityKind }` — **audit log only**; persistence is the snapshot / amenity content

Esc / exit door in 2D returns to the previous stage. World 2 should do the same.

**Arcade scoring.** Do not invent a Featured-cabinet +10% Power-Up bonus. Featured (`daily-rotator`) routes to the UTC weekday title; `applyGameOutcome` scores via server `computeEventPuDelta`. Daily arcade cap is 100 APU UTC; 5-day streak is +5 APU. World 2 must POST the same event list the 2D client would, not a local score.

**World 2 v1 ships overworld stand-ins only.** Space yards, amenities, terminals, and house interiors are later stages, still the same snapshot.

## Chrome: same play-ui shell, 3D world view in the canvas

World 2 reuses the **play-ui interaction shell**. The world view inside the canvas is 3D. Pads, panels, and prompts stay **DOM**, stacked over the WebGL canvas so pointer events hit chrome first.

Keep:

- **Play Pad** — `Shift+Ctrl` + `N` attach; `K` / `L` / `I` / `M` cardinals; two-letter diagonals (`MK`, `IL`, …) within 220 ms. Bare N/K/L/I/M do not move.
- **Proximity touch bar** — `A` / `C` / `P` with the same meaning as play-ui.
- **Session interaction panels** — assist, chat, push-to-talk. Same host routes.

Key mapping near an agent (Phase 2+ mutations; Phase 1 may show the bar as view-only):

| Key | Meaning |
|-----|---------|
| `P` | Push-to-talk |
| `C` | Chat |
| `A` | Assist |
| `Z` | **Zone** (not zoom) |
| `Y` | Yield |

**Members beat objects.** If an agent and a mall / terminal / parking stall / house door are both in range, A/C/P target the agent.

Pointer events: Play Pad, proximity bar, and session panels remain HTML over the canvas. Do not rely on WebGL picking for those controls in v1.

## Input

Browser client. Keyboard focus is the 3D canvas at `/` on `world2.v0peer.org`. WASD remains the locomotion default (same as the superseded desktop plan).

| Context | 2D play-ui | World 2 browser |
|---------|------------|-----------------|
| Locomotion | Joystick + arrow keys; pose saved in localStorage per `sid` | WASD + arrows while the canvas is focused; clamp with `clampWorldPosition`; optional localStorage save |
| Play Pad | **Shift+Ctrl** + `N` attach; `K`/`L`/`I`/`M` cardinals; two-letter diagonals (`MK`, `IL`, …) within 220 ms. Bare N/K/L/I/M do not move. | Same chord table. Some browsers intercept `Ctrl+Shift+N` (new window / incognito). Document that; do not invent a different chord for v1. |
| Pointer lock | Not used | **Not in Phase 1.** Camera follows the pawn. Click-to-focus the canvas is enough. Optional later for mouse-look. |
| Enter space / mall | `A` near structure | Confirm / `A` (later) |
| Enter amenity from yard | `P` on amenity pad | Confirm / `P` (later) |
| Assist / Chat / Zone / Yield | `A` `C` `Z` `Y` near **agent** | Same keys later; members beat objects |
| Push-to-talk | `P` near agent | Later |
| Back | `Esc` | `Esc` (also exits pointer lock if that ships later) |

Phase 1 only needs locomotion + camera. Play Pad **logic** may exist in `protocol/` tests in Phase 0; the HUD can wait. Do not bind proximity mutations until the protocol client can POST them behind tests.

Do not steal scrolling or browser chrome: listen for keys on the canvas (or a dedicated game layer), not `window` for every key.

## Camera

v1: **third-person follow** of the local human pawn, looking at the ground plane (XZ). Keep the three street columns and parking band readable from above-behind.

No pointer lock in Phase 1. Do not use a multiplayer camera rig or peer-synced transforms. Other humans (when present in `occupants` or, later, geography) are snapshot/mesh data, not engine peers.

**Soft proximity zoom** (lerp; presentation only):

- When the pawn is inside a proximity radius **or** an action panel is open, lerp the camera **in**:
  - agent radius `0.72`
  - structure / mall gate / terminal radius `2.4`
  - parking bay radius `2.4`
  - house door radius `2.0`
- When out of proximity and no action panel is open, lerp **out** to a wider street lens.
- Lerp **distance, height, and FOV**. Do not snap. Do not invent a second occupancy grid to drive the camera.
- Keyboard **Z remains zone**, not zoom. Do not bind zoom to Z.

Phase 1 can lerp this camera on stand-in capsules. Kit art is not required for the zoom behavior.

Pointer-lock first-person is out of Phase 1.

## HUD

v1:

- Connection: **page origin** (`world2.v0peer.org`) vs **server origin** (`agent-play.com`), `sid` prefix only, snapshot `rev` if present
- Occupant counts by kind
- Mode: view-only
- Error line (see failure modes), including CORS failures
- Optional occupant name labels in world space

Later: wallet APW$ / APU, proximity prompt, Play Pad, arcade result, peer-call Accept/Decline, credentials restore.

AQL does not appear in this HUD.

## Failure modes

### Wrong origin

API origin is **not** the page origin. Default API host is **`https://agent-play.com`**. `credentials.json` (Phase 2+) has `serverUrl`. Restore must compare a canonical host:

- `agent-play.com` is Main World occupancy (canonical)
- `www.agent-play.com`, `playworld.world` **are the same deployment**
- `world1.v0peer.org` is the same deployment **while it exists**; treat as an alias of `agent-play.com`; it may be discontinued
- `world2.v0peer.org` and `worldN.v0peer.org` are **3D pages**, never the occupancy API, never valid `serverUrl`

If the file is for some other host, refuse restore and show both URLs. Do not silently POST hashed credentials at the wrong origin. Do not send occupancy RPC to `world2.v0peer.org`.

Today play-ui restore still maps aliases **to** `world1.v0peer.org`. Intended policy maps them **to** `agent-play.com`. World 2 implements intended policy. See ADR-012.

Override is an explicit settings / env value (`VITE_WORLD2_API_BASE`), not inferred from `window.location`.

### CORS / blocked cross-origin

If session, RPC, or EventSource fails because `agent-play.com` lacks `Access-Control-Allow-Origin` for `https://world2.v0peer.org`, show a concrete HUD error: 3D page origin vs server origin, not a generic “offline”. See [architecture.md](architecture.md) and [world-protocol.md](world-protocol.md).

### Lost credentials

- View-only: session + snapshot + SSE still work (play-ui watch path does not require node headers for those reads). This is the **default** for the public URL.
- Mutations that need a main node (`purchase`, `getPlayerWallet` as that player, talk, house/parking buys) fail until credentials are loaded (Phase 2+).
- Browser restore is a file picker / stored JSON, not a desktop path to `~/.agent-play/credentials.json`.
- Passphrase is 10 words. World 2 hashes locally; the server compares `x-node-passw` as already-hashed material and does not re-hash the header.
- Losing the phrase means losing that node. HUD copy should say that without offering a recovery backdoor.

### SSE drop

- Comment pings every 30s; treat silence well beyond that as dead.
- On drop: close the stream, backoff reconnect to `GET /events?sid=`, then **full `getWorldSnapshot`** before trusting incremental notify again.
- If `sid` is rejected (403), re-fetch `GET /session` and replace local sid (Main World sid can be reconciled the same way play-ui `ensurePreviewSessionId` does).
- Parse failure of an event `data` line: refetch snapshot (play-ui already does this).
- Native `EventSource` reconnection is browser-dependent (`../agent-play/docs/third-party-and-sharp-edges.md`). World 2 should still do an explicit snapshot refetch after reconnect, not rely on the browser alone.

### Snapshot / merge failure

- `getWorldSnapshot` wrapper missing `snapshot`, or `worldMap.occupants` not an array: keep last good model, show error, retry.
- `getPlayerChainNode` unknown `stableKey` or merge throw: abort incremental path, full snapshot.
- Duplicate occupant coordinates in a payload: treat as invalid snapshot (SDK parser rejects them).

### Identity mismatch

`POST /api/nodes/validate` with `x-node-id` / `x-node-passw`. Body `nodeId` must match the header. Wrong kind (agent node used as main) is a 403-class failure on privileged routes. Show “this file is not a main node” rather than retry loops. Not Phase 1.
