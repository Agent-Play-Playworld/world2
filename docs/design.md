# World 2 design

Presentation rules for a Godot 4 3D view of the existing 2D occupancy plane. Coordinates and kinds come from the host snapshot. Height, camera, and meshes are client-only.

## 2D → 3D mapping

Agent Play world space is an axis-aligned rectangle in grid units (`WorldBounds`: `minX`, `minY`, `maxX`, `maxY`). Default seeded layout with parking lives in `@agent-play/sdk` `world-bounds.ts`:

- Column streets: Y 0–2, height 3 (`COLUMN_STREET_ROW_HEIGHT`)
- Gap: 2.5 rows
- Parking band: Y 6–9 (`PARKING_STREET_ROW_HEIGHT` 4)
- Default X: 0–19
- `DEFAULT_LAYOUT_BOUNDS_WITH_PARKING.maxY` is 9; play-ui also expands clamp/camera toward `MINIMUM_PLAY_WORLD_BOUNDS` (0–19, 0–19). World 2 must clamp locomotion to the **snapshot** `worldMap.bounds`, not a hardcoded rectangle.

Occupant positions are `x` and `y` in that plane. Godot 4 is Y-up.

| Snapshot | Godot 3D |
|----------|----------|
| `x` | `position.x` |
| `y` | `position.z` |
| (none) | `position.y` = 0 on the ground plane |

Call this mapping **`(x, y) → (X, 0, Z)`**. Inverse: world `x = X`, world `y = Z`.

Do not rotate the plane so that snapshot `y` becomes Godot `Y`. That would fight gravity and camera.

**Scale.** One world unit is one Godot unit in v1 (treat as 1 m later if art needs it). Changing scale is a client constant, never a server field.

**Occupancy keys.** Server allocation uses quantized keys (`occupancyKeyForPosition`: round to 0.2 via multiplier 5, format `x,y` with 3 decimal places). Two durable occupants must not share a key. Local human locomotion in play-ui is continuous inside bounds; World 2 may interpolate visually but must not invent a second occupancy grid.

**Layout zones** (from `snapshot.worldLayout` when present), not from tool names:

| Zone id | Typical street | Group |
|---------|----------------|-------|
| `zone-agent-strip` | St. John St. (`st-john`) | `agent` |
| `zone-space-strip` | Peterson St. (`peterson`) | `space` |
| `zone-arcade-strip` | Maple Ave. (`maple`) | `arcade` |
| `zone-parking-strip` | fourth street from the pool | `parking` |

Live labels and rects come from the snapshot. Seed pool also includes Oak Lane and others; do not freeze names in art.

## Occupant presentation

Kinds in Occupant Model v1 (plus legacy `mcp`):

| `kind` | Identity fields | 3D stand-in (v1) | Later art |
|--------|-----------------|------------------|-----------|
| `human` | `id`, `name`, `x`, `y` | Capsule | Walk cycle; humans visible to humans |
| `agent` | `agentId`, `name`, `x`, `y`, optional `nodeId` | Distinct capsule / marker | Stationary vendor figure |
| `structure` | `id`, `name`, `worldId`, `spaceIds` and/or `gameId` | Box | Space building vs Maple Ave cabinet |
| `mcp` | `id`, `name`, `x`, `y` | Box, distinct material | Legacy; new worlds seed arcade instead |

**Structure split:**

- `gameId` present → arcade cabinet door on Maple Ave. Entering is a game stage, not a space yard.
- `spaceIds` nonempty → authored space anchor. `A` (2D) / confirm (3D) enters the space yard. `primaryAmenity` / `amenities` are `shop` \| `supermarket` \| `car_wash`.

**Agents are stationary** at allocated cells. `world:journey` may carry a `path` of positioned steps for 2D preview animation. World 2 v1 may ignore journey paths or show a simple line; do not treat path playback as occupancy authority.

**Local viewer.** play-ui uses `__human__` as the proximity `fromPlayerId`. The wallet and intercom actor is the restored **main node id**. World 2 should keep that split: pawn id `__human__`, credentialed actor = `credentials.json` `nodeId`.

**Interaction policy (host-enforced, client-mirrored):**

- Humans see other humans.
- Text H2H chat / assist / proximity actions: **disallowed**.
- Human → agent assist / chat / zone / yield: **allowed** (`POST /proximity-action`).
- Human enters arcade cabinets: **allowed**.
- Peer voice: **opt-in** via `peerCallInvite` → Accept/Decline. Not `recordProximityAction`. Later phase.

Proximity radii in play-ui (reuse, do not invent):

- Agent partner: `0.72` world units (`DEFAULT_PROXIMITY_RADIUS`)
- Structure / cabinet: `2.4` (`DEFAULT_STRUCTURE_PROXIMITY_RADIUS`)
- Nearby **agent members beat cabinets** when both are in range.

`chat_tool` / `assist_*` on an agent row only drive whether the watch HUD shows Chat / Assist. They do not spawn structures.

## Stage / scene model

play-ui `StageId` values to preserve:

- `overworld`
- `spaceYard`
- `amenityShop`, `amenitySupermarket`, `amenityCarWash`
- Arcade: `gameHiddenGems`, `gameMapRecall`, `gamePriceCheck`, `gameSignalHunt`, `gameDeliveryDash`, `gameLeaseLocker`, `gameTalkTimer`
- `houseInterior`

2D uses a Pixi stage stack with ease-out / ease-in. 3D uses **Godot scenes** (or additive rooms) with a camera + collision volumes. Stage is client presentation. Host RPCs that exist today:

- `enterSpace` — `{ playerId, structureId, spaceId? }` → transition payload; analytics + world transition event
- `enterAmenity` — `{ playerId, spaceId, amenityKind }` — **audit log only**; persistence is the snapshot / amenity content

Esc / exit door in 2D returns to the previous stage. World 2 should do the same.

**Arcade scoring.** Do not invent a Featured-cabinet +10% Power-Up bonus. Featured (`daily-rotator`) routes to the UTC weekday title; `applyGameOutcome` scores via server `computeEventPuDelta`. Daily arcade cap is 100 APU UTC; 5-day streak is +5 APU. World 2 must POST the same event list the 2D client would, not a local score.

**World 2 v1 ships overworld stand-ins only.** Space yards, amenities, cabinets, and house interiors are later stages, still the same snapshot.

## Input

| Context | 2D play-ui | World 2 desktop |
|---------|------------|-----------------|
| Locomotion | Joystick + arrow keys; pose saved in localStorage per `sid` | WASD + arrows; clamp with `clampWorldPosition`; optional local save |
| Play Pad | **Shift+Ctrl** + `N` attach; `K`/`L`/`I`/`M` cardinals; two-letter diagonals (`MK`, `IL`, …) within 220 ms. Bare N/K/L/I/M do not move. | Same chord table when Play Pad HUD exists. Native app is not fighting browser `Ctrl+Shift+N`. Still require the chord so muscle memory matches. |
| Enter space | `A` near structure | Confirm / `A` |
| Enter amenity from yard | `P` on amenity pad | Confirm / `P` |
| Assist / Chat / Zone / Yield | `A` `C` `Z` `Y` near **agent** | Same keys later; members beat objects |
| Push-to-talk | `P` near agent | Later |
| Back | `Esc` | `Esc` |

Phase 1 only needs locomotion + camera. Do not bind proximity mutations until the protocol client can POST them behind tests.

## Camera

v1: **third-person follow** of the local human pawn, looking at the ground plane, orthographic or mild perspective. Keep the three street columns and parking band readable from above-behind.

Do not use Godot multiplayer cameras or `MultiplayerSynchronizer`. Other humans (when present in `occupants` or, later, geography) are snapshot/mesh data, not Godot peers.

## HUD

v1:

- Connection: origin, `sid` prefix only, snapshot `rev` if present
- Occupant counts by kind
- Error line (see failure modes)
- Optional occupant name labels in world space

Later: wallet APW$ / APU, proximity prompt, Play Pad, arcade result, peer-call Accept/Decline.

AQL does not appear in this HUD.

## Failure modes

### Wrong origin

`credentials.json` has `serverUrl`. Restore must compare a canonical host:

- `world1.v0peer.org` is Main World
- `agent-play.com`, `www.agent-play.com`, `playworld.world` **are the same deployment** (legacy names)

If the file is for some other host, refuse restore and show both URLs. Do not silently POST hashed credentials at the wrong origin.

Default World 2 origin is `https://world1.v0peer.org`. Override is an explicit settings value, not inferred from a random last-used URL.

### Lost credentials

- View-only: session + snapshot + SSE still work (play-ui watch path does not require node headers for those reads).
- Mutations that need a main node (`purchase`, `getPlayerWallet` as that player, talk, house/parking buys) fail until `credentials.json` is loaded.
- Passphrase is 10 words. World 2 hashes locally; the server compares `x-node-passw` as already-hashed material and does not re-hash the header.
- Losing the phrase means losing that node. HUD copy should say that without offering a recovery backdoor.

### SSE drop

- Comment pings every 30s; treat silence well beyond that as dead.
- On drop: close the stream, backoff reconnect to `GET /events?sid=`, then **full `getWorldSnapshot`** before trusting incremental notify again.
- If `sid` is rejected (403), re-fetch `GET /session` and replace local sid (Main World sid can be reconciled the same way play-ui `ensurePreviewSessionId` does).
- Parse failure of an event `data` line: refetch snapshot (play-ui already does this).

### Snapshot / merge failure

- `getWorldSnapshot` wrapper missing `snapshot`, or `worldMap.occupants` not an array: keep last good model, show error, retry.
- `getPlayerChainNode` unknown `stableKey` or merge throw: abort incremental path, full snapshot.
- Duplicate occupant coordinates in a payload: treat as invalid snapshot (SDK parser rejects them).

### Identity mismatch

`POST /api/nodes/validate` with `x-node-id` / `x-node-passw`. Body `nodeId` must match the header. Wrong kind (agent node used as main) is a 403-class failure on privileged routes. Show “this file is not a main node” rather than retry loops.
