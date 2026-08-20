# World 2 decisions

Architecture Decision Records for Agent Play World 2. Dates are not ship dates. Agent Play is early OSS; these are choices, not a roadmap calendar.

## ADR-001: Godot 4 desktop client, not WebGPU in the Agent Play site

**Status:** superseded by ADR-008 and ADR-009

**Context.** The live world is already rendered in the browser by Pixi.js (`@agent-play/play-ui`), vendored into `packages/web-ui`. A 3D view was originally asked for in terms of Vulkan. Godot 4’s default desktop renderer is Vulkan. Chrome does not expose Vulkan to a web page; WebGPU would be the browser path.

**Original decision.** World 2 is a native Godot 4 client. Vulkan is an implementation detail of Godot’s renderer, not a product name and not a replacement for Pixi inside Next.js. The Agent Play home page stays the 2D game.

**Why superseded.** The human now prioritizes a **browser 3D experience** at `https://world2.v0peer.org`. v1 is a web client, not a native Godot binary. Vulkan/Godot desktop is later / optional. The home-page constraint stands: still no 3D canvas on Agent Play `/`.

**Still true from this ADR.**

- No World 2 canvas on Agent Play `/` or `/agent-play/watch`.
- WebGPU-inside-the-Agent-Play-site remains a different product.

## ADR-002: Client, not occupancy server

**Status:** accepted

**Context.** Occupant Model v1: one canonical snapshot, one fanout path, one incremental sync (`playerChainNotify` + `getPlayerChainNode`), one interaction policy. Main World APIs are `https://world1.v0peer.org`. World 2’s page is `https://world2.v0peer.org`.

**Decision.** World 2 is another **client** of that host, like play-ui and `RemotePlayWorld`. It does not run Redis, PlayWorld, AQL, or player-chain genesis. It does not mint a private `sid` as a new world. A Vite/Next static app on world2 is presentation only.

**Consequences.**

- All occupancy mutations go through existing HTTP/SSE/RPC on world1.
- Two people, one in Pixi and one in the 3D tab, must see the same `worldMap.occupants`.
- Failure to reach Main World is a HUD error, not a local sandbox world (except recorded fixtures in tests).

## ADR-003: No engine multiplayer as occupancy authority

**Status:** accepted

**Context.** Godot 4 has `MultiplayerAPI` / `ENet`. Browser stacks have Colyseus, Photon, socket.io rooms, and WebRTC data channels. Those are designed for a game server the engine owns.

**Decision.** Do not use Godot multiplayer, web multiplayer kits, or peer meshes as the occupancy or pose authority. Other humans and agents appear because the **Agent Play host** said so in the snapshot/SSE (and later geography mesh). World 2 may use ordinary HTTPS `fetch` and `EventSource` only.

**Consequences.**

- No `multiplayer.multiplayer_peer` (future Godot) and no substitute room server for world state.
- Peer voice, when built, uses host `peerCall*` + a dedicated audio WebRTC connection, matching play-ui.

## ADR-004: Desktop first; mobile later

**Status:** superseded by ADR-008 for the v1 ship target

**Original decision.** First ship target is desktop Godot 4 talking to Main World. Mobile Godot export is out of the implementation phases until desktop Phase 1 is real.

**Now.** v1 is a **browser** client (desktop and mobile browsers that can run WebGL). Native mobile export and Godot mobile are still later. Touch Play Pad parity with play-ui is not Phase 1; WASD/arrows on a focused canvas is.

## ADR-005: GDScript vs C#

**Status:** deferred — moot for v1 (superseded in practice by ADR-008)

**Context.** The Agent Play team is TypeScript-heavy. Protocol tests were always planned in Node/Vitest regardless of Godot script language. GDScript vs C# was the open Godot presentation choice.

**Decision for v1.** There is no Godot project in Phase 0–1. Protocol, HTTP, SSE, and the 3D app are **TypeScript throughout**. The GDScript vs C# question returns only if ADR-011 (Godot native later) is activated.

**Not recommended for v1.** Implementing Occupant Model v1 only in GDScript/C# with no TS tests. A custom Vulkan engine. Godot HTML5 as the first ship.

## ADR-006: Local human locomotion, no new move RPC

**Status:** accepted

**Context.** play-ui moves `__human__` in the browser and persists pose in localStorage keyed by `sid`. Durable snapshot occupants are server-allocated. Low-latency shared walking is geography-mesh (optional Domain B), not `getWorldSnapshot`.

**Decision.** World 2 Phase 1 locomotion is **local** and clamped to `worldMap.bounds`. Do not add `moveHuman` to `sdk/rpc`. Geography `POST .../geography/coarse` is Phase 5.

**Consequences.** Another Pixi tab will not see the World 2 pawn’s walk until geography (or until a human occupant exists on the durable snapshot through host paths). Phase 1 still proves the same map: agents and structures spawn from the live snapshot.

## ADR-007: Understate, no invented economy

**Status:** accepted

**Context.** Arcade PU is `computeEventPuDelta` on the server. Featured cabinet is a UTC rotator, not a +10% bonus. Tool names do not spawn buildings. `POST /api/agents` does not create identities.

**Decision.** World 2 docs and later UI copy stay concrete: snapshot, occupant, sid, bounds, amenity, Maple Ave cabinets. No fake launch dates. Legal name on credits: **Viroke Technologies Inc (a Delaware US corporation)**.

## ADR-008: Browser TypeScript 3D client for v1; Godot native later if still wanted

**Status:** accepted for v1 (overrides ADR-001)

**Context.** Occupancy protocol tests, play-ui, and the Agent Play team are TypeScript. The human wants a public 3D page at `https://world2.v0peer.org`, not a desktop binary first. Browser 3D options:

| Path | Fit for v1 | Honest cost |
|------|------------|-------------|
| **Three.js / WebGL** | Best ship path today | Mature, huge examples, works in current Safari/Chrome/Firefox. Not the newest GPU API. |
| **WebGPU** (Three.js WebGPU renderer or vanilla) | Right long-term | Uneven Safari; extra fallback work. Do not block Phase 1 on it. |
| **Godot 4 HTML5 export** | Possible, not priority | Heavy WASM download, longer first paint, weaker `fetch`/SSE story in engine HTTP APIs. Fights the TS protocol-first plan. |
| **Godot 4 native / Vulkan** | Later / optional | Strong desktop renderer; separate install; not the public URL. |

**Decision.** v1 is a **Vite (or similar) TypeScript SPA** with **Three.js / WebGL**. Protocol tests stay in `protocol/` and land first. WebGPU may be adopted later as a renderer swap behind the same scene graph. Godot native (or HTML5) is a future presentation of the same protocol package, not the first ship.

**Consequences.**

- `web/` instead of `godot/` for Phase 1.
- Same `fetch` + `EventSource` skills as play-ui.
- DNS for `world2.v0peer.org` points at the static/web app, not a Godot export.
- ADR-005 (GDScript vs C#) does not gate v1.

## ADR-009: `world2.v0peer.org` is the 3D origin; APIs stay on `world1.v0peer.org`

**Status:** accepted

**Context.** Main World 2D and occupancy APIs already live at `https://world1.v0peer.org`. Marketing lives on agent-play.com and aliases. play-ui can be same-origin with the API (web-ui) or split via `VITE_PLAY_API_BASE`. World 2 is always split: the 3D page must not become a second Next occupancy host.

**Decision.**

- Deploy the World 2 web app at **`https://world2.v0peer.org`**. Canvas at `/`.
- All session / snapshot / SSE / RPC calls go to **`https://world1.v0peer.org/api/agent-play`** (or the current Agent Play API host), cross-origin.
- Do not require changing the Agent Play home page. A footer / worlds nav link on agent-play is an optional follow-up in that repo.
- Auth for occupancy is headers + `sid` query, not cookies. Do not use credentialed CORS (`withCredentials` / `Access-Control-Allow-Credentials`) for v1.
- Host must add CORS on session, sdk/rpc, and SSE for the World 2 origin (today those routes lack it; proximity-action already has `*`).

**Consequences.**

- `sid` travels in JSON and query strings; never log it in full.
- `EventSource` without `withCredentials`; `fetch` with `credentials: "omit"`.
- Config default is Main World, never `window.location.origin`.

## ADR-010: View-only by default on the public URL

**Status:** accepted (closes the old open question about requiring `credentials.json`)

**Context.** play-ui watch works without node credentials for session, snapshot, and SSE. The public 3D URL will be shared like a map, not like a signed-in desktop app. Mutations (proximity, wallet, talk) need a main node.

**Decision.** `https://world2.v0peer.org` is **view-only by default**: session → snapshot → stand-ins → local clamped walk → SSE. Credentials are Phase 2+ for identity and proximity. Do not block Phase 1 on a file picker.

**Consequences.** HUD should say view-only. Another viewer’s walk stays local (ADR-006). Wrong-origin credential restore is still required when identity ships.

## ADR-011: Godot 4 native / Vulkan (future, optional)

**Status:** proposed for after browser v1 — do not start this in Phase 1

**Context.** ADR-001’s desktop Godot idea is still a valid **second client** if a native binary is wanted later. It would consume the same `protocol/` tests and the same world1 APIs (no CORS; native HTTP). GDScript vs C# (old ADR-005) would be decided then.

**Decision.** Keep Godot as a future ADR, not the v1 path. If activated: native desktop first, HTML5 export still not the priority, no Godot multiplayer occupancy (ADR-003).

## Open decisions (human)

Fewer than the Godot-first plan. Remaining:

1. **When to npm-link `@agent-play/sdk`** into `protocol/` (after Phase 0 fixtures, or immediately when coding starts).
2. **Meters per world unit** if art direction needs a number other than 1.
3. **Phase 2 start:** proximity only vs identity + proximity together.
4. **CORS shape on the host:** allowlist `https://world2.v0peer.org` vs `*` for view-only routes. Recommendation: allowlist once identity headers exist; `*` is acceptable for cookie-less view-only if that ships faster.
5. **WebGPU timeline:** v1 stays WebGL; whether Phase 3+ adopts Three.js WebGPU is optional.

Closed vs the previous list:

- **GDScript vs C#** — not a v1 decision (ADR-005 deferred).
- **View-only vs always credentials** — view-only for the public URL (ADR-010).
- **Godot vs browser for v1** — browser TS 3D (ADR-008).
- **World 2 URL / split origin** — `world2.v0peer.org` → world1 APIs (ADR-009).
