# World 2 decisions

Architecture Decision Records for Agent Play World 2. Dates are not ship dates. Agent Play is early OSS; these are choices, not a roadmap calendar.

## ADR-001: Godot 4 desktop client, not WebGPU in the Agent Play site

**Status:** accepted for v1

**Context.** The live world is already rendered in the browser by Pixi.js (`@agent-play/play-ui`), vendored into `packages/web-ui`. A 3D view was asked for in terms of Vulkan. Godot 4’s default desktop renderer is Vulkan. Chrome does not expose Vulkan to a web page; WebGPU would be the browser path.

**Decision.** World 2 is a **native Godot 4 client**. Vulkan is an implementation detail of Godot’s renderer, not a product name and not a replacement for Pixi inside Next.js. The Agent Play **home page stays the 2D game**. World 2 is a separate binary / editor project.

**Consequences.**

- No World 2 canvas on `/` or `/agent-play/watch`.
- Desktop first (this plan’s implementation phase). Mobile Godot export is later.
- WebGPU-in-the-site remains a different product if anyone wants 3D in the browser later.

## ADR-002: Client, not occupancy server

**Status:** accepted

**Context.** Occupant Model v1: one canonical snapshot, one fanout path, one incremental sync (`playerChainNotify` + `getPlayerChainNode`), one interaction policy. Main World is `https://world1.v0peer.org`.

**Decision.** World 2 is another **client** of that host, like play-ui and `RemotePlayWorld`. It does not run Redis, PlayWorld, AQL, or player-chain genesis. It does not mint a private `sid` as a new world.

**Consequences.**

- All occupancy mutations go through existing HTTP/SSE/RPC.
- Two people, one in Pixi and one in Godot, must see the same `worldMap.occupants`.
- Failure to reach Main World is a HUD error, not a local sandbox world (except recorded fixtures in tests).

## ADR-003: No Godot multiplayer authority

**Status:** accepted

**Context.** Godot 4 has `MultiplayerAPI`, `ENet`, spawners, and peer authority. That stack is designed for a game server Godot instance.

**Decision.** Do not use Godot multiplayer as the occupancy or pose authority. Other humans and agents appear because the **Agent Play host** said so in the snapshot/SSE (and later geography mesh). World 2 may use ordinary nodes and RPCs over HTTPS only.

**Consequences.**

- No `multiplayer.multiplayer_peer` for world state.
- Peer voice, when built, uses host `peerCall*` + a dedicated audio WebRTC connection, matching play-ui — not Godot’s high-level multiplayer.

## ADR-004: Desktop first; mobile later

**Status:** accepted for this plan

**Context.** Godot can export to mobile. Input, credentials files, SSE backgrounding, and GPU differ sharply from desktop.

**Decision.** First ship target is **desktop Godot 4 talking to Main World**. Mobile export is out of the implementation phases in `implementation-plan.md` until desktop Phase 1 is real.

**Consequences.** Input bindings assume keyboard. Touch Play Pad parity with play-ui is not Phase 1.

## ADR-005: GDScript vs C# (recommendation, human still decides)

**Status:** proposed — **needs a human decision before Godot code**

**Context.**

- The Agent Play team is **TypeScript-heavy**. Parsers, merge, and clamp already exist in `@agent-play/sdk`.
- World 2 must speak HTTP JSON and **SSE** (`text/event-stream`, named events, 30s pings).
- Godot 4 supports GDScript and .NET C#. GDScript is the default for scenes, signals, and editor workflow. C# has mature `HttpClient` streaming, which maps cleanly onto SSE. GDScript `HTTPRequest` is request/response oriented; SSE wants a long-lived stream (TCP/`HTTPClient` in Godot, or a small sidecar).
- Protocol tests should run **before** any Godot scene, in a Node test runner, regardless of script language inside Godot.

**Recommendation.**

1. **Protocol layer in TypeScript** (`protocol/` in this repo): Vitest, fixtures, parse/map/merge. This matches the team and can later depend on `@agent-play/sdk` instead of a second schema.
2. **Godot presentation in GDScript** for autoloads, stages, HUD, and input — fastest path in the editor for a TS-heavy team that is not already a C# shop.
3. **SSE/HTTP adapter:** start in GDScript with Godot `HTTPClient` chunked read, covered by protocol tests that feed the same parser. If streaming is fragile, isolate **only** the WorldClient transport in C# (or a tiny local Node sidecar). Do not rewrite the whole game in C# to get SSE.

**Not recommended for v1.**

- C# for all game code (tooling cost, weaker overlap with current Agent Play skills).
- Implementing Occupant Model v1 only in GDScript with no TS tests.
- A custom Vulkan engine outside Godot.

**Ask the human:** accept GDScript + TS protocol, or C# WorldClient + GDScript scenes, or C# throughout.

## ADR-006: Local human locomotion, no new move RPC

**Status:** accepted

**Context.** play-ui moves `__human__` in the browser and persists pose in localStorage keyed by `sid`. Durable snapshot occupants are server-allocated. Low-latency shared walking is geography-mesh (optional Domain B), not `getWorldSnapshot`.

**Decision.** World 2 Phase 1 locomotion is **local** and clamped to `worldMap.bounds`. Do not add `moveHuman` to `sdk/rpc`. Geography `POST .../geography/coarse` is Phase 5.

**Consequences.** Another Pixi tab will not see the Godot pawn’s walk until geography (or until a human occupant exists on the durable snapshot through host paths). Phase 1 still proves the same map: agents and structures spawn from the live snapshot.

## ADR-007: Understate, no invented economy

**Status:** accepted

**Context.** Arcade PU is `computeEventPuDelta` on the server. Featured cabinet is a UTC rotator, not a +10% bonus. Tool names do not spawn buildings. `POST /api/agents` does not create identities.

**Decision.** World 2 docs and later UI copy stay concrete: snapshot, occupant, sid, bounds, amenity, Maple Ave cabinets. No fake launch dates. Legal name on credits: **Viroke Technologies Inc (a Delaware US corporation)**.

## Open decisions (human)

Recorded here so implementation does not stall on silent guesses:

1. **GDScript vs C#** — see ADR-005.
2. **When to npm-link `@agent-play/sdk`** into `protocol/` (after Phase 0 fixtures, or immediately when coding starts).
3. **Meters per world unit** if art direction needs a number other than 1.
4. **Whether view-only (no credentials) is a supported desktop mode** or World 2 always requires `credentials.json`.
5. **Phase 2 start:** proximity only vs identity + proximity together.
