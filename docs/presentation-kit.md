# World 2 presentation kit

GLB usage, png2glb, streets, parking, houses, and player install. Occupancy remains on **`https://agent-play.com`**. This page is costumes and tiles, not a second world.

Read with [design.md](design.md) (art direction, mapping) and [architecture.md](architecture.md) (load sequence).

## Three layers

| Layer | Owner | Player gets |
|-------|-------|-------------|
| **Occupancy** | `agent-play.com` snapshot + SSE + RPC | Who is on the map, stall/mall/terminal poses, parking tickets, house ownership, wallets, A/C/P |
| **Kit GLBs** | Versioned presentation pack compiled by png2glb (or artist drop-in) | Prefab meshes instanced at occupancy coordinates |
| **Atmosphere** | World 2 renderer after load | Toon/cel materials, fog, camera so the frame can read Ghibli-like |

Occupancy JSON is truth. GLB is a **prefab costume/tile**. Atmosphere is a **look pass**, not a file-format choice.

The occupant renderer **must not** bake Maple Ave (or any strip) as a static GLTF that ignores `worldMap.occupants`. If a cabinet leaves the snapshot, its terminal mesh must go. If an agent joins, a robot+stall instance appears at `(x, y) → (X, 0, Z)`.

## GLB is kit, not a baked city

Do not ship a single `town.glb` whose children are Maple Ave, St. John, and every shop. That file cannot track live occupants, `worldLayout` label changes, parking tickets, or house sales.

Correct use:

1. Load the snapshot from `agent-play.com`.
2. Parse bounds, occupants, `worldLayout`, `parkingStreet`, `houseStreet`.
3. Instance kit keys at those coordinates (or Phase 1 stand-ins).
4. Run the look pass.

png2glb does not replace step 1–3. It only produces the meshes for step 3.

## png2glb is a kit compiler

png2glb turns reference images (robot, stall, mall gate, terminal, street tile, parking stall, car, house facades) into GLB files that match a **pack contract**. It is not the world, not occupancy, and not a reason to delay Phase 0 protocol tests.

Outputs a **versioned pack**:

```text
pack/
  manifest.json
  robot.glb
  stall.glb
  mall-gate.glb
  terminal.glb
  street-tile.glb
  parking-stall.glb
  car.glb
  house-1.glb
  house-2.glb
  house-3.glb
  house-4.glb
```

`manifest.json` names pack version, key → file, units (1 world unit = 1 scene unit in v1), and optional tint/socket metadata. The engine consumes keys, not filenames invented per world.

Players **install or cache** the pack on the World 2 origin (or a CDN behind it). They still **interact** via live occupancy on `agent-play.com`. A cached pack with a dead occupancy host is a costume rack with no play.

Untrusted player PNG uploads are **out of scope** unless an explicit sandbox lands later. Operator/artist refs in `kit/` are the v1 path.

### Compiler tiers

The engine contract is the same at every tier. Changing tier must not change occupancy code.

| Tier | How the GLB is made | When |
|------|---------------------|------|
| 0 | Textured card / billboard | Phase 1 stand-ins if no pack yet |
| 1 | Silhouette extrude from PNG | Cheap kit while art is unfinished |
| 2 | External image-to-3D API | Optional production of pack files |
| 3 | Artist drop-in GLB that still matches the key contract | Preferred once art exists |

Do **not** block Phase 0 protocol tests on png2glb. Protocol parses JSON. The canvas can spawn capsules until a pack exists. Phase 1 can lerp camera on stand-ins.

Suggested repo layout (names only):

```text
world2/
  protocol/
  kit/                 # compiler + refs + emitted pack
  web/                 # Vite app loads pack + occupancy
```

## Streets

Streets are first-class kit, not leftover ground.

Seeded layout (from `@agent-play/sdk` `world-bounds.ts`):

- Column streets: Y 0–2, height 3
- Gap: 2.5 rows
- Parking band: Y 6–9, height 4
- Default X: 0–19

Instance `street-tile` (or equivalent) across those rects. Draw **live** `worldLayout` labels (St. John, Peterson, Maple Ave, parking street, whatever the snapshot currently names). Seed pool also includes Oak Lane and others; do not freeze street names in the GLB.

The gap between column streets and the parking band is part of the layout, not empty engine default ground.

## Parking (keep)

Parking is `snapshot.parkingStreet`, **not** `worldMap.occupants`.

Keep the existing 8 spots: **4 bays × 2 layers**. Reuse `PARKING_BAY_ANCHORS` from play-ui:

| bay | layer | x | y |
|-----|-------|---|---|
| 1 | 1 | 3.5 | 7.2 |
| 1 | 2 | 3.5 | 6.6 |
| 2 | 1 | 8.5 | 7.2 |
| 2 | 2 | 8.5 | 6.6 |
| 3 | 1 | 13.5 | 7.2 |
| 3 | 2 | 13.5 | 6.6 |
| 4 | 1 | 18.5 | 7.2 |
| 4 | 2 | 18.5 | 6.6 |

Rules:

- Always show the **parking-stall** kit at every anchor (empty bay is visible).
- Instance a **car** GLB only when that spot’s parkingStreet occupant is **active**.
- Tint the car with occupancy `colorHex`.
- Select mesh variant from the occupancy model field when present.
- Proximity radius matches play-ui (`2.4` default on `findNearestParkingBay`).

Do not bake eight cars into a parking-lot GLB. Tickets expire; the stall stays, the car goes.

## Houses (keep)

Houses are `snapshot.houseStreet`, **not** `worldMap.occupants`.

Keep four houses at `HOUSE_WORLD_X` **`[3, 8, 13, 18]`** (kit keys `house-1` … `house-4`).

Rules:

- Always instance the house GLB. Vacant vs owned is **sign / material**, not despawn.
- Owner may `A` enter. Others `P` inspect.
- Interior is still the `houseInterior` stage (later than Phase 1 overworld).
- Door proximity radius matches play-ui (`HOUSE_DOOR_PROXIMITY_RADIUS` = 2.0).

Do not hide a sold house or spawn houses from `worldMap.occupants`.

## Agents, malls, terminals (kit keys)

These **are** driven by `worldMap.occupants` plus catalog metadata:

| Occupant | Kit keys | Notes |
|----------|----------|-------|
| `kind: "agent"` on agent strip | `robot` + `stall` | Stationary. No building spawn from `chat_tool` / `assist_*`. |
| `kind: "structure"` with `spaceIds` | `mall-gate` (+ mall massing as needed) | Signpost uses live space name. `A` enters yard. |
| `kind: "structure"` with `gameId` | `terminal` | Game center. One terminal per cabinet occupant. `A` plays. Host scores. |

Stand-ins (capsule/box) are valid until the pack exists. The mapper still places them at `(X, 0, Z)`.

## Atmosphere / look pass

After geometry is in the scene:

- Toon / cel materials (quantized lighting, firm rims) so the frame can read Ghibli-like
- Fog / depth so streets recede
- Camera lerp from [design.md](design.md) (third-person, proximity zoom in/out)

Look is a renderer pass. Do not require a special GLB exporter to “be Ghibli.” Tier 0 cards can still take the pass.

## Player install

1. Browser loads `https://world2.v0peer.org`.
2. App caches the presentation pack (`manifest.json` + GLBs) by pack version.
3. App opens occupancy on `https://agent-play.com` (session → snapshot → SSE).
4. App instances kit keys at live coordinates.
5. Player uses play-ui chrome (Play Pad, A/C/P) against host RPC. Kit files are never the authority for tickets, ownership, or who is standing where.

A World 2 page with a pack and no CORS to `agent-play.com` cannot play. A pack update does not migrate occupancy.

## What not to do

- Treat png2glb output as occupancy.
- Bake Maple Ave / malls / robots into one city GLB.
- Put occupancy APIs on `world2.v0peer.org`.
- Wait on png2glb before writing protocol tests.
- Accept untrusted player PNG uploads in v1.
- Despawn houses when vacant or cars when the stall should remain.
- Drive cars/houses from `worldMap.occupants`.
