# World 2 implementation plan

Planning only. No Godot project, no `@agent-play` npm install, no production code in this pass.

TDD order is non-negotiable: **protocol tests first**, then a Godot vertical slice that consumes already-tested parsers/mappers.

## Test strategy

### Red → green → refactor at the protocol boundary

World 2’s public behavior for v1 is: given snapshot JSON and SSE payloads, produce a local occupancy model and 3D poses. That is testable without Godot.

1. **Red.** Fixture JSON (copied from SDK shapes, not redefined as a second schema long-term) + failing tests for parse, clamp, `(x,y)→(X,0,Z)`, notify sort/merge order.
2. **Green.** Minimum TypeScript (or later GDScript) to pass.
3. **Refactor** only if names/structure improve. Do not add amenity RPC while the mapper is still the failing test.

When Agent Play is linked later, tests should import real types/parsers from `@agent-play/sdk` (`parseHumanOccupantRow`, `mergeSnapshotWithPlayerChainNode`, `clampWorldPosition`, `sortNodeRefsForSerializedFetch`). Until then, fixtures + duplicated parse rules are allowed **only** if tests assert the same rejects the SDK tests already cover (missing coords, structure without `spaceIds`/`gameId`, duplicate cells).

Godot scene tests come after the protocol package is green. Visual stand-ins are not a substitute for parse tests.

### What “behavior” means here

- A snapshot with three occupants yields three mapped poses and the correct kinds.
- Out-of-bounds `x,y` clamps to `worldMap.bounds`.
- `playerChainNotify` with a removed occupant drops that row; a present occupant upserts.
- Missing notify or merge error leaves the client requesting a full snapshot (assert the client API’s fallback flag / next RPC op, not Godot nodes).
- Play Pad resolver: `Shift+Ctrl` required; `n` attach; `k/l/i/m` cardinals; `mk`/`il` diagonals.

Do not write 1:1 tests for every Godot node. Do not test Vulkan.

## Phases

### Phase 0 — Protocol package (no Godot)

**In**

- Repo layout: `protocol/` with Vitest (or equivalent) and snapshot fixtures.
- Parsers for bounds, occupants, `getWorldSnapshot` wrapper vs unwrapped GET snapshot.
- Mapper `(x, y) → { x, y: 0, z }` and inverse.
- `clampWorldPosition` against fixture bounds.
- `sortNodeRefsForSerializedFetch` + merge of occupant present/removed nodes.
- SSE line splitter tests: `event:` / `data:` / `: ping` ignored.
- Play Pad chord + buffer tests (port expected table from `packages/play-ui/src/preview-play-pad-keys.test.ts`).

**Out**

- Godot editor, `.tscn`, meshes, HTTPS to Main World.
- npm installing the Agent Play monorepo (optional later).
- Geography, AQL, wallets.

**Exit.** All protocol tests green. No scenes.

### Phase 1 — First vertical slice (desktop Godot + live Main World)

Goal: a window that is visibly **the same world**, not a demo grid.

**Slice (in order)**

1. Godot 4 desktop project; Vulkan is the Godot renderer, not a product surface.
2. Autoloads: origin (`https://world1.v0peer.org`), `GET /api/agent-play/session`, hold `sid`.
3. `POST /sdk/rpc` `getWorldSnapshot`; run through Phase 0 parsers.
4. Ground plane sized to `worldMap.bounds` (X/Z).
5. Spawn stand-ins: one mesh per occupant at mapped pose; color or primitive by `kind`.
6. Local human pawn: WASD/arrows, clamp to bounds, camera follow. **No move POST** (none exists on the occupancy protocol).
7. SSE subscribe; on `world:agent_signal` / `world:player_added` try notify merge; else refetch snapshot; update stand-in transforms.
8. HUD: origin, sid prefix, occupant counts, connection state.
9. Failure: wrong origin string in settings, SSE drop → reconnect + full snapshot, 403 sid → `GET /session` again.

**Non-goals for Phase 1**

- Geography mesh / `POST /geography/coarse`
- Proximity assist/chat, talk, peer voice
- Space yard / amenity / arcade / house scenes
- Wallets, purchase, parking, houses
- Play Pad HUD (logic may exist in `protocol/` already)
- Credentials required for view-only
- Mobile export
- Godot multiplayer
- Baking a static Maple Ave that ignores occupants
- AQL
- Featured-cabinet bonus scoring

**Exit.** Against Main World (or a captured fixture replay): session → snapshot → stand-ins at real occupant positions → local walk inside bounds → SSE updates move/add/remove stand-ins without restarting.

### Phase 2 — Identity + proximity (still overworld)

**In**

- Load `credentials.json`, hash passphrase, `POST /api/nodes/validate`.
- Optional node headers on RPC.
- Proximity query using play-ui radii; agent members beat cabinets.
- `POST /proximity-action` assist/chat/zone/yield with `fromPlayerId: "__human__"`.
- HUD prompts. Host still rejects H2H text.

**Out.** Voice, amenities, arcade rounds, geography.

### Phase 3 — Stages

**In**

- `enterSpace` / `enterAmenity` (amenity is audit).
- Space yard + shop / supermarket / car wash scenes.
- Arcade doors: enter game stages; `getGameStats` / `applyGameOutcome` with host `computeEventPuDelta`. Featured = UTC rotator, **same** scoring as the destination game.
- Esc / exit to overworld.

**Out.** Authoring amenities (AQL / space-node + service key). World 2 is a player client.

### Phase 4 — Economy and talk (as needed)

Wallets, purchase, parking tickets, houses, billed talk sessions. Still host-authoritative.

### Phase 5 — Geography mesh (optional presence)

Only after durable snapshot + SSE are solid. Membership, coarse pose, Yjs/WebRTC. Peer voice is a **separate** `RTCPeerConnection` and `peerCall*` RPC. Do not attach mics to the geography data channel.

### Phase 6 — Mobile export

Later. Not this plan’s implementation phase. Desktop Godot 4 is the ship target.

## Phase 1 task checklist (when coding starts)

Protocol (must stay green):

- [ ] Parse `{ snapshot: { worldMap } }` and reject missing occupants array
- [ ] Map fixture occupants to Godot poses
- [ ] Clamp outside bounds
- [ ] Notify sort order + occupant removal
- [ ] SSE ping vs named event

Godot (after tests):

- [ ] Session autoload
- [ ] Snapshot fetch
- [ ] Stand-in spawn/despawn/move
- [ ] Local pawn + camera
- [ ] SSE reconnect

## Suggested first failing tests (names only)

- `getWorldSnapshot wrapper yields bounds and occupants`
- `legacy GET snapshot unwrapped shape is accepted by the same ingest`
- `human agent structure mcp kinds map to distinct presentation kinds`
- `structure without spaceIds or gameId is rejected`
- `world y becomes godot z and y stays 0`
- `clamp uses snapshot bounds not MINIMUM_PLAY_WORLD_BOUNDS unless the snapshot says so`
- `playerChainNotify empty triggers snapshot refetch intent`
- `removed occupant node drops the local row`

Write those tests before any `.tscn`.

## Risk notes

- **Inventing a move RPC** would fork occupancy. Don’t.
- **Static GLTF streets** that ignore `worldLayout.zones` / `occupants` will desync from 2D immediately.
- **SSE without sid reconcile** will 403 after host session rotation.
- **Scoring arcade locally** will disagree with `computeEventPuDelta` and the 100 APU UTC cap.
- **Using Godot multiplayer authority** would create a second occupancy server. Forbidden.
