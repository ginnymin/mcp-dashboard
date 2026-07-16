import { http, HttpResponse } from "msw";
import auditEventsFixture from "./fixtures/audit-events.json";
import deploymentDetailFixture from "./fixtures/deployment-detail.json";
import deploymentsFixture from "./fixtures/deployments.json";
import logDetailFixture from "./fixtures/log-detail.json";
import logsFixture from "./fixtures/logs.json";
import serverDetailFixture from "./fixtures/server-detail.json";
import serverStatsFixture from "./fixtures/server-stats.json";
import serversFixture from "./fixtures/servers.json";
import sessionDetailFixture from "./fixtures/session-detail.json";
import sessionsFixture from "./fixtures/sessions.json";

const matchesRegexFilter = (pattern: string, value: string | null) => {
  if (!value) {
    return false;
  }

  try {
    return new RegExp(pattern, "i").test(value);
  } catch {
    return false;
  }
};

const ONE_HOUR_MS = 60 * 60 * 1000;
const ONE_DAY_MS = 24 * ONE_HOUR_MS;
const PRESET_TOLERANCE_MS = 60_000;

const mockErrorRateForRange = (
  since: string | null,
  until: string | null,
): number => {
  if (!since || !until) {
    return 1.25;
  }

  const durationMs = Date.parse(until) - Date.parse(since);

  if (Number.isNaN(durationMs)) {
    return 1.25;
  }

  if (durationMs <= ONE_HOUR_MS + PRESET_TOLERANCE_MS) {
    return 0.45;
  }

  if (durationMs <= ONE_DAY_MS + PRESET_TOLERANCE_MS) {
    return 1.25;
  }

  return 4.8;
};

export const handlers = [
  http.get("/api/servers", ({ request }) => {
    const url = new URL(request.url);
    const since = url.searchParams.get("since");
    const until = url.searchParams.get("until");
    const errorRate = mockErrorRateForRange(since, until);

    return HttpResponse.json({
      ...serversFixture,
      data: serversFixture.data.map((server) => ({
        ...server,
        error_rate_24h: errorRate,
      })),
    });
  }),

  http.get("/api/servers/:id", ({ params }) => {
    if (params.id !== serverDetailFixture.id) {
      return HttpResponse.json({ error: "Server not found" }, { status: 404 });
    }

    return HttpResponse.json(serverDetailFixture);
  }),

  http.get("/api/servers/:id/deployments", ({ params }) => {
    if (params.id !== serverDetailFixture.id) {
      return HttpResponse.json({ error: "Server not found" }, { status: 404 });
    }

    return HttpResponse.json(deploymentsFixture);
  }),

  http.get("/api/servers/:id/stats", ({ params }) => {
    if (params.id !== serverDetailFixture.id) {
      return HttpResponse.json({ error: "Server not found" }, { status: 404 });
    }

    return HttpResponse.json(serverStatsFixture);
  }),

  http.get("/api/servers/:id/audit", ({ params, request }) => {
    if (params.id !== serverDetailFixture.id) {
      return HttpResponse.json({ error: "Server not found" }, { status: 404 });
    }

    const url = new URL(request.url);
    let rows = [...auditEventsFixture.data];
    const eventType = url.searchParams.get("eventType");
    const since = url.searchParams.get("since");
    const until = url.searchParams.get("until");

    if (eventType) {
      rows = rows.filter((event) => event.event_type === eventType);
    }

    if (since) {
      rows = rows.filter((event) => event.ts >= since);
    }

    if (until) {
      rows = rows.filter((event) => event.ts <= until);
    }

    return HttpResponse.json({ data: rows, total: rows.length });
  }),

  http.get("/api/deployments/:id", ({ params }) => {
    if (params.id !== deploymentDetailFixture.id) {
      return HttpResponse.json(
        { error: "Deployment not found" },
        { status: 404 },
      );
    }

    return HttpResponse.json(deploymentDetailFixture);
  }),

  http.get("/api/sessions", ({ request }) => {
    const url = new URL(request.url);
    let rows = [...sessionsFixture.data];

    const serverId = url.searchParams.get("serverId");
    const deploymentId = url.searchParams.get("deploymentId");
    const clientName = url.searchParams.get("clientName");
    const status = url.searchParams.get("status");
    const since = url.searchParams.get("since");
    const until = url.searchParams.get("until");
    const limit = Number(url.searchParams.get("limit") ?? "100");
    const offset = Number(url.searchParams.get("offset") ?? "0");

    if (serverId) {
      rows = rows.filter((session) => session.server_id === serverId);
    }

    if (deploymentId) {
      rows = rows.filter((session) => session.deployment_id === deploymentId);
    }

    if (clientName) {
      rows = rows.filter((session) =>
        matchesRegexFilter(clientName, session.client_name),
      );
    }

    if (status) {
      rows = rows.filter((session) => session.status === status);
    }

    if (since) {
      rows = rows.filter((session) => session.started_at >= since);
    }

    if (until) {
      rows = rows.filter((session) => session.started_at <= until);
    }

    const total = rows.length;
    const data = rows.slice(offset, offset + limit);

    return HttpResponse.json({ data, total });
  }),

  http.get("/api/sessions/:id", ({ params }) => {
    if (params.id !== sessionDetailFixture.id) {
      return HttpResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return HttpResponse.json(sessionDetailFixture);
  }),

  http.get("/api/logs", ({ request }) => {
    const url = new URL(request.url);
    let rows = [...logsFixture.data];

    const serverId = url.searchParams.get("serverId");
    const deploymentId = url.searchParams.get("deploymentId");
    const sessionId = url.searchParams.get("sessionId");
    const toolName = url.searchParams.get("toolName");
    const status = url.searchParams.get("status");
    const errorCode = url.searchParams.get("errorCode");
    const method = url.searchParams.get("method");
    const since = url.searchParams.get("since");
    const until = url.searchParams.get("until");
    const limit = Number(url.searchParams.get("limit") ?? "100");
    const offset = Number(url.searchParams.get("offset") ?? "0");

    if (serverId) {
      rows = rows.filter((log) => log.server_id === serverId);
    }

    if (deploymentId) {
      rows = rows.filter((log) => log.deployment_id === deploymentId);
    }

    if (sessionId) {
      rows = rows.filter((log) => log.session_id === sessionId);
    }

    if (toolName) {
      rows = rows.filter((log) => matchesRegexFilter(toolName, log.tool_name));
    }

    if (status) {
      rows = rows.filter((log) => log.status === status);
    }

    if (errorCode) {
      rows = rows.filter((log) => String(log.error_code) === errorCode);
    }

    if (method) {
      rows = rows.filter((log) => log.method === method);
    }

    if (since) {
      rows = rows.filter((log) => log.ts >= since);
    }

    if (until) {
      rows = rows.filter((log) => log.ts <= until);
    }

    const total = rows.length;
    const data = rows.slice(offset, offset + limit);

    return HttpResponse.json({ data, total });
  }),

  http.get("/api/logs/:id", ({ params }) => {
    if (params.id !== logDetailFixture.id) {
      return HttpResponse.json({ error: "Log not found" }, { status: 404 });
    }

    return HttpResponse.json(logDetailFixture);
  }),
];
