# Agent Play World 2

World 2 is a **Godot 4 desktop 3D client** for the same live Agent Play world that the Pixi.js 2D client already shows.

It is another camera on Main World. It is not a second occupancy server, not a Vulkan product, and not a replacement for the Agent Play home page.

Legal entity: **Viroke Technologies Inc** (a Delaware US corporation). Agent Play is early OSS. This repo is planning documentation only until implementation starts.

## What this is

- A native Godot 4 client (desktop first) that talks to the existing Agent Play host.
- Same snapshot, same SSE fanout, same RPC mutations as `@agent-play/play-ui`.
- Same Occupant Model v1: `human`, `agent`, `structure` (spaces and Maple Ave arcade cabinets). Legacy `mcp` rows may still appear.
- Same Main World origin: `https://world1.v0peer.org`.

## What this is not

- Not a new world, session store, or player-chain authority. Godot does not host occupancy.
- Not WebGPU inside `packages/web-ui`. The Agent Play home page stays the 2D game.
- Not AQL. Query and authoring stay on the host (`/playground`, `/agent-playground/aql`).
- Not geography-mesh v1. Low-latency human pose mesh is a later presence layer, not the durable snapshot.
- Not mobile export in the first implementation phase.
- Not `POST /api/agents` as an identity API. Agent identities come from `create-agent-node` (`POST /api/nodes/agent-node`).
- Not tool-derived map buildings. `chat_tool` / `assist_*` are proximity/watch UI only (world map v3).

## Status

This repository currently holds **planning docs**. There is no Godot project, no runnable game, and no `npm` link to Agent Play yet.

Do not expect a “run the game” section until code exists.

## Docs

| Doc | Contents |
|-----|----------|
| [docs/architecture.md](docs/architecture.md) | System context, data flow, planned Godot module boundaries |
| [docs/design.md](docs/design.md) | 2D→3D mapping, occupants, stages, input, camera, HUD, failure modes |
| [docs/world-protocol.md](docs/world-protocol.md) | Exact HTTP/SSE/RPC World 2 will call |
| [docs/implementation-plan.md](docs/implementation-plan.md) | Phased plan, TDD order, Phase 1 slice, non-goals |
| [docs/decisions.md](docs/decisions.md) | ADRs (Godot 4, client-not-server, desktop first, GDScript vs C#) |

Agent Play source of truth lives in the sibling repo:

- Architecture: `../agent-play/docs/architecture.md`
- Occupant Model v1: `../agent-play/docs/occupant-model-v1.md`
- Events / SSE / RPC: `../agent-play/docs/events-sse-and-remote.md`
- 2D client: `../agent-play/docs/play-ui.md`
- Bounds: `../agent-play/packages/sdk/src/lib/world-bounds.ts`

## First implementation rule

Protocol parsing and 2D→3D mapping tests come **before** Godot scenes. See [docs/implementation-plan.md](docs/implementation-plan.md).
