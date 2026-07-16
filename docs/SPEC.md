# MCP Observability Dashboard — Frontend Spec

## 1. Overview

### 1.1 Purpose

Platform for deploying and managing MCP (Model Context Protocol) servers. This frontend is an **observability dashboard** that helps developers answer:

1. **Is my MCP server healthy?** (errors, latency, traffic)
2. **What broke?** (failed calls, error payloads, which tool/deployment)
3. **Where in the flow did it fail?** (session lifecycle: `initialize` → `tools/list` → `tools/call`)
4. **What changed?** (deployments, tool catalog, audit events)

The product should feel like **distributed tracing + API explorer** for JSON-RPC MCP traffic—not a generic admin panel.

### 1.2 Target user

A **product engineer or backend developer** debugging their own MCP server integration: tracing client sessions, inspecting request/response bodies, correlating failures with deployments, and reviewing governance activity.

### 1.3 Design principles

- **Simplest navigation first** — two primary destinations; depth via drill-down, not more top-level items.
- **Hierarchy matches the domain** — Server → Deployment → Session → Log, even when surfacing global views.
- **Short debug loops** — error in summary → failing tool → session → JSON-RPC payload in ≤4 clicks.
- **Shareable state** — filters and selection live in the URL.
- **Functional and approachable** — obvious affordances, scannable tables, readable JSON.

### 1.4 Out of scope (v1)

- Write/mutate operations (API is read-only).
- Real-time streaming / live tail (use time-filtered refresh or manual reload).
- Auth / multi-tenant UI (assumed single workspace from seeded data).
- Exhaustive analytics dashboards (sparklines and summary stats only).

---

## 2. Data model (API)

The API runs on **port 3001**. All list endpoints return `{ data: [...], total: number }`; detail endpoints return the object directly.

### 2.1 Hierarchy

```
Server
 └── Deployment (versioned rollout + tool catalog)
      └── Session (single MCP client connection)
           └── Log (individual JSON-RPC request)
```

### 2.2 Secondary stream

**Audit events** — governance activity (deploys, key rotations, policy changes) for servers with audit logging enabled. Not nested under sessions; scoped to a server.

### 2.3 Key entities

| Entity          | Notable fields / behavior                                                                       |
| --------------- | ----------------------------------------------------------------------------------------------- |
| **Server**      | Source (GitHub, GitLab, Bitbucket, local upload); optional governance (auth, audit, rate limit) |
| **Deployment**  | Build/version info; **tool catalog** (can differ per deployment)                                |
| **Session**     | Client name, status, deployment; logs returned in order on detail fetch                         |
| **Log**         | Method, tool name, status, latency; **full bodies only on detail endpoint**                     |
| **Audit event** | `eventType`, timestamp; filterable by type and time range                                       |

### 2.4 Endpoints

| Endpoint                                                                                                             | Use                                |
| -------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `GET /api/servers`                                                                                                   | Server list with summary counts    |
| `GET /api/servers/:id`                                                                                               | Server detail                      |
| `GET /api/servers/:id/deployments`                                                                                   | Deployments for a server           |
| `GET /api/servers/:id/stats?since=`                                                                                  | Aggregates by tool and deployment  |
| `GET /api/servers/:id/audit?eventType=&since=&until=`                                                                | Audit timeline                     |
| `GET /api/deployments/:id`                                                                                           | Deployment + tool catalog          |
| `GET /api/sessions?serverId=&deploymentId=&clientName=&status=&since=&until=&limit=&offset=`                         | Session search                     |
| `GET /api/sessions/:id`                                                                                              | Session + ordered logs             |
| `GET /api/logs?serverId=&deploymentId=&sessionId=&toolName=&status=&errorCode=&method=&since=&until=&limit=&offset=` | Log search                         |
| `GET /api/logs/:id`                                                                                                  | Full request/response/error bodies |

**Pagination:** `limit` (default 100, max 500), `offset` on sessions and logs.
**Timestamps:** ISO-8601 for `since` / `until`.

---

## 3. Information architecture

### 3.1 Primary navigation (sidebar)

| #   | Label       | Route   | Role                                               |
| --- | ----------- | ------- | -------------------------------------------------- |
| 1   | **Servers** | `/`     | Home: inventory, health, entry into server context |
| 2   | **Logs**    | `/logs` | Global log search and error hunting                |

**Future (optional):** add **Sessions** (`/sessions`) as a third primary item for trace-first workflows without opening a server first. v1 does not include this; server-scoped Sessions tab covers the need.

### 3.2 Server-scoped sub-navigation (tabs)

When viewing a server (`/servers/:serverId/...`), show horizontal tabs:

| Tab             | Route suffix                            | Purpose                                                        |
| --------------- | --------------------------------------- | -------------------------------------------------------------- |
| **Overview**    | `/overview` (or default `/servers/:id`) | Health, stats, shortcuts                                       |
| **Deployments** | `/deployments`                          | Versions, tool catalogs                                        |
| **Sessions**    | `/sessions`                             | Sessions for this server                                       |
| **Audit**       | `/audit`                                | Governance timeline (hide or show disabled state if audit off) |

### 3.3 Drill-down routes (no sidebar items)

| Route                                          | View                                    |
| ---------------------------------------------- | --------------------------------------- |
| `/servers/:serverId/deployments/:deploymentId` | Deployment detail + tool catalog        |
| `/servers/:serverId/sessions/:sessionId`       | Session timeline                        |
| `/logs/:logId`                                 | Log detail (or drawer over parent list) |

### 3.4 Navigation diagram

```
[Sidebar]
  Servers ──► Server Overview
                  ├── Deployments ──► Deployment Detail
                  ├── Sessions ─────► Session Timeline ──► Log Detail
                  └── Audit
  Logs ─────────► Log Search ───────► Log Detail
                      ▲
                      └── deep links from anywhere (with filters in URL)
```

### 3.5 Context preservation rules

- Navigating from a server tab to **Logs** carries `serverId` (and optionally `deploymentId`, `sessionId`) as query params.
- Breadcrumbs on all drill-down views: `Servers > {Server} > {Deployment|Session|Log}`.
- Back navigation returns to the filtered list, not an unfiltered global view.

---

## 4. Views — detailed spec

### 4.1 Servers (home) — `/`

**Goal:** At-a-glance health and entry point into debugging.

**Layout:**

- Page header: “Servers” + global time range selector (default: last 24h; presets: 1h, 24h, 7d).
- Table or card list of all servers.

**Per server row/card:**

- Name (link to server overview)
- Source type icon/label (GitHub, GitLab, Bitbucket, local)
- Governance badges: Auth, Audit, Rate limit (only if enabled)
- Summary metrics from list endpoint (request count, error count or rate if available)
- Optional: mini sparkline or error-rate indicator if stats are cheap to fetch; otherwise defer to server overview

**Interactions:**

- Click row → `/servers/:id`
- Sort by name, error rate, or request volume (client-side if API doesn’t support sort)

**Empty state:** “No servers connected” with note to run seed if applicable.

---

### 4.2 Server — Overview tab — `/servers/:serverId`

**Goal:** Single place to understand server health and jump into debugging.

**Header:**

- Server name
- Source metadata (repo URL, branch, etc. per source type)
- Governance configuration summary

**Health strip** (from `GET /api/servers/:id/stats?since=`):

- Total requests
- Error rate (%)
- p50 / p95 latency

**Sections:**

1. **Errors needing attention** (optional v1.1)
   - Last N failed logs for this server (`GET /api/logs?serverId=&status=error&limit=10`)
   - Each row links to log detail

2. **Stats breakdown**
   - **By tool:** table — tool name, requests, errors, avg/p95 latency
   - **By deployment:** table — deployment version/label, requests, errors, latency
   - Row click → filter Sessions or Logs for that tool/deployment

3. **Recent sessions**
   - Last 10 sessions (`GET /api/sessions?serverId=&limit=10`)
   - Link: “View all” → server Sessions tab

4. **Quick links**
   - View deployments
   - Search logs (opens `/logs?serverId=...`)
   - View audit (if enabled)

---

### 4.3 Server — Deployments tab — `/servers/:serverId/deployments`

**Goal:** See what versions exist and what tools each exposes.

**Deployments table:**

- Version / build label
- Created or deployed at
- Relative traffic or error share (from stats if available)
- Status indicator
- Row click → deployment detail

**Deployment detail** — `/servers/:serverId/deployments/:deploymentId`:

- Build metadata
- **Tool catalog** table: tool name, description/schema if present
- Stats slice for this deployment (link to filtered logs)
- **“View sessions”** → server Sessions tab with `deploymentId` filter
- **“View logs”** → `/logs?serverId=&deploymentId=`

**Nice-to-have (post-v1):** highlight tool catalog diff vs previous deployment.

---

### 4.4 Server — Sessions tab — `/servers/:serverId/sessions`

**Goal:** Find and open client connection traces.

**Filters bar** (synced to URL):

- Deployment (dropdown)
- Client name (text)
- Status
- Time range (`since` / `until`)

**Sessions table:**

- Started at
- Client name
- Deployment version
- Status
- Duration (if derivable)
- Log count or error count (if available on summary)
- Row click → session timeline

**Pagination:** load more or offset-based pages; show `total`.

---

### 4.5 Session timeline — `/servers/:serverId/sessions/:sessionId`

**Goal:** Primary “trace” view — ordered MCP lifecycle.

**Header:**

- Session ID (truncated + copy)
- Client name
- Deployment version (link)
- Status, start/end time
- Breadcrumb back to Sessions tab (preserve filters)

**Timeline (vertical):**
Each log entry shows:

- Timestamp
- Method badge: `initialize` | `tools/list` | `tools/call`
- Tool name (when applicable)
- Status (success / error)
- Latency
- Expand or click → log detail

**Visual treatment:**

- Failed steps: distinct error styling
- Optional phase grouping labels for the three MCP phases

**Interactions:**

- Click log → log detail (drawer preferred to keep timeline visible)
- “View in Logs” → `/logs?sessionId=...`

---

### 4.6 Logs (global) — `/logs`

**Goal:** Cross-server search; default entry for “something failed somewhere.”

**Filters bar** (all optional, URL-synced):

- Server
- Deployment (dependent on server)
- Session ID
- Tool name
- Method
- Status
- Error code
- Time range

**Default on first visit:** last 24h; consider highlighting errors (sort or subtle filter chip “Errors only”).

**Results table:**

- Timestamp
- Server name
- Deployment (short)
- Method
- Tool name
- Status
- Latency
- Session link
- Row click → log detail

**Pagination:** `limit` / `offset` or infinite scroll; display `total`.

**Clear distinction from Sessions (for future nav item):**

- **Logs** = searchable event index
- **Sessions** = ordered connection trace

---

### 4.7 Log detail — `/logs/:logId` (or slide-over drawer)

**Goal:** Inspect exact JSON-RPC payloads.

**Summary panel:**

- Log ID, timestamp
- Method, tool name, status, latency, error code
- Links: parent session, server, deployment
- Copy link button

**Body panels** (from `GET /api/logs/:id`):

- Request JSON (pretty-printed, monospace)
- Response JSON or Error JSON (conditional on status)
- Expand/collapse sections; copy to clipboard

**Presentation:** side-by-side on wide screens; stacked on narrow.

---

### 4.8 Server — Audit tab — `/servers/:serverId/audit`

**Goal:** Governance and change history.

**Visibility:** Show tab only if server has audit logging enabled; otherwise hide or show empty state with explanation.

**Filters:**

- Event type
- Time range

**Timeline list:**

- Timestamp
- Event type
- Human-readable summary (from event payload)
- Optional: “View traffic around this time” → Logs with `since`/`until` window ±15m

---

## 5. Cross-cutting UX

### 5.1 Time range

- Global control in app header or per-page; default **last 24 hours**.
- Presets: 1h, 24h, 7d, custom range.
- Applied to stats, session lists, log lists, and audit where `since`/`until` are supported.

### 5.2 URL state

Encode filters in query strings, e.g.:

```
/logs?serverId=abc&status=error&toolName=search&since=2026-06-16T00:00:00Z
/servers/abc/sessions?deploymentId=def&status=active
```

Enables shareable debug links.

### 5.3 Master–detail pattern

- Prefer **drawer or split panel** for log detail when opened from a list or timeline.
- Full-page log detail is acceptable for direct URL visits.

### 5.4 Loading, empty, and error states

- Skeleton loaders for tables.
- Empty: contextual copy (“No errors in this time range” vs “No sessions match filters”).
- API errors: inline message with retry; 404 on detail routes → friendly not-found.

### 5.5 Visual language

- **Method badges** with consistent colors for `initialize`, `tools/list`, `tools/call`.
- **Status:** success (neutral/green), error (red).
- **Latency:** warn threshold optional (e.g. >1s) for scanability.
- Dark-friendly theme; JSON in monospace with syntax highlighting.

---

## 6. Feature priority (implementation order)

### P0 — Must ship

1. Servers list (home)
2. Server overview with stats (by tool, by deployment)
3. Server Deployments tab + deployment detail with tool catalog
4. Server Sessions tab + session timeline
5. Global Logs search with filters
6. Log detail with full JSON bodies
7. URL-persisted filters and breadcrumbs

### P1 — High value, soon after

8. Server Audit tab
9. Error shortcuts on server overview (recent failed logs)
10. Log detail as drawer from lists/timeline
11. Copy link / copy JSON actions

### P2 — Polish / future

12. **Sessions** as third primary nav item (`/sessions`)
13. Tool catalog diff between deployments
14. Sparklines on server cards
15. Client-name breakdown in stats
16. Auto-refresh toggle

---

## 7. Technical notes

### 7.1 Stack assumptions

- Frontend scaffold on port **3000**; API on **3001**.
- Node 22–25; `npm install && npm run seed && npm run dev` must work from a fresh clone.

### 7.2 Data fetching

- Fetch detail bodies only when opening log detail (list endpoints are summaries).
- Paginate sessions and logs; avoid loading unbounded lists.
- Server stats: single call per overview with `since` aligned to UI time range.

### 7.3 Backend changes

Allowed if the UI needs it (`server/` is small). Prefer adapting the API over awkward client workarounds. The interface is the deliverable.

### 7.4 Suggested route map

```
/                                    → Servers list
/servers/:serverId                   → Server overview (default tab)
/servers/:serverId/deployments       → Deployments list
/servers/:serverId/deployments/:id   → Deployment detail
/servers/:serverId/sessions          → Sessions list
/servers/:serverId/sessions/:id      → Session timeline
/servers/:serverId/audit             → Audit timeline
/logs                                → Global log search
/logs/:logId                         → Log detail
```

---

## 8. Success criteria

A developer using the dashboard can:

1. See which servers are unhealthy within seconds of landing.
2. Identify the worst-performing tool or deployment from server stats.
3. Open a session and follow the MCP call sequence in order.
4. Inspect the full request/response of a failed `tools/call`.
5. Share a URL that reproduces the same filtered log view.
6. Review deploy and governance events for audited servers.

---

## 9. Future extension: Sessions in primary nav

Add when trace-first access outweighs simplicity:

| Label        | Route       | Behavior                                                                                     |
| ------------ | ----------- | -------------------------------------------------------------------------------------------- |
| **Sessions** | `/sessions` | Global session list (same filters as server tab, plus server column); row → session timeline |

Implementation: reuse the server Sessions tab table component with `serverId` optional in filters. Primary nav becomes **Servers · Sessions · Logs**.
