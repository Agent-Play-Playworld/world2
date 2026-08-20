# World 2 world protocol

Wire contract World 2 will speak. Source of truth is Agent Play (`packages/web-ui` routes + `@agent-play/sdk` types). World 2 does not extend this protocol in v1.

**OpenAPI (implement against this):** [`../agent-play/docs/occupancy-v1.openapi.yaml`](../agent-play/docs/occupancy-v1.openapi.yaml) — index [`../agent-play/docs/occupancy-v1.md`](../agent-play/docs/occupancy-v1.md). Occupancy is Agent Play’s. This repo does not duplicate the YAML. GLB / png2glb packs are presentation; instance them from the snapshot this API returns.

**Page origin:** `https://world2.v0peer.org` (3D SPA; no occupancy APIs)

**Default occupancy / API origin:** `https://agent-play.com`

**API prefix:** `/api/agent-play`

Default API base (no trailing slash): **`https://agent-play.com/api/agent-play`**

Next also rewrites `/agent-play/*` → `/api/agent-play/*`. Prefer the `/api/agent-play` paths.

Build-time override (when coding starts): e.g. `VITE_WORLD2_API_BASE`, same idea as play-ui `VITE_PLAY_API_BASE`. Never default the API base to `window.location.origin` — that is World 2 (or worldN), not Main World occupancy.

Aliases of the **same** occupancy deployment: `https://www.agent-play.com`, `https://playworld.world`, and **`https://world1.v0peer.org` while it still exists**. `world1` may be discontinued once world2 / worldN clients exist. Do not treat it as canonical. `https://world2.v0peer.org` and future `worldN.v0peer.org` are never API origins and never valid `serverUrl`.

## Cross-origin (required for v1)

The 3D page is a different origin from the API. Every occupancy call is CORS against **`agent-play.com`**.

### Cookies vs headers

| Secret | How it travels | World 2 v1 |
|--------|----------------|------------|
| `sid` | JSON `{ sid }` then `?sid=` on SSE / mutating RPC | Query + memory / sessionStorage. Not a cookie. |
| Node identity | `x-node-id`, `x-node-passw` | **Not used** on the public URL (view-only). Phase 2+ on `fetch` only. |
| Cookies | unused for occupancy | Do not send `credentials: "include"`. Do not use `EventSource` `withCredentials`. |

play-ui watch already fetches session without credentials. World 2 copies that.

### EventSource

```js
new EventSource(`${API_BASE}/events?sid=${encodeURIComponent(sid)}`);
```

- Native `EventSource` **cannot** set `x-node-*` headers. `sid` stays in the query string.
- Do **not** pass `{ withCredentials: true }` unless the host starts using cookies (it does not).
- Cross-origin EventSource works when the SSE response includes `Access-Control-Allow-Origin` matching `https://world2.v0peer.org` (or `*` for non-credentialed requests).
- `fetch` + `ReadableStream` is an alternative if we later need headers on the stream. Phase 1 should match play-ui: `EventSource`. Protocol tests still parse `event:` / `data:` / `: ping` lines independently of the transport.

### Host CORS that must exist before the public URL works

play-ui documents split origin (`../agent-play/docs/play-ui.md`): the API must send CORS on the routes the UI calls. Today Main World already CORS-allows `*` on **proximity-action** and geography. As of this planning pass, **session, sdk/rpc, events, and snapshot do not**.

World 2 Phase 1 needs Agent Play on **`agent-play.com`** to add CORS (and `OPTIONS` where browsers preflight POST) on at least:

- `GET /api/agent-play/session`
- `POST /api/agent-play/sdk/rpc` (and allow `Content-Type`)
- `GET /api/agent-play/events` (SSE — `Access-Control-Allow-Origin` on the stream response)
- optional compatibility `GET /api/agent-play/snapshot`

View-only can use `*` **or** an allowlist of `https://world2.v0peer.org`. Once `x-node-*` headers exist, allowlist the World 2 origin and list those headers; `*` cannot be used with `Access-Control-Allow-Credentials: true`. Prefer still **not** using cookies.

This is host work in **agent-play**. Recorded here so World 2 does not ship a canvas that cannot talk to Main World.

### Logging

`sid` must not appear in full in client logs, HUD (prefix only), or analytics. SSE URLs contain `?sid=`; treat them as sensitive.

## Identity

### `credentials.json` (Phase 2+; not required for the public URL)

CLI / SDK file (typically `~/.agent-play/credentials.json`, override `AGENT_PLAY_CREDENTIALS_PATH`). In the browser, the same JSON is loaded via file picker / stored copy — there is no desktop filesystem in v1.

```json
{
  "serverUrl": "https://agent-play.com",
  "nodeId": "<main node id>",
  "passw": "<ten-word passphrase>",
  "agentNodes": [
    { "nodeId": "<agent node id>", "passw": "<phrase>", "createdAt": "<iso>" }
  ]
}
```

New files set `serverUrl` to **`https://agent-play.com`**.

`passw` is human-readable. Never send it on the wire.

Hash locally with `nodeCredentialsMaterialFromHumanPassphrase` from `@agent-play/node-tools` (same hex material as `hashNodePassword` on the normalized phrase). Send:

| Header | Value |
|--------|--------|
| `x-node-id` | `nodeId` |
| `x-node-passw` | hashed material, **not** the phrase |

The server compares the header to the stored hash and does not hash again.

Optional `POST /api/nodes/validate` body: `{ "nodeId": "<same as header>" }`. Mismatch between body and `x-node-id` → 400.

**Restore canonicalization (intended policy).** Treat these hosts as the same occupancy deployment and canonicalize **to** `agent-play.com`:

- `agent-play.com` (already canonical)
- `www.agent-play.com`
- `playworld.world`
- `world1.v0peer.org` (disposable alias; may be discontinued)

`world2.v0peer.org` and `worldN.v0peer.org` are **not** valid `serverUrl` values for occupancy. Refuse them.

**Current play-ui code** still canonicalizes aliases **to** `world1.v0peer.org` and lists `agent-play.com` as a legacy name. That is leftover. World 2 implements the intended policy. Agent Play restore should flip when production host constants change. See ADR-012.

### Agent identities

- Create with `npx agent-play create-agent-node` → `POST /api/nodes/agent-node`.
- **`POST /api/agents` does not create agent identities** (deprecated; returns that message).
- Map occupancy for an agent is `world.addPlayer` / `POST /api/agent-play/players` from a **host process**, not from World 2 v1.
- Agent heartbeat: `POST /api/agent-play/players/heartbeat?sid=` with **agent** node headers. World 2 is a human viewer, not an agent host.

## Session / `sid`

```http
GET /api/agent-play/session
```

Response: `{ "sid": "<session id>" }`

SDK `RemotePlayWorld.connect` may send main-node headers on this GET after validate. play-ui `ensurePreviewSessionId` fetches it without credentials, then persists to sessionStorage.

World 2 (view-only public URL):

1. Load API origin (default **`https://agent-play.com`**, **not** the page origin).
2. `GET https://agent-play.com/api/agent-play/session` via CORS `fetch`, `credentials: "omit"`.
3. Store `sid` (sessionStorage). HUD shows a prefix only. HUD also shows page origin vs server origin `agent-play.com`.
4. Reconcile if a stored sid disagrees with the server (replace local copy).

Do not require credentials for this path. Optional validate + node headers is Phase 2+.

`sid` is required on SSE and on **mutating** RPC. It is **not** required on `getWorldSnapshot` or `getPlayerChainNode`.

Invalid/missing `sid` on mutating RPC or SSE → 400/403.

## Snapshot

### Preferred read

```http
POST /api/agent-play/sdk/rpc
Content-Type: application/json
```

```json
{ "op": "getWorldSnapshot", "payload": {} }
```

Response:

```json
{
  "snapshot": {
    "sid": "<sid>",
    "worldMap": {
      "bounds": { "minX": 0, "minY": 0, "maxX": 19, "maxY": 9 },
      "occupants": []
    },
    "worldLayout": {
      "rev": 1,
      "bounds": { "minX": 0, "minY": 0, "maxX": 19, "maxY": 9 },
      "zones": [],
      "streets": []
    },
    "spaces": [],
    "mcpServers": [],
    "parkingStreet": {},
    "houseStreet": {}
  }
}
```

`worldLayout`, `spaces`, `mcpServers`, `parkingStreet`, and `houseStreet` are optional at the type level but parking and houses are live product surfaces: keep them. Occupants are the spatial source of truth for agents, humans, structures, and legacy mcp. Cars and houses are **not** in `worldMap.occupants`. There is no top-level `players` array (world map v3).

### Load sequence (client)

Protocol tests first, then canvas:

1. GET session on **agent-play.com**
2. POST `getWorldSnapshot`
3. Parse bounds and occupants (and layout / parking / houses when present)
4. Ground from snapshot bounds
5. Stand-in or kit meshes at `(x, y) → (X, 0, Z)`
6. EventSource `/events?sid=`
7. Merge player-chain nodes or refetch snapshot

No human-move RPC. Local `__human__` pawn. See [architecture.md](architecture.md).

### Compatibility GET

```http
GET /api/agent-play/snapshot?sid=<sid>
```

Returns the snapshot object **unwrapped** (not `{ snapshot: ... }`). Requires `sid`. World 2 should still prefer RPC so it matches play-ui and the SDK.

### Occupant shapes (SDK mental model)

Use `type` unions, not parallel interfaces:

```ts
type AgentPlayWorldMapBounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

type AgentPlayWorldMapHumanOccupant = {
  kind: "human";
  id: string;
  name: string;
  x: number;
  y: number;
  interactive?: boolean;
};

type AgentPlayWorldMapAgentOccupant = {
  kind: "agent";
  agentId: string;
  name: string;
  x?: number;
  y?: number;
  nodeId?: string;
  streetId?: string;
  platform?: string;
  toolNames?: string[];
  assistToolNames?: string[];
  hasChatTool?: boolean;
  stationary?: boolean;
};

type AgentPlayWorldMapMcpOccupant = {
  kind: "mcp";
  id: string;
  name: string;
  x: number;
  y: number;
  url?: string;
};

type AgentPlayWorldMapStructureOccupant = {
  kind: "structure";
  id: string;
  name: string;
  x: number;
  y: number;
  worldId: string;
  spaceIds: string[];
  gameId?: string;
  stationary?: boolean;
  primaryAmenity?: "supermarket" | "shop" | "car_wash";
  amenities?: Array<"supermarket" | "shop" | "car_wash">;
};
```

Parser rules World 2 tests must copy:

- Human / mcp / structure: require numeric `x`, `y`.
- Agent: require `agentId`, `name`; snapshot ingest on the SDK also requires coordinates and unique cells.
- Structure: nonempty `spaceIds` **or** a valid `gameId` (`hidden-gems`, `map-recall`, `price-check`, `signal-hunt`, `delivery-dash`, `lease-locker`, `talk-timer`, `daily-rotator`).
- Legacy agent field `agentType` maps to `platform`.

## Live SSE

```http
GET /api/agent-play/events?sid=<sid>
```

- `Content-Type: text/event-stream`
- Keepalive: `: ping` every 30s
- Named events; JSON in `data:`
- Cross-origin from `world2.v0peer.org`; CORS on this response is required
- Browser client: `EventSource` without `withCredentials`

| SSE `event` | Phase 1 | Meaning |
|-------------|---------|---------|
| `world:agent_signal` | yes | Metadata / proximity signals; often carries `playerChainNotify` |
| `world:player_added` | yes | New agent; same incremental path + optional join toast later |
| `world:journey` | optional | Journey + `path`; not occupancy authority |
| `world:interaction` | later | Chat/tool lines |
| `world:geography` | **not v1** | Geography presence fanout |
| `world:intercom` | later | World chat / notifications |
| `world:peer-call-state` | later | Peer voice state |
| `world:peer-call-signal` | later | WebRTC signal for voice (not geography PC) |
| `world:space_transition` | later | Enter space |
| `space:amenity_content_updated` | later | Shop/supermarket/car-wash catalog change |

Incremental path (must match play-ui / SDK):

1. Parse `playerChainNotify` from the event payload (`updatedAt`, `nodes[]` with `stableKey`, `leafIndex`, optional `removed`).
2. If `nodes` nonempty and a local snapshot exists: `sortNodeRefsForSerializedFetch` (removed descending `leafIndex`, then updates ascending), fetch each `getPlayerChainNode` **in order**, merge.
3. Cap fetches (play-ui: 102).
4. Else or on failure: `getWorldSnapshot`.

```json
{ "op": "getPlayerChainNode", "payload": { "stableKey": "agent:..." } }
```

No `sid` query. Response `{ "node": ... }`.

Stable keys:

- `__genesis__`
- `__header__` (includes `sid` + bounds)
- Occupants: `human:<id>`, `agent:<nodeId>:<agentId>`, `structure:<id>`, `mcp:<id>`
- Geography humans (later): `human:<id>` via a separate geography path — do not depend on this for v1
- Spaces: space catalog leaves exist on the chain; merge when present

Node kinds: `genesis`, `header`, occupant present/removed, space present/removed.

## RPC: first slice vs later

All mutating ops: `POST /api/agent-play/sdk/rpc?sid=<sid>` with `{ "op", "payload" }`.

Reads without `sid`: `getWorldSnapshot`, `getPlayerChainNode`.

### First slice (World 2 v1)

| Op / route | Auth | Notes |
|------------|------|--------|
| `GET /session` | none (view-only) | Obtain `sid`; CORS `fetch` from world2 to **agent-play.com** |
| `getWorldSnapshot` | optional | Full occupancy |
| `GET /events?sid=` | `sid` | Live fanout via `EventSource` |
| `getPlayerChainNode` | optional | Incremental merge |

**No human-move RPC.** play-ui locomotion is local. Do not POST a fake `move` op.

**No credentials required** for the public 3D URL.

### Later (same host, not Phase 1)

Proximity (not SDK RPC):

```http
POST /api/agent-play/proximity-action?sid=<sid>
Content-Type: application/json
```

```json
{
  "fromPlayerId": "__human__",
  "toPlayerId": "<agentId>",
  "action": "assist"
}
```

`action`: `assist` \| `chat` \| `zone` \| `yield` only. Human→human throws on the host.

This route already sends `Access-Control-Allow-Origin: *` and answers `OPTIONS`.

SDK RPC ops (non-exhaustive; see `packages/web-ui/src/app/api/agent-play/sdk/rpc/route.ts`):

| Op | Role |
|----|------|
| `createHumanNode` | Register main node material |
| `intercomCommand` / `intercomResponse` | Agent intercom |
| `worldChatPublish` / `worldChatReact` / `worldChatHistory` | World chat |
| `recordInteraction` / `recordJourney` | Agent host writes |
| `createSpace` / amenity item add-remove | Privileged / space-node + often `x-agent-service-key` |
| `inspectSpace` / `inspectAmenity` | Catalog + logs |
| `enterSpace` / `enterAmenity` | Stage transitions (`enterAmenity` is audit) |
| `getPlayerWallet` / `listPurchases` / `purchase` / `redeemWalletBundle` | Wallet |
| `buyParkingTicket` / `buyHouse` | Overworld spends |
| `getGameStats` / `applyGameOutcome` | Arcade; PU from `computeEventPuDelta` |
| `talkSessionStart` / `Tick` / `Stop` | Billed agent talk |
| `peerTalkSession*` / `peerCallInvite` / `Accept` / `Decline` / `Hangup` | Peer voice |

Geography (later, not durable snapshot):

- `POST /api/agent-play/geography/membership?sid=`
- `POST /api/agent-play/geography/coarse?sid=` `{ humanId, x, y, stage? }`
- `POST /api/agent-play/geography/signal?sid=`

## What World 2 will not call in v1

- AQL HTTP (`/api/aql` or playground CONNECT) — AQL stays on the host UI
- `POST /api/agents` create
- Redis
- Engine or web multiplayer as occupancy (`ENet`, Colyseus, engine peers)
- Featured-arcade scoring shortcuts
- Tool-sync / `world:structures` (removed in world map v3)
- Occupancy APIs on `world2.v0peer.org` itself
- Occupancy APIs on any `worldN.v0peer.org` page origin
