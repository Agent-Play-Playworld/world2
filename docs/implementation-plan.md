# World 2 implementation plan

Planning only. No Vite/Three.js project, no `@agent-play` npm install, no production code in this pass.

TDD order is non-negotiable: **protocol tests first**, then a browser vertical slice that consumes already-tested parsers/mappers.

v1 ship target is **`https://world2.v0peer.org`**: a Vite TypeScript SPA with a Three.js WebGL canvas, talking cross-origin to **`https://agent-play.com`**. Godot (native or HTML5) is parked (ADR-011), not an implementation phase in this plan.

png2glb and the presentation pack do **not** block Phase 0. Phase 1 can lerp camera on stand-ins. CORS on `agent-play.com` is a host dependency. Protocol first.

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
- API base defaults to `https://agent-play.com`, not `window.location.origin`, not `world2.v0peer.org`, and not `world1.v0peer.org` as the permanent host.
- Parking spots and houses parse from `parkingStreet` / `houseStreet`, not from `worldMap.occupants`.

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
- Config: default API origin is `https://agent-play.com`; page origin is rejected as API base; `world2.v0peer.org` is not valid `serverUrl`.
- Optional: parse `parkingStreet` / `houseStreet` fixtures (anchors exist even when vacant).

**Out**

- Vite/`web/` canvas, Three.js, HTTPS to Main World.
- png2glb / presentation pack (may exist as empty `kit/` notes; not a Phase 0 gate).
- npm installing the Agent Play monorepo (optional later).
- Geography, AQL, wallets.
- Godot editor, `.tscn`, native export, or HTML5/WASM (ADR-011; not this phase).

**Exit.** All protocol tests green. No canvas.

**Art / kit / camera / chrome.** None required. Play Pad tests may land here because they are pure key tables.

### Phase 1 — First vertical slice (browser 3D + live Main World)

Goal: **`https://world2.v0peer.org/`** is visibly **the same world**, not a demo grid. Agent Play home at `https://agent-play.com/` stays 2D.

**Slice (in order)**

1. Vite TypeScript app under `web/`; 3D canvas at `/`. Three.js / WebGL (ADR-008).
2. HTTPS deploy. DNS `world2.v0peer.org` → this static app. Do not change Agent Play `/`.
3. API base `https://agent-play.com/api/agent-play` (env override). Never use the page origin as the API.
4. CORS `fetch` `GET /session` on **agent-play.com**; hold `sid` (prefix-only in HUD). View-only: no credentials.
5. `POST /sdk/rpc` `getWorldSnapshot`; run through Phase 0 parsers.
6. Ground plane sized to `worldMap.bounds` (X/Z).
7. Spawn stand-ins: one mesh per occupant at mapped pose; color or primitive by `kind`. Kit GLBs optional; stand-ins are enough.
8. Local human pawn: WASD/arrows, clamp to bounds, **third-person follow**, **no pointer lock**. Soft lerp zoom in on proximity radii / action panel, zoom out for street lens. Keyboard Z is not zoom.
9. `EventSource` subscribe (no `withCredentials`); on `world:agent_signal` / `world:player_added` try notify merge; else refetch snapshot; update stand-in transforms.
10. HUD: **page origin vs server origin `agent-play.com`**, sid prefix, occupant counts, view-only, connection state.
11. Failure: CORS / wrong API origin, SSE drop → reconnect + full snapshot, 403 sid → `GET /session` again.
12. Optional in Phase 1 if cheap: DOM Play Pad + proximity bar (disabled mutations), street-tile ground, empty parking stalls / vacant houses from snapshot fields.

**Host dependency (agent-play, not this repo).** Session, sdk/rpc, and SSE on **`agent-play.com`** must send CORS for `https://world2.v0peer.org` (see [world-protocol.md](world-protocol.md)). Phase 1 cannot go live without that.

**Art / kit / camera / chrome in this phase.** Camera lerp on stand-ins: yes. png2glb: no gate. Chrome: Play Pad HUD optional; protocol tests already cover chords. Streets as first-class tiles: optional upgrade from a flat ground plane.

**Non-goals for Phase 1**

- Geography mesh / `POST /geography/coarse`
- Proximity assist/chat, talk, peer voice (chrome may render; do not POST yet)
- Space yard / amenity / arcade / house interiors
- Wallets, purchase, parking tickets, house buys
- Credentials / `x-node-*` headers
- Pointer lock / first-person
- Godot native or Godot HTML5/WASM (parked; ADR-011)
- WebGPU as a v1 requirement
- Baking a static Maple Ave that ignores occupants
- AQL
- Featured-cabinet bonus scoring
- Putting a 3D canvas on Agent Play `/`
- Cookie credentialed CORS
- Blocking on png2glb
- Untrusted player PNG uploads

**Exit.** Against Main World (or a captured fixture replay): HTTPS page at `/` → session on agent-play.com → snapshot → stand-ins at real occupant positions → local walk inside bounds → SSE updates move/add/remove stand-ins without restarting.

### Phase 2 — Identity + proximity (still overworld)

**In**

- Load `credentials.json` (file picker), hash passphrase, `POST /api/nodes/validate`.
- Canonicalize `serverUrl` aliases **to** `https://agent-play.com`. Refuse `world2.v0peer.org`.
- Optional node headers on `fetch` RPC (not on `EventSource`).
- Proximity query using play-ui radii; agent members beat cabinets / malls / parking / houses.
- `POST /proximity-action` assist/chat/zone/yield with `fromPlayerId: "__human__"`.
- DOM chrome: proximity touch bar A/C/P, session panels (assist, chat, PTT). `P` near agent is push-to-talk, `C` is chat, `A` is assist.
- HUD prompts. Host still rejects H2H text.
- Kit robots+stalls if the pack exists; otherwise keep stand-ins.

**Out.** Amenity interiors, arcade rounds as full stages, geography.

**Art / kit / camera / chrome.** Chrome is in. Camera already lerps from Phase 1. Kit preferred but not a gate if stand-ins remain honest to occupants.

### Phase 3 — Stages

**In**

- `enterSpace` / `enterAmenity` (amenity is audit).
- Mall gate → space yard + shop / supermarket / car wash scenes. `P` on amenity pads.
- Arcade terminals: enter game stages; `getGameStats` / `applyGameOutcome` with host `computeEventPuDelta`. Featured = UTC rotator, **same** scoring as the destination game.
- House interiors (`A` if owner, `P` inspect). Esc / exit to overworld.
- Presentation pack keys: mall-gate, terminal, house-1..4, parking-stall, car.

**Out.** Authoring amenities (AQL / space-node + service key). World 2 is a player client.

**Art / kit / camera / chrome.** Kit should be on the contract by now. Look pass (toon/cel, fog) can land here or late Phase 1. png2glb compiler may produce the pack; artist drop-in is fine.

### Phase 4 — Economy and talk (as needed)

Wallets, purchase, parking tickets, houses, billed talk sessions. Still host-authoritative. Car GLB only when parking occupant active; houses never despawn.

### Phase 5 — Geography mesh (optional presence)

Only after durable snapshot + SSE are solid. Membership, coarse pose, Yjs/WebRTC. Peer voice is a **separate** `RTCPeerConnection` and `peerCall*` RPC. Do not attach mics to the geography data channel.

### Parked — Godot (not this plan)

Godot 4 native or HTML5/WASM is **not** a phase in this plan and is **not** a fallback if SSE or WebGL is hard. See ADR-011. Do not add a `godot/` module to Phase 0–1.

## Phase 1 task checklist (when coding starts)

Protocol (must stay green):

- [ ] Parse `{ snapshot: { worldMap } }` and reject missing occupants array
- [ ] Map fixture occupants to Y-up `(X, 0, Z)` poses
- [ ] Clamp outside bounds
- [ ] Notify sort order + occupant removal
- [ ] SSE ping vs named event
- [ ] API base is `https://agent-play.com`, not the 3D page origin

Web (after tests):

- [ ] Vite `web/` with canvas at `/`
- [ ] Session fetch (CORS, view-only) against agent-play.com
- [ ] Snapshot fetch
- [ ] Stand-in spawn/despawn/move
- [ ] Local pawn + third-person camera (WASD, no pointer lock, proximity lerp)
- [ ] EventSource reconnect
- [ ] HUD shows page origin vs server origin
- [ ] HTTPS deploy to `world2.v0peer.org`

Agent Play (separate repo):

- [ ] CORS on session, sdk/rpc, events (and snapshot if used) for `https://world2.v0peer.org`
- [ ] Restore canonicalization flip to `agent-play.com` (intended; not required to start World 2 protocol tests)

Kit (not a Phase 0/1 gate):

- [ ] `kit/` compiler + `manifest.json` contract
- [ ] Player cache of versioned pack

## Suggested first failing tests (names only)

- `getWorldSnapshot wrapper yields bounds and occupants`
- `legacy GET snapshot unwrapped shape is accepted by the same ingest`
- `human agent structure mcp kinds map to distinct presentation kinds`
- `structure without spaceIds or gameId is rejected`
- `world y becomes scene z and y stays 0`
- `clamp uses snapshot bounds not MINIMUM_PLAY_WORLD_BOUNDS unless the snapshot says so`
- `playerChainNotify empty triggers snapshot refetch intent`
- `removed occupant node drops the local row`
- `default API base is agent-play.com not the 3D page origin`
- `world2.v0peer.org is rejected as serverUrl`
- `world1.v0peer.org canonicalizes to agent-play.com`

Write those tests before any canvas / Three.js scene.

## Risk notes

- **Inventing a move RPC** would fork occupancy. Don’t.
- **Static GLTF streets** that ignore `worldLayout.zones` / `occupants` will desync from 2D immediately.
- **Treating png2glb as the world** will freeze occupancy into art.
- **SSE without sid reconcile** will 403 after host session rotation.
- **Scoring arcade locally** will disagree with `computeEventPuDelta` and the 100 APU UTC cap.
- **Using engine multiplayer authority** would create a second occupancy server. Forbidden.
- **Assuming same-origin APIs** (copying play-ui’s `/api/agent-play/session`) will fail on `world2.v0peer.org`. Use the absolute `agent-play.com` base.
- **Using `window.location.origin` as API base** on a worldN page talks to a camera host that has no occupancy.
- **Depending on `world1.v0peer.org` as canonical** will break when that alias is discontinued.
- **Shipping without host CORS** on session / RPC / SSE will look like “World 2 is down” in the browser.
- **Logging full `sid`** leaks the session secret (query strings on EventSource already carry it).
- **Binding Z to zoom** fights play-ui zone.
