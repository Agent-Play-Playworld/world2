# World 2 implementation plan

Planning only. No Vite/Three.js project, no `@agent-play` npm install, no production code in this pass.

TDD order is non-negotiable: **protocol tests first**, then a browser vertical slice that consumes already-tested parsers/mappers.

v1 ship target is **`https://world2.v0peer.org`**: a TypeScript 3D SPA talking cross-origin to `https://world1.v0peer.org`. Godot 4 desktop is later / optional, not this plan’s implementation phase.

## Test strategy

### Red → green → refactor at the protocol boundary

World 2’s public behavior for v1 is: given snapshot JSON and SSE payloads, produce a local occupancy model and 3D poses. That is testable without a canvas.

1. **Red.** Fixture JSON (copied from SDK shapes, not redefined as a second schema long-term) + failing tests for parse, clamp, `(x,y)→(X,0,Z)`, notify sort/merge order.
2. **Green.** Minimum TypeScript to pass.
3. **Refactor** only if names/structure improve. Do not add amenity RPC while the mapper is still the failing test.

When Agent Play is linked later, tests should import real types/parsers from `@agent-play/sdk` (`parseHumanOccupantRow`, `mergeSnapshotWithPlayerChainNode`, `clampWorldPosition`, `sortNodeRefsForSerializedFetch`). Until then, fixtures + duplicated parse rules are allowed **only** if tests assert the same rejects the SDK tests already cover (missing coords, structure without `spaceIds`/`gameId`, duplicate cells).

Canvas / Three.js tests come after the protocol package is green. Visual stand-ins are not a substitute for parse tests.

### What “behavior” means here

- A snapshot with three occupants yields three mapped poses and the correct kinds.
- Out-of-bounds `x,y` clamps to `worldMap.bounds`.
- `playerChainNotify` with a removed occupant drops that row; a present occupant upserts.
- Missing notify or merge error leaves the client requesting a full snapshot (assert the client API’s fallback flag / next RPC op, not mesh nodes).
- Play Pad resolver: `Shift+Ctrl` required; `n` attach; `k/l/i/m` cardinals; `mk`/`il` diagonals.
- API base defaults to Main World, not `window.location.origin`.

Do not write 1:1 tests for every Three.js object. Do not test GPU APIs.

## Phases

### Phase 0 — Protocol package (no renderer)

**In**

- Repo layout: `protocol/` with Vitest (or equivalent) and snapshot fixtures.
- Parsers for bounds, occupants, `getWorldSnapshot` wrapper vs unwrapped GET snapshot.
- Mapper `(x, y) → { x, y: 0, z }` and inverse.
- `clampWorldPosition` against fixture bounds.
- `sortNodeRefsForSerializedFetch` + merge of occupant present/removed nodes.
- SSE line splitter tests: `event:` / `data:` / `: ping` ignored.
- Play Pad chord + buffer tests (port expected table from `packages/play-ui/src/preview-play-pad-keys.test.ts`).

**Out**

- Vite/`web/` canvas, Three.js, HTTPS to Main World.
- npm installing the Agent Play monorepo (optional later).
- Geography, AQL, wallets.
- Godot editor / `.tscn`.

**Exit.** All protocol tests green. No canvas.

### Phase 1 — First vertical slice (browser 3D + live Main World)

Goal: **`https://world2.v0peer.org/`** is visibly **the same world**, not a demo grid. Agent Play home stays 2D.

**Slice (in order)**

1. Vite (or similar) TypeScript app under `web/`; 3D canvas at `/`. Three.js / WebGL recommended (ADR-008).
2. HTTPS deploy. DNS `world2.v0peer.org` → this static app. Do not change Agent Play `/`.
3. API base `https://world1.v0peer.org/api/agent-play` (env override). Never use the page origin as the API.
4. CORS `fetch` `GET /session`; hold `sid` (prefix-only in HUD). View-only: no credentials.
5. `POST /sdk/rpc` `getWorldSnapshot`; run through Phase 0 parsers.
6. Ground plane sized to `worldMap.bounds` (X/Z).
7. Spawn stand-ins: one mesh per occupant at mapped pose; color or primitive by `kind`.
8. Local human pawn: WASD/arrows, clamp to bounds, camera follow. **No move POST** (none exists on the occupancy protocol). No pointer lock.
9. `EventSource` subscribe (no `withCredentials`); on `world:agent_signal` / `world:player_added` try notify merge; else refetch snapshot; update stand-in transforms.
10. HUD: page origin, API origin, sid prefix, occupant counts, view-only, connection state.
11. Failure: CORS / wrong API origin, SSE drop → reconnect + full snapshot, 403 sid → `GET /session` again.

**Host dependency (agent-play, not this repo).** Session, sdk/rpc, and SSE must send CORS for `https://world2.v0peer.org` (see [world-protocol.md](world-protocol.md)). Phase 1 cannot go live without that.

**Non-goals for Phase 1**

- Geography mesh / `POST /geography/coarse`
- Proximity assist/chat, talk, peer voice
- Space yard / amenity / arcade / house scenes
- Wallets, purchase, parking, houses
- Play Pad HUD (logic may exist in `protocol/` already)
- Credentials / `x-node-*` headers
- Pointer lock / first-person
- Godot native or Godot HTML5 export
- WebGPU as a v1 requirement
- Baking a static Maple Ave that ignores occupants
- AQL
- Featured-cabinet bonus scoring
- Putting a 3D canvas on Agent Play `/`
- Cookie credentialed CORS

**Exit.** Against Main World (or a captured fixture replay): HTTPS page at `/` → session → snapshot → stand-ins at real occupant positions → local walk inside bounds → SSE updates move/add/remove stand-ins without restarting.

### Phase 2 — Identity + proximity (still overworld)

**In**

- Load `credentials.json` (file picker), hash passphrase, `POST /api/nodes/validate`.
- Optional node headers on `fetch` RPC (not on `EventSource`).
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

### Phase 6 — Godot native (optional)

Later, if still wanted: a Godot 4 desktop (or HTML5) presentation of the same `protocol/` package. Not the v1 ship. See ADR-008 / ADR-011.

## Phase 1 task checklist (when coding starts)

Protocol (must stay green):

- [ ] Parse `{ snapshot: { worldMap } }` and reject missing occupants array
- [ ] Map fixture occupants to Y-up `(X, 0, Z)` poses
- [ ] Clamp outside bounds
- [ ] Notify sort order + occupant removal
- [ ] SSE ping vs named event
- [ ] API base is Main World, not the page origin

Web (after tests):

- [ ] Vite `web/` with canvas at `/`
- [ ] Session fetch (CORS, view-only)
- [ ] Snapshot fetch
- [ ] Stand-in spawn/despawn/move
- [ ] Local pawn + camera (WASD, no pointer lock)
- [ ] EventSource reconnect
- [ ] HTTPS deploy to `world2.v0peer.org`

Agent Play (separate repo):

- [ ] CORS on session, sdk/rpc, events (and snapshot if used)

## Suggested first failing tests (names only)

- `getWorldSnapshot wrapper yields bounds and occupants`
- `legacy GET snapshot unwrapped shape is accepted by the same ingest`
- `human agent structure mcp kinds map to distinct presentation kinds`
- `structure without spaceIds or gameId is rejected`
- `world y becomes scene z and y stays 0`
- `clamp uses snapshot bounds not MINIMUM_PLAY_WORLD_BOUNDS unless the snapshot says so`
- `playerChainNotify empty triggers snapshot refetch intent`
- `removed occupant node drops the local row`
- `default API base is world1 not the 3D page origin`

Write those tests before any canvas / Three.js scene.

## Risk notes

- **Inventing a move RPC** would fork occupancy. Don’t.
- **Static GLTF streets** that ignore `worldLayout.zones` / `occupants` will desync from 2D immediately.
- **SSE without sid reconcile** will 403 after host session rotation.
- **Scoring arcade locally** will disagree with `computeEventPuDelta` and the 100 APU UTC cap.
- **Using engine multiplayer authority** would create a second occupancy server. Forbidden.
- **Assuming same-origin APIs** (copying play-ui’s `/api/agent-play/session`) will fail on `world2.v0peer.org`. Use the absolute Main World base.
- **Shipping without host CORS** on session / RPC / SSE will look like “World 2 is down” in the browser.
- **Logging full `sid`** leaks the session secret (query strings on EventSource already carry it).
