# World 2 decisions

Architecture Decision Records for Agent Play World 2. Dates are not ship dates. Agent Play is early OSS; these are choices, not a roadmap calendar.

## ADR-001: Godot 4 desktop client, not WebGPU in the Agent Play site

**Status:** superseded by ADR-008 and ADR-009

**Context.** The live world is already rendered in the browser by Pixi.js (`@agent-play/play-ui`), vendored into `packages/web-ui`. A 3D view was originally asked for in terms of Vulkan. Godot 4’s default desktop renderer is Vulkan. Chrome does not expose Vulkan to a web page; WebGPU would be the browser path.

**Original decision.** World 2 is a native Godot 4 client. Vulkan is an implementation detail of Godot’s renderer, not a product name and not a replacement for Pixi inside Next.js. The Agent Play home page stays the 2D game.

**Why superseded.** v1 is a **Vite TypeScript SPA** at `https://world2.v0peer.org` with a **Three.js WebGL** canvas (ADR-008). Godot native and Godot HTML5/WASM are not v1. The home-page constraint stands: still no 3D canvas on Agent Play `/`.

**Still true from this ADR.**

- No World 2 canvas on Agent Play `/` or `/agent-play/watch`.
- WebGPU-inside-the-Agent-Play-site remains a different product.

## ADR-002: Client, not occupancy server

**Status:** accepted

**Context.** Occupant Model v1: one canonical snapshot, one fanout path, one incremental sync (`playerChainNotify` + `getPlayerChainNode`), one interaction policy. Main World occupancy APIs are `https://agent-play.com` (ADR-012). World 2’s page is `https://world2.v0peer.org`.

**Decision.** World 2 is another **client** of that host, like play-ui and `RemotePlayWorld`. It does not run Redis, PlayWorld, AQL, or player-chain genesis. It does not mint a private `sid` as a new world. The Vite app on world2 is presentation only.

**Consequences.**

- All occupancy mutations go through existing HTTP/SSE/RPC on `agent-play.com`.
- Two people, one in Pixi and one in the 3D tab, must see the same `worldMap.occupants`.
- Failure to reach Main World is a HUD error, not a local sandbox world (except recorded fixtures in tests).

## ADR-003: No engine multiplayer as occupancy authority

**Status:** accepted

**Context.** Engine multiplayer kits — Colyseus, Photon, socket.io rooms, WebRTC data channels, and Godot `MultiplayerAPI` / `ENet` if ADR-011 is ever activated — are designed for a game server the engine owns.

**Decision.** Do not use engine multiplayer, web multiplayer kits, or peer meshes as the occupancy or pose authority. Other humans and agents appear because the **Agent Play host** said so in the snapshot/SSE (and later geography mesh). World 2 may use ordinary HTTPS `fetch` and `EventSource` only.

**Consequences.**

- No engine `multiplayer` peer (including a future Godot client) and no substitute room server for world state.
- Peer voice, when built, uses host `peerCall*` + a dedicated audio WebRTC connection, matching play-ui.

## ADR-004: Desktop first; mobile later

**Status:** superseded by ADR-008 for the v1 ship target

**Original decision.** First ship target is desktop Godot 4 talking to Main World. Mobile Godot export is out of the implementation phases until desktop Phase 1 is real.

**Now.** v1 is a **browser** client (desktop and mobile browsers that can run WebGL). Native mobile export and Godot (ADR-011) are parked, not Phase 0–1. Touch Play Pad parity with play-ui is not Phase 1; WASD/arrows on a focused canvas is.

## ADR-005: GDScript vs C#

**Status:** deferred — moot for v1 (superseded in practice by ADR-008)

**Context.** The Agent Play team is TypeScript-heavy. Protocol tests were always planned in Node/Vitest regardless of Godot script language. GDScript vs C# was the open Godot presentation choice.

**Decision for v1.** There is no Godot project in Phase 0–1. Protocol, HTTP, SSE, and the 3D app are **TypeScript throughout**. The GDScript vs C# question returns only if ADR-011 (Godot native later) is activated.

**Rejected for v1.** Implementing Occupant Model v1 only in GDScript/C# with no TS tests. A custom Vulkan engine. Godot native or Godot HTML5/WASM as the first ship.

## ADR-006: Local human locomotion, no new move RPC

**Status:** accepted

**Context.** play-ui moves `__human__` in the browser and persists pose in localStorage keyed by `sid`. Durable snapshot occupants are server-allocated. Low-latency shared walking is geography-mesh (optional Domain B), not `getWorldSnapshot`.

**Decision.** World 2 Phase 1 locomotion is **local** and clamped to `worldMap.bounds`. Do not add `moveHuman` to `sdk/rpc`. Geography `POST .../geography/coarse` is Phase 5.

**Consequences.** Another Pixi tab will not see the World 2 pawn’s walk until geography (or until a human occupant exists on the durable snapshot through host paths). Phase 1 still proves the same map: agents and structures spawn from the live snapshot.

## ADR-007: Understate, no invented economy

**Status:** accepted

**Context.** Arcade PU is `computeEventPuDelta` on the server. Featured cabinet is a UTC rotator, not a +10% bonus. Tool names do not spawn buildings. `POST /api/agents` does not create identities.

**Decision.** World 2 docs and later UI copy stay concrete: snapshot, occupant, sid, bounds, amenity, Maple Ave cabinets. No fake launch dates. Legal name on credits: **Viroke Technologies Inc (a Delaware US corporation)**.

## ADR-008: v1 renderer is WebGL via Three.js in a TypeScript Vite app

**Status:** accepted (overrides ADR-001; parks ADR-011)

**Context.** Occupancy protocol tests, play-ui, and the Agent Play team are TypeScript. The public 3D page is `https://world2.v0peer.org`. An earlier plan made native Godot 4 / Vulkan the v1 client. A later pass chose a browser client but still listed Godot HTML5/WASM as a competing option and called Three.js “recommended.” The human now prefers **WebGL over Godot**. That is the v1 renderer.

**Decision.** v1 is a **Vite TypeScript SPA** whose 3D canvas is **Three.js on WebGL**. This is accepted for Phase 0–1. It is not a recommendation, not “or Godot,” and not a fallback if SSE is hard.

Rejected for v1 — not competing options in Phase 0–1:

- Godot 4 native / Vulkan
- Godot 4 HTML5 / WASM export
- A custom Vulkan engine
- WebGPU as a v1 requirement (Safari is still uneven; do not block Phase 1)

WebGPU may be adopted later as a Three.js renderer swap behind the same scene graph. That does not reopen Godot for v1. Godot (native or HTML5) exists only as **ADR-011**, a parked future second client of `protocol/`.

**Consequences.**

- Phase 0–1 layout is `protocol/` + `web/`, with optional `kit/` for the presentation pack (ADR-013). There is no `godot/` tree, editor project, or HTML5 export in those phases.
- Same `fetch` + `EventSource` skills as play-ui.
- DNS for `world2.v0peer.org` points at the Vite static app, not a Godot export.
- ADR-005 (GDScript vs C#) does not gate v1. No renderer decision remains open for v1.

## ADR-009: `world2.v0peer.org` is the 3D origin; APIs stay on `world1.v0peer.org`

**Status:** superseded in part by ADR-012 (occupancy host). Split-origin, no-cookies, and “world2 is the 3D page” remain true.

**Context.** An earlier pass treated Main World 2D and occupancy APIs as living at `https://world1.v0peer.org`, with agent-play.com as marketing / legacy names. play-ui can be same-origin with the API (web-ui) or split via `VITE_PLAY_API_BASE`. World 2 is always split: the 3D page must not become a second Next occupancy host.

**Original decision.**

- Deploy the World 2 web app at **`https://world2.v0peer.org`**. Canvas at `/`.
- All session / snapshot / SSE / RPC calls go to **`https://world1.v0peer.org/api/agent-play`** (or the then-current Agent Play API host), cross-origin.
- Do not require changing the Agent Play home page. A footer / worlds nav link on agent-play is an optional follow-up in that repo.
- Auth for occupancy is headers + `sid` query, not cookies. Do not use credentialed CORS (`withCredentials` / `Access-Control-Allow-Credentials`) for v1.
- Host must add CORS on session, sdk/rpc, and SSE for the World 2 origin (today those routes lack it; proximity-action already has `*`).

**Why the API-host clause is superseded.** Occupancy and communication stay on **`https://agent-play.com`**. `world1.v0peer.org` is a disposable alias of that same deployment and may be discontinued once world2 / worldN exist. See ADR-012.

**Still true from this ADR.**

- World 2 page origin is `https://world2.v0peer.org`. Canvas at `/`.
- Split origin: the 3D page is never an occupancy API and never a valid `serverUrl`.
- No cookies for occupancy. `EventSource` without `withCredentials`; `fetch` with `credentials: "omit"`.
- Do not require changing the Agent Play home page to ship World 2. 2D game stays on agent-play.com `/`; 3D canvas is not on that `/`.
- Host must add CORS on session, sdk/rpc, and events for the World 2 origin.
- Config never uses `window.location.origin` as the API base.

**Historical note.** play-ui restore still canonicalizes aliases **to** `world1.v0peer.org`. That matches this ADR’s original API host, not ADR-012. The restore code should flip to `agent-play.com`.

## ADR-010: View-only by default on the public URL

**Status:** accepted (closes the old open question about requiring `credentials.json`)

**Context.** play-ui watch works without node credentials for session, snapshot, and SSE. The public 3D URL will be shared like a map, not like a signed-in desktop app. Mutations (proximity, wallet, talk) need a main node.

**Decision.** `https://world2.v0peer.org` is **view-only by default**: session → snapshot → stand-ins → local clamped walk → SSE. Credentials are Phase 2+ for identity and proximity. Do not block Phase 1 on a file picker.

**Consequences.** HUD should say view-only. Another viewer’s walk stays local (ADR-006). Wrong-origin credential restore is still required when identity ships.

## ADR-011: Godot 4 native / Vulkan (parked, future only)

**Status:** parked — not a competing v1 option; do not start in Phase 0–1

**Context.** ADR-001’s desktop Godot idea could still be a **second client** after the browser v1 exists. It would consume the same `protocol/` tests and the same `agent-play.com` APIs (no CORS; native HTTP). GDScript vs C# (old ADR-005) would be decided then.

**Decision.** Godot stays parked. It is not mixed into the Phase 0–1 module layout. Do not treat Godot HTML5/WASM as a v1 alternative if SSE or WebGL is hard. If this ADR is ever activated by a later human decision: native desktop first, HTML5 export still not the priority, no Godot multiplayer occupancy (ADR-003).

## Open decisions (human)

Renderer is **not** among these. Remaining:

1. **When to npm-link `@agent-play/sdk`** into `protocol/` (after Phase 0 fixtures, or immediately when coding starts).
2. **Meters per world unit** if art direction needs a number other than 1.
3. **Phase 2 start:** proximity only vs identity + proximity together.
4. **CORS shape on the host:** allowlist `https://world2.v0peer.org` vs `*` for view-only routes on `agent-play.com`. Recommendation: allowlist once identity headers exist; `*` is acceptable for cookie-less view-only if that ships faster.
5. **WebGPU timeline:** v1 stays WebGL (ADR-008). Whether a later phase adopts Three.js WebGPU is optional and does not reopen Godot.
6. **When Agent Play production `MAIN_WORLD_HOST` flips** from `world1.v0peer.org` to `agent-play.com` (restore + AQL default). World 2 docs already specify intended policy; play-ui code has not flipped.

Closed vs the previous list:

- **v1 renderer** — WebGL via Three.js in a Vite TypeScript app (ADR-008). No remaining human decision.
- **GDScript vs C#** — not a v1 decision (ADR-005 deferred until ADR-011).
- **View-only vs always credentials** — view-only for the public URL (ADR-010).
- **Godot vs browser for v1** — browser TS 3D, WebGL/Three.js (ADR-008). Godot parked as ADR-011.
- **World 2 URL / split origin** — `world2.v0peer.org` is the 3D page; occupancy is `agent-play.com` (ADR-009 still-true clauses + ADR-012).
- **GLB vs occupancy** — kit, not baked city (ADR-013).

## ADR-012: Occupancy root is `https://agent-play.com`; worldN pages are cameras

**Status:** accepted (supersedes the API-host clause of ADR-009)

**Context.** ADR-009 named `https://world1.v0peer.org` as the occupancy API host and treated `agent-play.com` as marketing / legacy. The product decision is the reverse: keep **`https://agent-play.com`** as the root communication / occupancy server. `https://world1.v0peer.org` may be discontinued once world2 or worldN clients exist. `https://world2.v0peer.org` (and future `worldN.v0peer.org`) are installable 3D clients / page origins, never occupancy APIs.

play-ui `MAIN_WORLD_HOST` is still `world1.v0peer.org` at the time of this ADR, and restore still canonicalizes aliases **to** world1. That is current code, not intended policy.

**Decision.**

- Canonical occupancy origin: **`https://agent-play.com`**.
- Canonical API base: **`https://agent-play.com/api/agent-play`**.
- New `credentials.json` `serverUrl`: **`https://agent-play.com`**.
- Same-deployment aliases: `www.agent-play.com`, `playworld.world`, and **`world1.v0peer.org` while it still exists**. Restore canonicalizes these **to** `agent-play.com`.
- `https://world1.v0peer.org` is disposable. Clients must not depend on it as the canonical host.
- `https://world2.v0peer.org` and `https://worldN.v0peer.org` are page origins / cameras. Never occupancy APIs. Never valid `serverUrl`.
- Do not use `window.location.origin` as the API base on a worldN page.
- 2D game remains on `agent-play.com` (home stays game-only). 3D canvas is not on Agent Play `/`.
- CORS: `agent-play.com` must allow the World 2 origin on session, sdk/rpc, and events.
- HUD shows page origin vs **server** origin `agent-play.com`.

**Consequences.**

- World 2 default API base is `https://agent-play.com/api/agent-play`.
- Protocol tests assert that default, and that `world2.v0peer.org` is rejected as `serverUrl`.
- Agent Play operator copy (help, playground, docs) must not tell developers that agent-play.com is a retired map or that world1 is the only CONNECT host.
- Agent Play restore / `MAIN_WORLD_HOST` should flip to match this ADR; until then, World 2 still targets `agent-play.com` and documents the code gap.

## ADR-013: GLB is a presentation kit; occupancy stays JSON

**Status:** accepted

**Context.** A 3D client needs meshes. Baking Maple Ave and every stall into one city GLB would ignore live occupants, parking tickets, and house ownership. png2glb can compile reference PNGs to GLB, which is easy to mistake for “the world.”

**Decision.**

- Three layers: occupancy JSON on `agent-play.com`, kit GLBs, atmosphere (toon/cel look pass after load).
- Occupant renderer instances kit prefabs at snapshot coordinates. It does not bake a static town that ignores occupants.
- png2glb is a **kit compiler**. It emits a versioned pack (`manifest.json` + per-key GLBs). Players install/cache the pack and still talk to live occupancy.
- Engine contract is the same across compiler tiers 0–3 (textured card, silhouette extrude, image-to-3D API, artist drop-in).
- Do not block Phase 0 protocol tests on png2glb.
- Cars and houses come from `parkingStreet` / `houseStreet`, not `worldMap.occupants`. Keep 8 parking spots and 4 houses. Empty stall always; car GLB only when the parking occupant is active. Houses do not despawn when vacant.
- Untrusted player PNG uploads are out of scope unless explicitly sandboxed later.

**Consequences.**

- Suggested layout includes `world2/kit` beside `protocol/` and `web/`.
- A missing pack is not a missing world: stand-ins are valid.
- See [presentation-kit.md](presentation-kit.md).
