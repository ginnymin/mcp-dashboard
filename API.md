# API Reference

The API runs on **port 3001** (started by `npm run dev`). It's read-only and serves the seeded data described below.

## The Data Model

The data is hierarchical:

- **Servers** — MCP servers a customer has connected. The service is a gateway, so each server carries two kinds of configuration:
  - A **source**: GitHub, GitLab, Bitbucket, or a locally uploaded build — with metadata that differs by type
  - Optional **governance add-ons**: authentication, audit logging, rate limiting — enabled per server
- **Deployments** — versioned rollouts of a server, each with build info and its own **tool catalog** (the tools the deployment exposes, which can change between versions)
- **Sessions** — a single MCP client connection to a deployment. Each session starts with `initialize`, then `tools/list`, then a series of `tools/call` requests
- **Logs** — individual JSON-RPC requests within a session: method, tool name, status, latency, request/response/error bodies

There are **two event streams**: traffic logs (every JSON-RPC request) and audit events (governance activity — deploys, key rotations, policy changes — for servers with audit logging enabled).

## Endpoints

| Endpoint                           | Returns                                                                                                                          |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/servers`                 | All servers, with summary counts                                                                                                 |
| `GET /api/servers/:id`             | A single server                                                                                                                  |
| `GET /api/servers/:id/deployments` | Deployments for a server                                                                                                         |
| `GET /api/servers/:id/stats`       | Request/error/latency aggregates, by tool and by deployment (`since`)                                                            |
| `GET /api/servers/:id/audit`       | Audit events for a server (`eventType`, `since`, `until`)                                                                        |
| `GET /api/deployments/:id`         | A single deployment with its tool catalog                                                                                        |
| `GET /api/sessions`                | Sessions (`serverId`, `deploymentId`, `clientName`, `status`, `since`, `until`, `limit`, `offset`)                               |
| `GET /api/sessions/:id`            | A single session with its logs in order                                                                                          |
| `GET /api/logs`                    | Logs (`serverId`, `deploymentId`, `sessionId`, `toolName`, `status`, `errorCode`, `method`, `since`, `until`, `limit`, `offset`) |
| `GET /api/logs/:id`                | A single log with full request/response bodies                                                                                   |

Query params in parentheses are optional filters; timestamps (`since`/`until`) are ISO-8601.

## Conventions

- **List endpoints** return `{ data: [...], total: <number> }`; detail endpoints return the object directly
- **Pagination**: `limit` (default 100, max 500) and `offset` on sessions and logs
- **Request/response bodies** are only served by `GET /api/logs/:id` — log entries in lists are summaries
- **Missing resources** return `404` with `{ "error": "<message>" }`

## Changing the API

If the API doesn't serve the interface you want to build, change it. You're a full-stack engineer here — the backend is yours too (`server/` is small and readable). Just remember the interface is the deliverable.
