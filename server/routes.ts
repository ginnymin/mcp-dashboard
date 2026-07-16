import type { Hono } from "hono";
import type Database from "better-sqlite3";

type Row = Record<string, unknown>;

// SQLite stores JSON as TEXT and booleans as 0/1 INTEGERs. The
// serializers below undo both per resource so storage details never
// leak into API responses.
function parseJson(row: Row, ...columns: string[]): Row {
  for (const col of columns) {
    if (typeof row[col] === "string") row[col] = JSON.parse(row[col] as string);
  }
  return row;
}

function parseBooleans(row: Row, ...columns: string[]): Row {
  for (const col of columns) {
    if (typeof row[col] === "number") row[col] = row[col] === 1;
  }
  return row;
}

const serializeServer = (row: Row) =>
  parseBooleans(
    parseJson(row, "source"),
    "auth_enabled",
    "audit_enabled",
    "rate_limit_enabled",
  );
const serializeDeployment = (row: Row) => parseJson(row, "build_info");
const serializeTool = (row: Row) =>
  parseBooleans(parseJson(row, "input_schema"), "is_new");
const serializeLogDetail = (row: Row) =>
  parseJson(row, "request_body", "response_body");
const serializeAuditEvent = (row: Row) => parseJson(row, "metadata");

function clampLimit(
  raw: string | undefined,
  fallback = 100,
  max = 500,
): number {
  const n = parseInt(raw ?? "", 10);
  if (Number.isNaN(n) || n < 1) return fallback;
  return Math.min(n, max);
}

// Build "WHERE a = ? AND b >= ?" from present query params.
function buildFilters(
  conditions: Array<[sql: string, value: string | undefined]>,
) {
  const clauses: string[] = [];
  const params: string[] = [];
  for (const [sql, value] of conditions) {
    if (value !== undefined && value !== "") {
      clauses.push(sql);
      params.push(value);
    }
  }
  return {
    where: clauses.length ? `WHERE ${clauses.join(" AND ")}` : "",
    params,
  };
}

const LOG_LIST_COLUMNS =
  "id, session_id, deployment_id, server_id, ts, method, tool_name, status, error_code, error_message, latency_ms";

export function registerRoutes(app: Hono, db: Database.Database) {
  // ── Servers ─────────────────────────────────────────────
  app.get("/api/servers", (c) => {
    const since =
      c.req.query("since") ??
      new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const until = c.req.query("until") ?? new Date().toISOString();

    const rows = db
      .prepare(
        `SELECT s.*,
          (SELECT COUNT(*) FROM deployments d WHERE d.server_id = s.id) AS deployment_count,
          (SELECT COUNT(*) FROM sessions se WHERE se.server_id = s.id AND se.status = 'open') AS open_session_count,
          (SELECT ROUND(AVG(l.status = 'error') * 100, 2) FROM logs l
            WHERE l.server_id = s.id AND l.ts >= ? AND l.ts <= ?) AS error_rate_24h
        FROM servers s
        ORDER BY s.name`,
      )
      .all(since, until) as Row[];
    return c.json({ data: rows.map(serializeServer), total: rows.length });
  });

  app.get("/api/servers/:id", (c) => {
    const row = db
      .prepare("SELECT * FROM servers WHERE id = ?")
      .get(c.req.param("id")) as Row | undefined;
    if (!row) return c.json({ error: "Server not found" }, 404);
    return c.json(serializeServer(row));
  });

  // ── Deployments ─────────────────────────────────────────
  app.get("/api/servers/:id/deployments", (c) => {
    const serverId = c.req.param("id");
    if (!db.prepare("SELECT 1 FROM servers WHERE id = ?").get(serverId)) {
      return c.json({ error: "Server not found" }, 404);
    }
    const rows = db
      .prepare(
        `SELECT d.*,
          (SELECT COUNT(*) FROM tools t WHERE t.deployment_id = d.id) AS tool_count,
          (SELECT COUNT(*) FROM sessions se WHERE se.deployment_id = d.id) AS session_count,
          (SELECT COUNT(*) FROM logs l WHERE l.deployment_id = d.id AND l.status = 'error') AS error_count
        FROM deployments d
        WHERE d.server_id = ?
        ORDER BY d.created_at DESC`,
      )
      .all(serverId) as Row[];
    return c.json({ data: rows.map(serializeDeployment), total: rows.length });
  });

  app.get("/api/deployments/:id", (c) => {
    const row = db
      .prepare("SELECT * FROM deployments WHERE id = ?")
      .get(c.req.param("id")) as Row | undefined;
    if (!row) return c.json({ error: "Deployment not found" }, 404);
    const tools = (
      db
        .prepare("SELECT * FROM tools WHERE deployment_id = ? ORDER BY name")
        .all(row.id) as Row[]
    ).map(serializeTool);
    return c.json({ ...serializeDeployment(row), tools });
  });

  // ── Server stats ────────────────────────────────────────
  app.get("/api/servers/:id/stats", (c) => {
    const serverId = c.req.param("id");
    if (!db.prepare("SELECT 1 FROM servers WHERE id = ?").get(serverId)) {
      return c.json({ error: "Server not found" }, 404);
    }
    const since = c.req.query("since");
    const { where, params } = buildFilters([
      ["server_id = ?", serverId],
      ["ts >= ?", since],
    ]);

    const totals = db
      .prepare(
        `SELECT COUNT(*) AS total_requests,
          ROUND(AVG(status = 'error') * 100, 2) AS error_rate,
          COUNT(DISTINCT session_id) AS session_count
        FROM logs ${where}`,
      )
      .get(...params) as Row;

    // Percentiles via sorted offset — fine at this scale.
    const latencies = db
      .prepare(`SELECT latency_ms FROM logs ${where} ORDER BY latency_ms`)
      .all(...params) as { latency_ms: number }[];
    const pct = (p: number) =>
      latencies.length
        ? latencies[Math.floor((latencies.length - 1) * p)].latency_ms
        : null;

    const byTool = db
      .prepare(
        `SELECT tool_name, COUNT(*) AS count,
          SUM(status = 'error') AS error_count,
          ROUND(AVG(status = 'error') * 100, 2) AS error_rate,
          MAX(latency_ms) AS max_latency_ms
        FROM logs ${where} AND tool_name IS NOT NULL
        GROUP BY tool_name ORDER BY count DESC`,
      )
      .all(...params);

    const depFilter = buildFilters([
      ["l.server_id = ?", serverId],
      ["l.ts >= ?", since],
    ]);
    const byDeployment = db
      .prepare(
        `SELECT l.deployment_id, d.version, COUNT(*) AS count,
          SUM(l.status = 'error') AS error_count,
          ROUND(AVG(l.status = 'error') * 100, 2) AS error_rate
        FROM logs l JOIN deployments d ON d.id = l.deployment_id
        ${depFilter.where}
        GROUP BY l.deployment_id ORDER BY MIN(l.ts) DESC`,
      )
      .all(...depFilter.params);

    const errorCodes = db
      .prepare(
        `SELECT error_code, COUNT(*) AS count FROM logs
        ${where} AND error_code IS NOT NULL
        GROUP BY error_code ORDER BY count DESC`,
      )
      .all(...params);

    return c.json({
      ...totals,
      p50_latency_ms: pct(0.5),
      p95_latency_ms: pct(0.95),
      by_tool: byTool,
      by_deployment: byDeployment,
      error_codes: errorCodes,
    });
  });

  // ── Sessions ────────────────────────────────────────────
  app.get("/api/sessions", (c) => {
    const q = c.req.query();
    const { where, params } = buildFilters([
      ["server_id = ?", q.serverId],
      ["deployment_id = ?", q.deploymentId],
      ["status = ?", q.status],
      ["started_at >= ?", q.since],
      ["started_at <= ?", q.until],
    ]);
    let rows = db
      .prepare(`SELECT * FROM sessions ${where} ORDER BY started_at DESC`)
      .all(...params) as Row[];

    if (q.clientName) {
      try {
        const regex = new RegExp(q.clientName, "i");
        rows = rows.filter((row) => regex.test(String(row.client_name)));
      } catch {
        rows = [];
      }
    }

    const total = rows.length;
    const limit = clampLimit(q.limit);
    const offset = Math.max(parseInt(q.offset ?? "0", 10) || 0, 0);
    const data = rows.slice(offset, offset + limit);
    return c.json({ data, total });
  });

  app.get("/api/sessions/:id", (c) => {
    const row = db
      .prepare("SELECT * FROM sessions WHERE id = ?")
      .get(c.req.param("id")) as Row | undefined;
    if (!row) return c.json({ error: "Session not found" }, 404);
    const sessionLogs = db
      .prepare(
        `SELECT ${LOG_LIST_COLUMNS} FROM logs WHERE session_id = ? ORDER BY ts ASC`,
      )
      .all(row.id);
    return c.json({ ...row, logs: sessionLogs });
  });

  // ── Logs ────────────────────────────────────────────────
  app.get("/api/logs", (c) => {
    const q = c.req.query();
    const { where, params } = buildFilters([
      ["server_id = ?", q.serverId],
      ["deployment_id = ?", q.deploymentId],
      ["session_id = ?", q.sessionId],
      ["status = ?", q.status],
      ["error_code = ?", q.errorCode],
      ["method = ?", q.method],
      ["ts >= ?", q.since],
      ["ts <= ?", q.until],
    ]);
    let rows = db
      .prepare(`SELECT ${LOG_LIST_COLUMNS} FROM logs ${where} ORDER BY ts DESC`)
      .all(...params) as Row[];

    if (q.toolName) {
      try {
        const regex = new RegExp(q.toolName, "i");
        rows = rows.filter(
          (row) => row.tool_name != null && regex.test(String(row.tool_name)),
        );
      } catch {
        rows = [];
      }
    }

    const total = rows.length;
    const limit = clampLimit(q.limit);
    const offset = Math.max(parseInt(q.offset ?? "0", 10) || 0, 0);
    const data = rows.slice(offset, offset + limit);
    return c.json({ data, total });
  });

  app.get("/api/logs/:id", (c) => {
    const row = db
      .prepare("SELECT * FROM logs WHERE id = ?")
      .get(c.req.param("id")) as Row | undefined;
    if (!row) return c.json({ error: "Log not found" }, 404);
    return c.json(serializeLogDetail(row));
  });

  // ── Audit events ────────────────────────────────────────
  app.get("/api/servers/:id/audit", (c) => {
    const serverId = c.req.param("id");
    if (!db.prepare("SELECT 1 FROM servers WHERE id = ?").get(serverId)) {
      return c.json({ error: "Server not found" }, 404);
    }
    const q = c.req.query();
    const { where, params } = buildFilters([
      ["server_id = ?", serverId],
      ["event_type = ?", q.eventType],
      ["ts >= ?", q.since],
      ["ts <= ?", q.until],
    ]);
    const rows = db
      .prepare(`SELECT * FROM audit_events ${where} ORDER BY ts DESC`)
      .all(...params) as Row[];
    return c.json({ data: rows.map(serializeAuditEvent), total: rows.length });
  });
}
