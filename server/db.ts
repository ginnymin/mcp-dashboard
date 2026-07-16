import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "..", "data", "logs.db");

export function getDb() {
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  return db;
}

export function initDb() {
  const db = getDb();

  // ── Servers ──────────────────────────────────────────────
  // An MCP server a customer has connected to the gateway.
  // `source` is a JSON blob whose shape depends on `source_type`:
  //   github/gitlab/bitbucket: { repo_url, owner, repo, branch, default_branch }
  //   local:                   { artifact_name, uploaded_by, build_tool, size_bytes }
  // Governance add-ons (auth, audit logging, rate limiting) are optional per server.
  db.exec(`
    CREATE TABLE IF NOT EXISTS servers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      display_name TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL,
      source_type TEXT NOT NULL,
      source TEXT NOT NULL,
      auth_enabled INTEGER NOT NULL DEFAULT 0,
      auth_policy TEXT,
      audit_enabled INTEGER NOT NULL DEFAULT 0,
      rate_limit_enabled INTEGER NOT NULL DEFAULT 0,
      rate_limit_rpm INTEGER,
      current_deployment_id TEXT,
      created_at TEXT NOT NULL
    )
  `);

  // ── Deployments ──────────────────────────────────────────
  // A versioned rollout of a server. `build_info` is a JSON blob:
  // { trigger, commit_message?, build_duration_ms?, build_log_excerpt?, rollback_reason? }
  db.exec(`
    CREATE TABLE IF NOT EXISTS deployments (
      id TEXT PRIMARY KEY,
      server_id TEXT NOT NULL REFERENCES servers(id),
      version TEXT NOT NULL,
      status TEXT NOT NULL,
      git_sha TEXT,
      build_info TEXT,
      created_at TEXT NOT NULL,
      superseded_at TEXT
    )
  `);

  // ── Tools ────────────────────────────────────────────────
  // The tools/list manifest snapshotted per deployment. Catalogs
  // evolve between versions; `is_new` marks tools absent from the
  // previous deployment.
  db.exec(`
    CREATE TABLE IF NOT EXISTS tools (
      id TEXT PRIMARY KEY,
      deployment_id TEXT NOT NULL REFERENCES deployments(id),
      name TEXT NOT NULL,
      description TEXT,
      input_schema TEXT NOT NULL,
      is_new INTEGER NOT NULL DEFAULT 0
    )
  `);

  // ── Sessions ─────────────────────────────────────────────
  // One MCP client connection to a deployment. server_id,
  // request_count, and error_count are denormalized for cheap lists.
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      deployment_id TEXT NOT NULL REFERENCES deployments(id),
      server_id TEXT NOT NULL REFERENCES servers(id),
      client_name TEXT NOT NULL,
      client_version TEXT,
      protocol_version TEXT NOT NULL,
      auth_subject TEXT,
      started_at TEXT NOT NULL,
      ended_at TEXT,
      status TEXT NOT NULL,
      request_count INTEGER NOT NULL DEFAULT 0,
      error_count INTEGER NOT NULL DEFAULT 0
    )
  `);

  // ── Logs ─────────────────────────────────────────────────
  // The traffic stream: one row per JSON-RPC request. request_body /
  // response_body are JSON blobs served only by the detail endpoint.
  db.exec(`
    CREATE TABLE IF NOT EXISTS logs (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL REFERENCES sessions(id),
      deployment_id TEXT NOT NULL REFERENCES deployments(id),
      server_id TEXT NOT NULL REFERENCES servers(id),
      ts TEXT NOT NULL,
      method TEXT NOT NULL,
      tool_name TEXT,
      status TEXT NOT NULL,
      error_code INTEGER,
      error_message TEXT,
      latency_ms INTEGER NOT NULL,
      request_body TEXT,
      response_body TEXT
    )
  `);

  // ── Audit events ─────────────────────────────────────────
  // The governance stream: low-volume control-plane events for
  // servers with audit logging enabled. `metadata` is event-specific JSON.
  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_events (
      id TEXT PRIMARY KEY,
      server_id TEXT NOT NULL REFERENCES servers(id),
      deployment_id TEXT REFERENCES deployments(id),
      ts TEXT NOT NULL,
      event_type TEXT NOT NULL,
      actor TEXT NOT NULL,
      summary TEXT NOT NULL,
      metadata TEXT
    )
  `);

  db.exec(`CREATE INDEX IF NOT EXISTS idx_servers_status ON servers(status)`);
  db.exec(
    `CREATE INDEX IF NOT EXISTS idx_deployments_server ON deployments(server_id, created_at)`,
  );
  db.exec(
    `CREATE INDEX IF NOT EXISTS idx_tools_deployment ON tools(deployment_id)`,
  );
  db.exec(
    `CREATE INDEX IF NOT EXISTS idx_sessions_server ON sessions(server_id, started_at)`,
  );
  db.exec(
    `CREATE INDEX IF NOT EXISTS idx_sessions_deployment ON sessions(deployment_id)`,
  );
  db.exec(
    `CREATE INDEX IF NOT EXISTS idx_sessions_client ON sessions(client_name)`,
  );
  db.exec(
    `CREATE INDEX IF NOT EXISTS idx_logs_server_ts ON logs(server_id, ts)`,
  );
  db.exec(
    `CREATE INDEX IF NOT EXISTS idx_logs_deployment_ts ON logs(deployment_id, ts)`,
  );
  db.exec(
    `CREATE INDEX IF NOT EXISTS idx_logs_session ON logs(session_id, ts)`,
  );
  db.exec(`CREATE INDEX IF NOT EXISTS idx_logs_tool ON logs(tool_name)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_logs_status ON logs(status)`);
  db.exec(
    `CREATE INDEX IF NOT EXISTS idx_audit_server_ts ON audit_events(server_id, ts)`,
  );
  db.exec(
    `CREATE INDEX IF NOT EXISTS idx_audit_type ON audit_events(event_type)`,
  );

  return db;
}
