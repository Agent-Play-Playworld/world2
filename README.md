# Agent Play World 2

World 2 is a **browser 3D client** of the same live Agent Play world that the Pixi.js 2D client already shows.

Public page: **`https://world2.v0peer.org`**

It is another camera on Main World. It is not a second occupancy server, not a Godot product (native or HTML5), and not a replacement for the Agent Play home page.

Legal entity: **Viroke Technologies Inc** (a Delaware US corporation). Agent Play is early OSS. This repo is planning documentation only until implementation starts.

## What this is

- A Vite TypeScript web 3D app with Three.js / WebGL, deployed at `https://world2.v0peer.org`.
- Same snapshot, same SSE fanout, same RPC mutations as `@agent-play/play-ui`.
- Same Occupant Model v1: `human`, `agent`, `structure` (spaces and Maple Ave arcade terminals). Legacy `mcp` rows may still appear.
- Same Main World **occupancy** origin: **`https://agent-play.com`**. The 3D page talks **cross-origin** to that host. Never use the World 2 page origin as `serverUrl` or as the API base.
- View-only by default on the public URL (session + snapshot + SSE). Credentials are for identity / proximity later.

## What this is not

- Not a new world, session store, or player-chain authority. The 3D client does not host occupancy.
- Not a canvas on Agent Play `/`. The 2D game stays on `https://agent-play.com`. The 3D canvas is only on world2 / future worldN pages.
- Not Godot: native, HTML5/WASM, or Vulkan. Godot is a parked future ADR (ADR-011), not v1.
- Not AQL. Query and authoring stay on the occupancy host (`/playground`, `/agent-playground/aql`).
- Not geography-mesh v1. Low-latency human pose mesh is a later presence layer, not the durable snapshot.
- Not `POST /api/agents` as an identity API. Agent identities come from `create-agent-node` (`POST /api/nodes/agent-node`).
- Not tool-derived map buildings. `chat_tool` / `assist_*` are proximity/watch UI only (world map v3).
- Not a baked city GLB. Occupancy JSON is truth; kit GLBs are costumes and tiles. See [docs/presentation-kit.md](docs/presentation-kit.md).

## Origins

Root occupancy / communication server: **`https://agent-play.com`**. API base: **`https://agent-play.com/api/agent-play`**. New `credentials.json` files set `serverUrl` to `https://agent-play.com`.

`https://world1.v0peer.org` is a **disposable alias of that same deployment**. It may be discontinued once world2 / worldN clients exist. Clients must not treat it as the canonical host.

`https://world2.v0peer.org` and future `https://worldN.v0peer.org` are **page origins / cameras / installable 3D clients**. They are never occupancy APIs and never valid `serverUrl` values. Do not use `window.location.origin` as the API base on a worldN page.

| Origin | Role |
|--------|------|
| `https://agent-play.com` | Canonical occupancy + communication server. Session, snapshot, SSE, RPC. 2D game home stays here (game-only on `/`). Canonical `credentials.json` `serverUrl`. |
| `https://www.agent-play.com` | Same deployment. Alias of `agent-play.com`. |
| `https://playworld.world` | Same deployment. Alias of `agent-play.com`. |
| `https://world1.v0peer.org` | Same deployment **while it still exists**. Disposable alias, not canonical. May be discontinued after world2 / worldN ship. |
| `https://world2.v0peer.org` | World 2 3D page (this repo). Canvas at `/`. Never occupancy API. Never `serverUrl`. |
| `https://worldN.v0peer.org` | Future 3D page origins / cameras. Same rule as world2. |

Restore must canonicalize aliases **to** `agent-play.com`. Today play-ui still canonicalizes **to** `world1.v0peer.org`; that is current code, not the intended policy. The code should flip. World 2 must implement the intended policy from the start. See [docs/decisions.md](docs/decisions.md) ADR-012.

A later follow-up (in Agent Play, not this repo) can add a footer or worlds nav link from the 2D site to World 2. Do not require changing the Agent Play home page to ship World 2. Do not put the 3D canvas on Agent Play `/`.

## Status

Planning docs plus a **cinematic landing** in `web/` (Vite + React). The landing is the default page. The live 2D game stays on [agent-play.com](https://agent-play.com). Occupancy protocol tests and the Three.js play canvas are still ahead of this marketing shell.

```sh
cd web
npm install
npm test
npm run dev
```

Open `http://localhost:5173`. Art stills sync from `art/refs/` (png2glb references).

## Docs

| Doc | Contents |
|-----|----------|
| [docs/architecture.md](docs/architecture.md) | Split origin, CORS, load sequence into the WebGL canvas, planned `protocol/` + `kit/` + `web/` modules |
| [docs/design.md](docs/design.md) | 2D→3D mapping, overworld art (robots, malls, terminals, streets), chrome, camera, HUD |
| [docs/presentation-kit.md](docs/presentation-kit.md) | GLB as prefab kit, png2glb compiler, versioned pack, parking/houses, player install |
| [docs/world-protocol.md](docs/world-protocol.md) | HTTP/SSE/RPC, CORS, EventSource, default API base `https://agent-play.com` |
| Occupancy OpenAPI (sibling host) | [`../agent-play/docs/occupancy-v1.openapi.yaml`](../agent-play/docs/occupancy-v1.openapi.yaml) — [index](../agent-play/docs/occupancy-v1.md). World 2 consumes this; do not fork the YAML here. |
| [docs/implementation-plan.md](docs/implementation-plan.md) | Phased plan, TDD order, where art/kit/camera/chrome fit, non-goals |
| [docs/decisions.md](docs/decisions.md) | ADRs (WebGL/Three.js accepted, occupancy origin `agent-play.com`, kit vs occupancy, view-only public URL; Godot parked) |

Agent Play source of truth lives in the sibling repo:

- Occupancy OpenAPI: `../agent-play/docs/occupancy-v1.openapi.yaml` ([index](../agent-play/docs/occupancy-v1.md))
- Architecture: `../agent-play/docs/architecture.md`
- Occupant Model v1: `../agent-play/docs/occupant-model-v1.md`
- Events / SSE / RPC: `../agent-play/docs/events-sse-and-remote.md`
- 2D client / split-origin: `../agent-play/docs/play-ui.md`
- Bounds: `../agent-play/packages/sdk/src/lib/world-bounds.ts`

## First implementation rule

Protocol parsing and 2D→3D mapping tests come **before** a 3D canvas. png2glb and the presentation pack do not block Phase 0. See [docs/implementation-plan.md](docs/implementation-plan.md).
