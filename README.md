# Agent Play World 2

World 2 is a **browser 3D client** of the same live Agent Play world that the Pixi.js 2D client already shows.

Public URL: **`https://world2.v0peer.org`**

It is another camera on Main World. It is not a second occupancy server, not a Godot/Vulkan product in v1, and not a replacement for the Agent Play home page.

Legal entity: **Viroke Technologies Inc** (a Delaware US corporation). Agent Play is early OSS. This repo is planning documentation only until implementation starts.

## What this is

- A TypeScript web 3D app (Vite or similar, Three.js / WebGL recommended) deployed at `https://world2.v0peer.org`.
- Same snapshot, same SSE fanout, same RPC mutations as `@agent-play/play-ui`.
- Same Occupant Model v1: `human`, `agent`, `structure` (spaces and Maple Ave arcade cabinets). Legacy `mcp` rows may still appear.
- Same Main World **API** origin: `https://world1.v0peer.org`. The 3D page talks **cross-origin** to that host.
- View-only by default on the public URL (session + snapshot + SSE). Credentials are for identity / proximity later.

## What this is not

- Not a new world, session store, or player-chain authority. The 3D client does not host occupancy.
- Not a canvas on Agent Play `/`. The home page at `world1.v0peer.org` / agent-play.com stays the 2D game.
- Not a native Godot 4 desktop binary in v1. Vulkan / Godot desktop is later and optional.
- Not AQL. Query and authoring stay on the host (`/playground`, `/agent-playground/aql`).
- Not geography-mesh v1. Low-latency human pose mesh is a later presence layer, not the durable snapshot.
- Not `POST /api/agents` as an identity API. Agent identities come from `create-agent-node` (`POST /api/nodes/agent-node`).
- Not tool-derived map buildings. `chat_tool` / `assist_*` are proximity/watch UI only (world map v3).

## Origins

| Origin | Role |
|--------|------|
| `https://world2.v0peer.org` | World 2 3D page (this repo). Canvas at `/`. |
| `https://world1.v0peer.org` | Main World 2D game + occupancy APIs (`/api/agent-play/...`). |
| `https://agent-play.com` | Marketing / same Agent Play deployment aliases. Not the 3D origin. |

A later follow-up (in Agent Play, not this repo) can add a footer or worlds nav link from the 2D site to World 2. Do not require changing the Agent Play home page to ship World 2.

## Status

This repository currently holds **planning docs**. There is no `web/` app, no Three.js project, and no `npm` link to Agent Play yet.

Do not expect a “run the game” section until code exists.

## Docs

| Doc | Contents |
|-----|----------|
| [docs/architecture.md](docs/architecture.md) | Split origin, CORS, data flow, planned `protocol/` + `web/` modules |
| [docs/design.md](docs/design.md) | 2D→3D mapping, occupants, stages, browser input, camera, HUD |
| [docs/world-protocol.md](docs/world-protocol.md) | HTTP/SSE/RPC, CORS, EventSource, default API base |
| [docs/implementation-plan.md](docs/implementation-plan.md) | Phased plan, TDD order, Phase 1 browser slice, non-goals |
| [docs/decisions.md](docs/decisions.md) | ADRs (browser TS v1, split origin, view-only public URL; Godot later) |

Agent Play source of truth lives in the sibling repo:

- Architecture: `../agent-play/docs/architecture.md`
- Occupant Model v1: `../agent-play/docs/occupant-model-v1.md`
- Events / SSE / RPC: `../agent-play/docs/events-sse-and-remote.md`
- 2D client / split-origin: `../agent-play/docs/play-ui.md`
- Bounds: `../agent-play/packages/sdk/src/lib/world-bounds.ts`

## First implementation rule

Protocol parsing and 2D→3D mapping tests come **before** a 3D canvas. See [docs/implementation-plan.md](docs/implementation-plan.md).
