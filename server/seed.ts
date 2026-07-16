import { getDb, initDb } from "./db.js";

// Rebuild the schema from scratch so schema changes always propagate.
{
  const raw = getDb();
  for (const t of [
    "logs",
    "audit_events",
    "sessions",
    "tools",
    "deployments",
    "servers",
  ]) {
    raw.exec(`DROP TABLE IF EXISTS ${t}`);
  }
  raw.close();
}
const db = initDb();

// ── Deterministic PRNG ──────────────────────────────────────
// Fixed seed so every run produces the same data (modulo the time
// baseline below). mulberry32: tiny, good enough for fake data.
function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(0x5eed);

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}
function randInt(min: number, max: number): number {
  return Math.floor(rand() * (max - min + 1)) + min;
}
function chance(p: number): boolean {
  return rand() < p;
}

let idCounter = 0;
function makeId(prefix: string): string {
  const h = Math.floor(rand() * 0xffffff)
    .toString(16)
    .padStart(6, "0");
  return `${prefix}_${h}${(idCounter++).toString(36)}`;
}
function sha(): string {
  let s = "";
  for (let i = 0; i < 5; i++)
    s += Math.floor(rand() * 0xffffffff)
      .toString(16)
      .padStart(8, "0");
  return s;
}

// ── Time ────────────────────────────────────────────────────
// Data spans the 7 days leading up to seed time (snapped to the hour
// so repeated runs within an hour are identical).
const HOUR = 3_600_000;
const MIN = 60_000;
const NOW = Math.floor(Date.now() / HOUR) * HOUR;
const hoursAgo = (h: number) => NOW - h * HOUR;
const iso = (t: number) => new Date(t).toISOString();

// ── Tool manifest helpers ───────────────────────────────────
interface ToolDef {
  name: string;
  description: string;
  schema: object;
}
function tool(
  name: string,
  description: string,
  properties: Record<string, object>,
): ToolDef {
  return {
    name,
    description,
    schema: { type: "object", properties, required: Object.keys(properties) },
  };
}
const str = (description: string) => ({ type: "string", description });
const num = (description: string) => ({ type: "number", description });

const T = {
  // weather-tools — v2.0.0 renamed get_forecast's `zip` param to
  // `postal_code`; older clients still send `zip`.
  get_current_weather: tool(
    "get_current_weather",
    "Current conditions for a location",
    { location: str("City and state, e.g. 'San Francisco, CA'") },
  ),
  get_forecast_zip: tool("get_forecast", "Multi-day forecast by US zip code", {
    zip: str("US zip code"),
    days: num("Days to forecast (1-7)"),
  }),
  get_forecast_postal: tool(
    "get_forecast",
    "Multi-day forecast by postal code",
    { postal_code: str("Postal code"), days: num("Days to forecast (1-7)") },
  ),
  get_alerts: tool("get_alerts", "Active weather alerts for a region", {
    region: str("Two-letter state/region code"),
  }),
  geocode_location: tool(
    "geocode_location",
    "Resolve a place name to coordinates",
    { query: str("Free-form place name") },
  ),
  get_air_quality: tool("get_air_quality", "Air quality index by postal code", {
    postal_code: str("Postal code"),
  }),

  // payments-gateway
  create_charge: tool("create_charge", "Charge a customer", {
    amount: num("Amount in cents"),
    currency: str("ISO currency code"),
    customer_id: str("Customer identifier"),
  }),
  refund_charge: tool("refund_charge", "Refund an existing charge", {
    charge_id: str("Charge identifier"),
  }),
  list_transactions: tool("list_transactions", "List recent transactions", {
    limit: num("Max results"),
  }),
  get_balance: tool("get_balance", "Current account balance", {}),
  lookup_customer: tool("lookup_customer", "Find a customer by email", {
    email: str("Customer email"),
  }),

  // docs-search
  search_docs: tool("search_docs", "Full-text search across documentation", {
    query: str("Search query"),
    limit: num("Max results"),
  }),
  get_page: tool("get_page", "Fetch a documentation page", {
    page_id: str("Page identifier"),
  }),
  list_spaces: tool("list_spaces", "List documentation spaces", {}),
  summarize_page: tool("summarize_page", "Summarize a documentation page", {
    page_id: str("Page identifier"),
  }),

  // image-gen
  generate_image: tool("generate_image", "Generate an image from a prompt", {
    prompt: str("Image prompt"),
    size: str("Output size, e.g. '1024x1024'"),
  }),
  upscale_image: tool("upscale_image", "Upscale an image", {
    image_url: str("Source image URL"),
    factor: num("Upscale factor"),
  }),
  remove_background: tool("remove_background", "Remove an image background", {
    image_url: str("Source image URL"),
  }),

  // crm-connector
  create_ticket: tool("create_ticket", "Create a support ticket", {
    subject: str("Ticket subject"),
    body: str("Ticket body"),
    priority: str("low | medium | high"),
  }),
  update_ticket: tool("update_ticket", "Update a support ticket", {
    ticket_id: str("Ticket identifier"),
    status: str("New status"),
  }),
  search_contacts: tool("search_contacts", "Search CRM contacts", {
    query: str("Search query"),
  }),
  fetch_account: tool("fetch_account", "Fetch an account record", {
    account_id: str("Account identifier"),
  }),
  log_activity: tool("log_activity", "Log an activity on a contact", {
    contact_id: str("Contact identifier"),
    note: str("Activity note"),
  }),

  // email-agent
  send_email: tool("send_email", "Send an email", {
    to: str("Recipient"),
    subject: str("Subject"),
    body: str("Body"),
  }),
  list_inbox: tool("list_inbox", "List inbox messages", {
    limit: num("Max results"),
  }),
  search_messages: tool("search_messages", "Search messages", {
    query: str("Search query"),
  }),
  draft_reply: tool("draft_reply", "Draft a reply to a message", {
    message_id: str("Message identifier"),
    tone: str("Reply tone"),
  }),

  // internal-tools
  run_report: tool("run_report", "Run a saved report", {
    report_id: str("Report identifier"),
  }),
  query_warehouse: tool("query_warehouse", "Run a read-only warehouse query", {
    sql: str("SQL query"),
  }),
  export_csv: tool("export_csv", "Export a table to CSV", {
    table: str("Table name"),
  }),
};

// ── Servers & deployments ───────────────────────────────────
interface DeploymentDef {
  id: string;
  version: string;
  status:
    | "live"
    | "superseded"
    | "rolled_back"
    | "draining"
    | "build_failed"
    | "building";
  git_sha: string | null;
  build_info: Record<string, unknown>;
  created_at: number;
  superseded_at: number | null;
  tools: ToolDef[];
}
interface ServerDef {
  id: string;
  name: string;
  display_name: string;
  description: string;
  status: "active" | "paused" | "degraded";
  source_type: "github" | "gitlab" | "bitbucket" | "local";
  source: Record<string, unknown>;
  auth_enabled: 0 | 1;
  auth_policy: "api_key" | "oauth" | null;
  audit_enabled: 0 | 1;
  rate_limit_enabled: 0 | 1;
  rate_limit_rpm: number | null;
  created_at: number;
  deployments: DeploymentDef[];
  sessionCount: number;
  // Sessions only start inside this window (defaults to the full 7 days).
  sessionWindow?: [number, number];
  // Bias which tools sessions call (names may repeat to weight them).
  toolBias?: string[];
}

const crmSha3 = sha();

const SERVERS: ServerDef[] = [
  {
    id: "srv_weather",
    name: "weather-tools",
    display_name: "Weather Tools",
    description: "Forecasts, current conditions, and severe weather alerts.",
    status: "active",
    source_type: "github",
    source: {
      repo_url: "https://github.com/acme/weather-tools",
      owner: "acme",
      repo: "weather-tools",
      branch: "main",
      default_branch: "main",
    },
    auth_enabled: 1,
    auth_policy: "api_key",
    audit_enabled: 1,
    rate_limit_enabled: 1,
    rate_limit_rpm: 120,
    created_at: hoursAgo(24 * 60),
    sessionCount: 56,
    toolBias: [
      "get_forecast",
      "get_forecast",
      "get_current_weather",
      "get_alerts",
    ],
    deployments: [
      {
        id: "dep_weather_1",
        version: "1.2.0",
        status: "superseded",
        git_sha: sha(),
        build_info: {
          trigger: "git_push",
          commit_message: "Add severe weather alerts",
          build_duration_ms: 48_200,
        },
        created_at: hoursAgo(160),
        superseded_at: hoursAgo(120),
        tools: [T.get_current_weather, T.get_forecast_zip, T.get_alerts],
      },
      {
        id: "dep_weather_2",
        version: "1.3.0",
        status: "superseded",
        git_sha: sha(),
        build_info: {
          trigger: "git_push",
          commit_message: "Add geocoding support",
          build_duration_ms: 51_900,
        },
        created_at: hoursAgo(120),
        superseded_at: hoursAgo(72),
        tools: [
          T.get_current_weather,
          T.get_forecast_zip,
          T.get_alerts,
          T.geocode_location,
        ],
      },
      {
        id: "dep_weather_3",
        version: "1.4.0",
        status: "superseded",
        git_sha: sha(),
        build_info: {
          trigger: "git_push",
          commit_message: "Upgrade forecast provider client",
          build_duration_ms: 49_400,
        },
        created_at: hoursAgo(72),
        superseded_at: hoursAgo(26),
        tools: [
          T.get_current_weather,
          T.get_forecast_zip,
          T.get_alerts,
          T.geocode_location,
        ],
      },
      {
        id: "dep_weather_4",
        version: "2.0.0",
        status: "live",
        git_sha: sha(),
        build_info: {
          trigger: "git_push",
          commit_message: "Internationalize forecast params; add air quality",
          build_duration_ms: 55_100,
        },
        created_at: hoursAgo(26),
        superseded_at: null,
        tools: [
          T.get_current_weather,
          T.get_forecast_postal,
          T.get_alerts,
          T.geocode_location,
          T.get_air_quality,
        ],
      },
    ],
  },
  {
    id: "srv_payments",
    name: "payments-gateway",
    display_name: "Payments Gateway",
    description:
      "Charges, refunds, and customer lookups against the billing system.",
    status: "active",
    source_type: "gitlab",
    source: {
      repo_url: "https://gitlab.com/acme/payments-gateway",
      owner: "acme",
      repo: "payments-gateway",
      branch: "release",
      default_branch: "main",
    },
    auth_enabled: 1,
    auth_policy: "oauth",
    audit_enabled: 1,
    rate_limit_enabled: 0,
    rate_limit_rpm: null,
    created_at: hoursAgo(24 * 45),
    sessionCount: 38,
    deployments: [
      {
        id: "dep_payments_1",
        version: "0.9.0",
        status: "superseded",
        git_sha: sha(),
        build_info: {
          trigger: "git_push",
          commit_message: "Initial gateway integration",
          build_duration_ms: 73_000,
        },
        created_at: hoursAgo(150),
        superseded_at: hoursAgo(96),
        tools: [T.create_charge, T.list_transactions, T.get_balance],
      },
      {
        id: "dep_payments_2",
        version: "1.0.0",
        status: "superseded",
        git_sha: sha(),
        build_info: {
          trigger: "git_push",
          commit_message: "Add refunds",
          build_duration_ms: 70_400,
        },
        created_at: hoursAgo(96),
        superseded_at: hoursAgo(60),
        tools: [
          T.create_charge,
          T.refund_charge,
          T.list_transactions,
          T.get_balance,
        ],
      },
      {
        id: "dep_payments_3",
        version: "1.0.1",
        status: "live",
        git_sha: sha(),
        build_info: {
          trigger: "git_push",
          commit_message: "Customer lookup by email",
          build_duration_ms: 69_800,
        },
        created_at: hoursAgo(60),
        superseded_at: null,
        tools: [
          T.create_charge,
          T.refund_charge,
          T.list_transactions,
          T.get_balance,
          T.lookup_customer,
        ],
      },
    ],
  },
  {
    id: "srv_docs",
    name: "docs-search",
    display_name: "Docs Search",
    description: "Search and retrieval over the internal documentation corpus.",
    status: "active",
    source_type: "bitbucket",
    source: {
      repo_url: "https://bitbucket.org/acme/docs-search",
      owner: "acme",
      repo: "docs-search",
      branch: "main",
      default_branch: "main",
    },
    auth_enabled: 0,
    auth_policy: null,
    audit_enabled: 0,
    rate_limit_enabled: 0,
    rate_limit_rpm: null,
    created_at: hoursAgo(24 * 80),
    sessionCount: 62,
    deployments: [
      {
        id: "dep_docs_1",
        version: "2.1.0",
        status: "superseded",
        git_sha: sha(),
        build_info: {
          trigger: "git_push",
          commit_message: "Reindex pipeline tuning",
          build_duration_ms: 31_500,
        },
        created_at: hoursAgo(160),
        superseded_at: hoursAgo(100),
        tools: [T.search_docs, T.get_page, T.list_spaces],
      },
      {
        id: "dep_docs_2",
        version: "2.2.0",
        status: "live",
        git_sha: sha(),
        build_info: {
          trigger: "git_push",
          commit_message: "Page summarization",
          build_duration_ms: 33_900,
        },
        created_at: hoursAgo(100),
        superseded_at: null,
        tools: [T.search_docs, T.get_page, T.list_spaces, T.summarize_page],
      },
    ],
  },
  {
    id: "srv_imagegen",
    name: "image-gen",
    display_name: "Image Gen",
    description:
      "Image generation and editing backed by an internal model cluster.",
    status: "degraded",
    source_type: "local",
    source: {
      artifact_name: "image-gen-2.1.4.tar.gz",
      uploaded_by: "priya@acme.com",
      build_tool: "docker",
      size_bytes: 48_236_544,
    },
    auth_enabled: 0,
    auth_policy: null,
    audit_enabled: 1,
    rate_limit_enabled: 0,
    rate_limit_rpm: null,
    created_at: hoursAgo(24 * 30),
    sessionCount: 20,
    deployments: [
      {
        id: "dep_imagegen_1",
        version: "2.0.0",
        status: "superseded",
        git_sha: null,
        build_info: { trigger: "manual", build_duration_ms: 312_000 },
        created_at: hoursAgo(150),
        superseded_at: hoursAgo(96),
        tools: [T.generate_image],
      },
      {
        id: "dep_imagegen_2",
        version: "2.1.0",
        status: "live",
        git_sha: null,
        build_info: { trigger: "manual", build_duration_ms: 298_000 },
        created_at: hoursAgo(96),
        superseded_at: null,
        tools: [T.generate_image, T.upscale_image, T.remove_background],
      },
      {
        id: "dep_imagegen_3",
        version: "2.2.0",
        status: "build_failed",
        git_sha: null,
        build_info: {
          trigger: "manual",
          build_log_excerpt:
            "#14 [stage-1 7/9] RUN pip install -r requirements.txt\n#14 ERROR: failed to resolve dependency 'libvips>=8.15' for target linux/arm64\nprocess exited with code 1",
        },
        created_at: hoursAgo(10),
        superseded_at: null,
        tools: [],
      },
    ],
  },
  {
    id: "srv_crm",
    name: "crm-connector",
    display_name: "CRM Connector",
    description: "Tickets, contacts, and account data from the CRM.",
    status: "active",
    source_type: "github",
    source: {
      repo_url: "https://github.com/acme/crm-connector",
      owner: "acme",
      repo: "crm-connector",
      branch: "main",
      default_branch: "main",
    },
    auth_enabled: 1,
    auth_policy: "api_key",
    audit_enabled: 1,
    rate_limit_enabled: 1,
    rate_limit_rpm: 300,
    created_at: hoursAgo(24 * 70),
    sessionCount: 30,
    deployments: [
      {
        id: "dep_crm_1",
        version: "1.0.0",
        status: "superseded",
        git_sha: sha(),
        build_info: {
          trigger: "git_push",
          commit_message: "Initial connector",
          build_duration_ms: 41_000,
        },
        created_at: hoursAgo(165),
        superseded_at: hoursAgo(130),
        tools: [T.create_ticket, T.search_contacts],
      },
      {
        id: "dep_crm_2",
        version: "1.1.0",
        status: "superseded",
        git_sha: sha(),
        build_info: {
          trigger: "git_push",
          commit_message: "Account records",
          build_duration_ms: 43_200,
        },
        created_at: hoursAgo(130),
        superseded_at: hoursAgo(80),
        tools: [T.create_ticket, T.search_contacts, T.fetch_account],
      },
      {
        id: "dep_crm_3",
        version: "1.2.0",
        status: "superseded",
        git_sha: crmSha3,
        build_info: {
          trigger: "git_push",
          commit_message: "Ticket updates",
          build_duration_ms: 42_700,
        },
        created_at: hoursAgo(80),
        superseded_at: hoursAgo(36),
        tools: [
          T.create_ticket,
          T.update_ticket,
          T.search_contacts,
          T.fetch_account,
        ],
      },
      {
        id: "dep_crm_4",
        version: "1.3.0",
        status: "rolled_back",
        git_sha: sha(),
        build_info: {
          trigger: "git_push",
          commit_message: "Activity logging + pooled DB connections",
          build_duration_ms: 44_900,
          rollback_reason:
            "Elevated 500s within 30 minutes of rollout — connection pool exhaustion",
        },
        created_at: hoursAgo(36),
        superseded_at: hoursAgo(35.5),
        tools: [
          T.create_ticket,
          T.update_ticket,
          T.search_contacts,
          T.fetch_account,
          T.log_activity,
        ],
      },
      {
        id: "dep_crm_5",
        version: "1.3.1",
        status: "live",
        git_sha: crmSha3,
        build_info: {
          trigger: "rollback",
          commit_message: "Revert to 1.2.0",
          build_duration_ms: 39_300,
        },
        created_at: hoursAgo(35.5),
        superseded_at: null,
        tools: [
          T.create_ticket,
          T.update_ticket,
          T.search_contacts,
          T.fetch_account,
        ],
      },
    ],
  },
  {
    id: "srv_email",
    name: "email-agent",
    display_name: "Email Agent",
    description: "Inbox search, drafting, and sending for support workflows.",
    status: "active",
    source_type: "gitlab",
    source: {
      repo_url: "https://gitlab.com/acme/email-agent",
      owner: "acme",
      repo: "email-agent",
      branch: "main",
      default_branch: "main",
    },
    auth_enabled: 0,
    auth_policy: null,
    audit_enabled: 0,
    rate_limit_enabled: 1,
    rate_limit_rpm: 60,
    created_at: hoursAgo(24 * 50),
    sessionCount: 26,
    deployments: [
      {
        id: "dep_email_1",
        version: "1.5.2",
        status: "superseded",
        git_sha: sha(),
        build_info: {
          trigger: "git_push",
          commit_message: "Inbox pagination fixes",
          build_duration_ms: 28_400,
        },
        created_at: hoursAgo(140),
        superseded_at: hoursAgo(70),
        tools: [T.send_email, T.list_inbox, T.search_messages],
      },
      {
        id: "dep_email_2",
        version: "1.6.0",
        status: "live",
        git_sha: sha(),
        build_info: {
          trigger: "git_push",
          commit_message: "AI reply drafting",
          build_duration_ms: 30_100,
        },
        created_at: hoursAgo(70),
        superseded_at: null,
        tools: [T.send_email, T.list_inbox, T.search_messages, T.draft_reply],
      },
    ],
  },
  {
    id: "srv_internal",
    name: "internal-tools",
    display_name: "Internal Tools",
    description: "Reporting and warehouse access for the data team.",
    status: "paused",
    source_type: "local",
    source: {
      artifact_name: "internal-tools-0.4.0.zip",
      uploaded_by: "sam@acme.com",
      build_tool: "esbuild",
      size_bytes: 9_412_870,
    },
    auth_enabled: 1,
    auth_policy: "oauth",
    audit_enabled: 1,
    rate_limit_enabled: 0,
    rate_limit_rpm: null,
    created_at: hoursAgo(24 * 100),
    sessionCount: 10,
    sessionWindow: [hoursAgo(168), hoursAgo(48)], // paused 48h ago; traffic stops there
    deployments: [
      {
        id: "dep_internal_1",
        version: "0.3.0",
        status: "superseded",
        git_sha: null,
        build_info: { trigger: "manual", build_duration_ms: 64_000 },
        created_at: hoursAgo(160),
        superseded_at: hoursAgo(72),
        tools: [T.run_report, T.query_warehouse],
      },
      {
        id: "dep_internal_2",
        version: "0.4.0",
        status: "draining",
        git_sha: null,
        build_info: { trigger: "manual", build_duration_ms: 61_500 },
        created_at: hoursAgo(72),
        superseded_at: null,
        tools: [T.run_report, T.query_warehouse, T.export_csv],
      },
    ],
  },
];

// Timestamps for cause→effect stories referenced in multiple places.
const PAYMENTS_KEY_ROTATED_AT = hoursAgo(30); // 401 wave for ~90 min after
const CRM_BAD_DEPLOY_WINDOW: [number, number] = [hoursAgo(36), hoursAgo(35.5)];
const INTERNAL_PAUSED_AT = hoursAgo(48);

// ── Clients ─────────────────────────────────────────────────
const CLIENTS = [
  {
    name: "claude-desktop",
    versions: ["0.10.4", "0.11.0", "0.11.2"],
    protocol: "2025-03-26",
    weight: 40,
  },
  {
    name: "cursor",
    versions: ["1.4.0", "1.5.1"],
    protocol: "2025-03-26",
    weight: 25,
  },
  {
    name: "custom-sdk",
    versions: ["2.0.0", "2.1.3"],
    protocol: "2024-11-05",
    weight: 15,
  },
  { name: "cline", versions: ["3.2.0"], protocol: "2025-03-26", weight: 10 },
  { name: "windsurf", versions: ["1.2.5"], protocol: "2024-11-05", weight: 10 },
];
function pickClient() {
  const total = CLIENTS.reduce((s, c) => s + c.weight, 0);
  let r = rand() * total;
  for (const c of CLIENTS) {
    r -= c.weight;
    if (r <= 0) return c;
  }
  return CLIENTS[0];
}

const AUTH_SUBJECTS: Record<string, string[]> = {
  api_key: ["key_live_7f3a", "key_live_c2d8", "key_live_91be"],
  oauth: ["alice@acme.com", "bob@acme.com", "svc-integrations@acme.com"],
};

// ── Error injection ─────────────────────────────────────────
// Returns an error for a tools/call (or null for success), encoding
// each server's current behavior.
function errorFor(
  serverId: string,
  depId: string,
  toolName: string,
  t: number,
  clientName: string,
): { code: number; message: string } | null {
  // weather 2.0.0 renamed get_forecast's param; old clients still send `zip`
  if (depId === "dep_weather_4" && toolName === "get_forecast" && chance(0.4)) {
    return {
      code: -32602,
      message:
        "Invalid params: unknown parameter 'zip' (expected 'postal_code')",
    };
  }
  // payments: revoked API keys reject custom-sdk traffic for ~90 min after rotation
  if (
    serverId === "srv_payments" &&
    clientName === "custom-sdk" &&
    t >= PAYMENTS_KEY_ROTATED_AT &&
    t <= PAYMENTS_KEY_ROTATED_AT + 90 * MIN
  ) {
    return {
      code: 401,
      message: "Authentication failed: API key has been revoked",
    };
  }
  // crm 1.3.0: connection pool exhaustion during its 30 minutes live
  if (depId === "dep_crm_4" && chance(0.7)) {
    return { code: 500, message: "Internal error: connection pool exhausted" };
  }
  // email-agent: daily peak traffic blows through the 60 rpm limit
  if (
    serverId === "srv_email" &&
    new Date(t).getUTCHours() === 14 &&
    chance(0.35)
  ) {
    return {
      code: 429,
      message: "Rate limit exceeded: 60 requests per minute",
    };
  }
  // image-gen: slow cluster occasionally times out
  if (serverId === "srv_imagegen" && chance(0.06)) {
    return { code: 504, message: "Gateway timeout after 5000ms" };
  }
  // background error rate everywhere
  const base = serverId === "srv_docs" ? 0.01 : 0.02;
  if (chance(base)) {
    return randomChoice([
      { code: 500, message: "Internal error: upstream service unavailable" },
      { code: -32602, message: "Invalid params: missing required field" },
      { code: 504, message: "Gateway timeout after 5000ms" },
    ]);
  }
  return null;
}

function latencyFor(
  serverId: string,
  method: string,
  error: { code: number } | null,
): number {
  if (error) {
    if (error.code === 504) return randInt(4800, 5600);
    if (error.code === 500) return randInt(150, 1200);
    return randInt(8, 60); // auth/validation/rate-limit rejections are fast
  }
  switch (method) {
    case "initialize":
      return randInt(20, 80);
    case "tools/list":
      return randInt(10, 45);
    case "ping":
      return randInt(4, 15);
    default:
      return serverId === "srv_imagegen"
        ? randInt(900, 6500)
        : randInt(40, 800);
  }
}

// ── Request/response bodies ─────────────────────────────────
const SAMPLES: Record<string, () => unknown> = {
  location: () =>
    randomChoice([
      "San Francisco, CA",
      "Chicago, IL",
      "Austin, TX",
      "Brooklyn, NY",
    ]),
  zip: () => randomChoice(["94107", "60611", "78701", "11201"]),
  postal_code: () => randomChoice(["94107", "60611", "78701", "11201"]),
  days: () => randInt(1, 7),
  region: () => randomChoice(["CA", "TX", "IL", "NY"]),
  query: () =>
    randomChoice([
      "quarterly revenue",
      "deploy runbook",
      "refund policy",
      "incident postmortem",
      "onboarding checklist",
    ]),
  limit: () => randInt(5, 50),
  amount: () => randInt(500, 250_000),
  currency: () => "usd",
  customer_id: () => `cus_${randInt(10000, 99999)}`,
  charge_id: () => `ch_${randInt(10000, 99999)}`,
  email: () =>
    randomChoice(["dana@example.com", "lee@example.com", "sasha@example.com"]),
  page_id: () => `page_${randInt(100, 999)}`,
  prompt: () =>
    randomChoice([
      "isometric server room",
      "watercolor fox",
      "product hero banner",
      "abstract gradient",
    ]),
  size: () => randomChoice(["512x512", "1024x1024"]),
  image_url: () => `https://cdn.acme.dev/img/${randInt(1000, 9999)}.png`,
  factor: () => randomChoice([2, 4]),
  subject: () =>
    randomChoice(["Login issue", "Billing question", "Feature request"]),
  body: () => "Customer reported an issue — see thread for details.",
  priority: () => randomChoice(["low", "medium", "high"]),
  ticket_id: () => `tick_${randInt(1000, 9999)}`,
  status: () => randomChoice(["open", "pending", "resolved"]),
  account_id: () => `acct_${randInt(1000, 9999)}`,
  contact_id: () => `cont_${randInt(1000, 9999)}`,
  note: () => "Followed up by phone.",
  to: () => randomChoice(["dana@example.com", "lee@example.com"]),
  message_id: () => `msg_${randInt(10000, 99999)}`,
  tone: () => randomChoice(["friendly", "formal"]),
  report_id: () => `rpt_${randInt(100, 999)}`,
  sql: () => "SELECT region, sum(revenue) FROM sales GROUP BY 1",
  table: () => randomChoice(["accounts", "events", "invoices"]),
};
function argsFor(
  toolDef: ToolDef,
  overrides?: Record<string, unknown>,
): Record<string, unknown> {
  const props = (toolDef.schema as { properties: Record<string, object> })
    .properties;
  const args: Record<string, unknown> = {};
  for (const key of Object.keys(props))
    args[key] = (SAMPLES[key] ?? (() => "example"))();
  return { ...args, ...overrides };
}

// ── Generation ──────────────────────────────────────────────
interface SessionRow {
  id: string;
  deployment_id: string;
  server_id: string;
  client_name: string;
  client_version: string | null;
  protocol_version: string;
  auth_subject: string | null;
  started_at: string;
  ended_at: string | null;
  status: string;
  request_count: number;
  error_count: number;
}
interface LogRow {
  id: string;
  session_id: string;
  deployment_id: string;
  server_id: string;
  ts: string;
  method: string;
  tool_name: string | null;
  status: string;
  error_code: number | null;
  error_message: string | null;
  latency_ms: number;
  request_body: string | null;
  response_body: string | null;
}

const sessions: SessionRow[] = [];
const logs: LogRow[] = [];

function liveDeploymentAt(server: ServerDef, t: number): DeploymentDef | null {
  return (
    server.deployments.find(
      (d) =>
        d.status !== "build_failed" &&
        d.status !== "building" &&
        d.created_at <= t &&
        (d.superseded_at === null || t < d.superseded_at),
    ) ?? null
  );
}

function pushLog(
  session: SessionRow,
  dep: DeploymentDef,
  t: number,
  method: string,
  toolDef: ToolDef | null,
  error: { code: number; message: string } | null,
  requestBody: unknown,
  responseBody: unknown,
) {
  logs.push({
    id: makeId("log"),
    session_id: session.id,
    deployment_id: dep.id,
    server_id: session.server_id,
    ts: iso(t),
    method,
    tool_name: toolDef?.name ?? null,
    status: error ? "error" : "ok",
    error_code: error?.code ?? null,
    error_message: error?.message ?? null,
    latency_ms: latencyFor(session.server_id, method, error),
    request_body: requestBody == null ? null : JSON.stringify(requestBody),
    response_body:
      error || responseBody == null ? null : JSON.stringify(responseBody),
  });
  session.request_count++;
  if (error) session.error_count++;
}

function generateSession(
  server: ServerDef,
  startTs: number,
  forcedClient?: (typeof CLIENTS)[number],
) {
  const dep = liveDeploymentAt(server, startTs);
  if (!dep) return;
  const client = forcedClient ?? pickClient();
  const session: SessionRow = {
    id: makeId("sess"),
    deployment_id: dep.id,
    server_id: server.id,
    client_name: client.name,
    client_version: randomChoice(client.versions),
    protocol_version: client.protocol,
    auth_subject: server.auth_enabled
      ? randomChoice(AUTH_SUBJECTS[server.auth_policy!])
      : null,
    started_at: iso(startTs),
    ended_at: null,
    status: "closed",
    request_count: 0,
    error_count: 0,
  };

  let t = startTs;

  // Sessions hitting a revoked key never get past the gateway: a few
  // rejected attempts, then the client gives up.
  const inAuthWave =
    server.id === "srv_payments" &&
    client.name === "custom-sdk" &&
    startTs >= PAYMENTS_KEY_ROTATED_AT &&
    startTs <= PAYMENTS_KEY_ROTATED_AT + 85 * MIN;

  if (inAuthWave) {
    const attempts = randInt(1, 3);
    for (let i = 0; i < attempts; i++) {
      pushLog(
        session,
        dep,
        t,
        "initialize",
        null,
        {
          code: 401,
          message: "Authentication failed: API key has been revoked",
        },
        {
          protocolVersion: client.protocol,
          clientInfo: { name: client.name, version: session.client_version },
        },
        null,
      );
      t += randInt(800, 4000);
    }
    session.status = "errored";
    session.ended_at = iso(t);
    sessions.push(session);
    return;
  }

  pushLog(
    session,
    dep,
    t,
    "initialize",
    null,
    null,
    {
      protocolVersion: client.protocol,
      clientInfo: { name: client.name, version: session.client_version },
    },
    {
      protocolVersion: client.protocol,
      serverInfo: { name: server.name, version: dep.version },
      capabilities: { tools: {} },
    },
  );
  t += randInt(100, 600);

  pushLog(session, dep, t, "tools/list", null, null, null, {
    tools: dep.tools.map((td) => ({
      name: td.name,
      description: td.description,
    })),
  });
  t += randInt(300, 2500);

  const toolNames = server.toolBias ?? dep.tools.map((td) => td.name);
  const callCount = randInt(5, server.id === "srv_imagegen" ? 12 : 30);
  for (let i = 0; i < callCount; i++) {
    const name = randomChoice(toolNames);
    const toolDef =
      dep.tools.find((td) => td.name === name) ?? randomChoice(dep.tools);
    const error = errorFor(server.id, dep.id, toolDef.name, t, client.name);
    // The failure mode for weather 2.0.0: clients still sending the old param
    const overrides =
      error?.code === -32602 &&
      dep.id === "dep_weather_4" &&
      toolDef.name === "get_forecast"
        ? { zip: (SAMPLES.zip as () => unknown)(), postal_code: undefined }
        : undefined;
    const reqArgs = argsFor(toolDef, overrides);
    if (overrides) delete reqArgs.postal_code;
    pushLog(
      session,
      dep,
      t,
      "tools/call",
      toolDef,
      error,
      { name: toolDef.name, arguments: reqArgs },
      {
        content: [
          {
            type: "text",
            text: `${toolDef.name} completed (${randInt(1, 40)} items)`,
          },
        ],
      },
    );
    t += randInt(500, server.id === "srv_imagegen" ? 15_000 : 8000);
  }

  if (chance(0.3)) {
    pushLog(session, dep, t, "ping", null, null, null, {});
    t += randInt(50, 200);
  }

  if (startTs > NOW - 1 * HOUR && chance(0.5)) {
    session.status = "open"; // still connected
  } else {
    session.ended_at = iso(t + randInt(1000, 30_000));
    if (session.error_count > session.request_count / 2)
      session.status = "errored";
  }
  sessions.push(session);
}

for (const server of SERVERS) {
  const [winStart, winEnd] = server.sessionWindow ?? [
    hoursAgo(167),
    NOW - 10 * MIN,
  ];
  for (let i = 0; i < server.sessionCount; i++) {
    generateSession(server, winStart + rand() * (winEnd - winStart));
  }
}

// Guarantee the time-localized stories have enough traffic to be visible.
const weather = SERVERS[0],
  payments = SERVERS[1],
  crm = SERVERS[4],
  email = SERVERS[5];
for (let i = 0; i < 8; i++) {
  // recent traffic on weather 2.0.0
  generateSession(weather, hoursAgo(26) + rand() * 25 * HOUR);
}
const customSdk = CLIENTS.find((c) => c.name === "custom-sdk")!;
for (let i = 0; i < 7; i++) {
  // custom-sdk sessions caught by the key rotation
  generateSession(
    payments,
    PAYMENTS_KEY_ROTATED_AT + rand() * 80 * MIN,
    customSdk,
  );
}
for (let i = 0; i < 6; i++) {
  // sessions during crm 1.3.0's 30 minutes live
  generateSession(
    crm,
    CRM_BAD_DEPLOY_WINDOW[0] +
      rand() * (CRM_BAD_DEPLOY_WINDOW[1] - CRM_BAD_DEPLOY_WINDOW[0] - 5 * MIN),
  );
}
for (let i = 0; i < 8; i++) {
  // email-agent sessions during the daily 14:00 UTC peak
  const daysBack = randInt(0, 6);
  const peak = new Date(NOW - daysBack * 24 * HOUR);
  peak.setUTCHours(14, randInt(0, 50), 0, 0);
  if (peak.getTime() < NOW) generateSession(email, peak.getTime());
}

// ── Audit events ────────────────────────────────────────────
interface AuditRow {
  id: string;
  server_id: string;
  deployment_id: string | null;
  ts: string;
  event_type: string;
  actor: string;
  summary: string;
  metadata: string | null;
}
const auditEvents: AuditRow[] = [];
function audit(
  server_id: string,
  deployment_id: string | null,
  t: number,
  event_type: string,
  actor: string,
  summary: string,
  metadata?: Record<string, unknown>,
) {
  auditEvents.push({
    id: makeId("aud"),
    server_id,
    deployment_id,
    ts: iso(t),
    event_type,
    actor,
    summary,
    metadata: metadata ? JSON.stringify(metadata) : null,
  });
}

const DEPLOYERS = [
  "alice@acme.com",
  "bob@acme.com",
  "priya@acme.com",
  "sam@acme.com",
];
for (const server of SERVERS) {
  if (!server.audit_enabled) continue;
  for (const dep of server.deployments) {
    const actor =
      dep.build_info.trigger === "rollback"
        ? "system"
        : randomChoice(DEPLOYERS);
    audit(
      server.id,
      dep.id,
      dep.created_at,
      "deployment.created",
      actor,
      `Deployment ${dep.version} created (${dep.build_info.trigger})`,
      { version: dep.version, trigger: dep.build_info.trigger },
    );
  }
}
// weather: routine governance changes
audit(
  "srv_weather",
  null,
  hoursAgo(130),
  "api_key.rotated",
  "alice@acme.com",
  "API key key_live_c2d8 rotated",
  { key_id: "key_live_c2d8", reason: "scheduled rotation" },
);
audit(
  "srv_weather",
  null,
  hoursAgo(90),
  "rate_limit.changed",
  "bob@acme.com",
  "Rate limit changed from 60 to 120 rpm",
  { old_rpm: 60, new_rpm: 120 },
);
// payments: policy hardening, then the rotation that strands stale custom-sdk keys
audit(
  "srv_payments",
  null,
  hoursAgo(110),
  "auth_policy.changed",
  "alice@acme.com",
  "Auth policy changed from api_key to oauth",
  { old_policy: "api_key", new_policy: "oauth" },
);
audit(
  "srv_payments",
  null,
  PAYMENTS_KEY_ROTATED_AT,
  "api_key.rotated",
  "alice@acme.com",
  "API key key_live_7f3a rotated",
  { key_id: "key_live_7f3a", reason: "quarterly rotation" },
);
// crm: the rollback
audit(
  "srv_crm",
  "dep_crm_4",
  hoursAgo(35.5),
  "deployment.rolled_back",
  "system",
  "Deployment 1.3.0 rolled back to 1.2.0 after elevated error rate",
  {
    from_version: "1.3.0",
    to_version: "1.3.1",
    reason: "connection pool exhaustion",
  },
);
audit(
  "srv_crm",
  null,
  hoursAgo(100),
  "rate_limit.changed",
  "bob@acme.com",
  "Rate limit changed from 120 to 300 rpm",
  { old_rpm: 120, new_rpm: 300 },
);
// internal: the pause
audit(
  "srv_internal",
  null,
  hoursAgo(120),
  "auth_policy.changed",
  "sam@acme.com",
  "Auth policy changed from api_key to oauth",
  { old_policy: "api_key", new_policy: "oauth" },
);
audit(
  "srv_internal",
  null,
  INTERNAL_PAUSED_AT,
  "server.paused",
  "sam@acme.com",
  "Server paused",
  { reason: "decommission scheduled for end of quarter" },
);

// ── Insert ──────────────────────────────────────────────────
const insertServer = db.prepare(`
  INSERT INTO servers (id, name, display_name, description, status, source_type, source,
    auth_enabled, auth_policy, audit_enabled, rate_limit_enabled, rate_limit_rpm,
    current_deployment_id, created_at)
  VALUES (@id, @name, @display_name, @description, @status, @source_type, @source,
    @auth_enabled, @auth_policy, @audit_enabled, @rate_limit_enabled, @rate_limit_rpm,
    @current_deployment_id, @created_at)
`);
const insertDeployment = db.prepare(`
  INSERT INTO deployments (id, server_id, version, status, git_sha, build_info, created_at, superseded_at)
  VALUES (@id, @server_id, @version, @status, @git_sha, @build_info, @created_at, @superseded_at)
`);
const insertTool = db.prepare(`
  INSERT INTO tools (id, deployment_id, name, description, input_schema, is_new)
  VALUES (@id, @deployment_id, @name, @description, @input_schema, @is_new)
`);
const insertSession = db.prepare(`
  INSERT INTO sessions (id, deployment_id, server_id, client_name, client_version, protocol_version,
    auth_subject, started_at, ended_at, status, request_count, error_count)
  VALUES (@id, @deployment_id, @server_id, @client_name, @client_version, @protocol_version,
    @auth_subject, @started_at, @ended_at, @status, @request_count, @error_count)
`);
const insertLog = db.prepare(`
  INSERT INTO logs (id, session_id, deployment_id, server_id, ts, method, tool_name, status,
    error_code, error_message, latency_ms, request_body, response_body)
  VALUES (@id, @session_id, @deployment_id, @server_id, @ts, @method, @tool_name, @status,
    @error_code, @error_message, @latency_ms, @request_body, @response_body)
`);
const insertAudit = db.prepare(`
  INSERT INTO audit_events (id, server_id, deployment_id, ts, event_type, actor, summary, metadata)
  VALUES (@id, @server_id, @deployment_id, @ts, @event_type, @actor, @summary, @metadata)
`);

db.transaction(() => {
  let toolCount = 0;
  for (const server of SERVERS) {
    const live = server.deployments.find(
      (d) => d.status === "live" || d.status === "draining",
    );
    insertServer.run({
      ...server,
      source: JSON.stringify(server.source),
      current_deployment_id: live?.id ?? null,
      created_at: iso(server.created_at),
      deployments: undefined,
      sessionCount: undefined,
      sessionWindow: undefined,
      toolBias: undefined,
    } as Record<string, unknown>);

    let prevToolNames: Set<string> | null = null;
    for (const dep of server.deployments) {
      insertDeployment.run({
        id: dep.id,
        server_id: server.id,
        version: dep.version,
        status: dep.status,
        git_sha: dep.git_sha,
        build_info: JSON.stringify(dep.build_info),
        created_at: iso(dep.created_at),
        superseded_at: dep.superseded_at ? iso(dep.superseded_at) : null,
      });
      for (const td of dep.tools) {
        insertTool.run({
          id: `tool_${dep.id.replace("dep_", "")}_${td.name}`,
          deployment_id: dep.id,
          name: td.name,
          description: td.description,
          input_schema: JSON.stringify(td.schema),
          is_new: prevToolNames && !prevToolNames.has(td.name) ? 1 : 0,
        });
        toolCount++;
      }
      if (dep.tools.length > 0)
        prevToolNames = new Set(dep.tools.map((td) => td.name));
    }
  }
  for (const s of sessions)
    insertSession.run(s as unknown as Record<string, unknown>);
  for (const l of logs) insertLog.run(l as unknown as Record<string, unknown>);
  for (const a of auditEvents)
    insertAudit.run(a as unknown as Record<string, unknown>);

  console.log(
    `Seeded ${SERVERS.length} servers, ${SERVERS.reduce((n, s) => n + s.deployments.length, 0)} deployments, ` +
      `${toolCount} tools, ${sessions.length} sessions, ${logs.length} logs, ${auditEvents.length} audit events`,
  );
})();
