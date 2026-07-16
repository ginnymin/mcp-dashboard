export type PaginatedResponse<T> = {
  data: T[];
  total: number;
};

export type ServerSourceType = "github" | "gitlab" | "bitbucket" | "local";

export type ServerStatus = "active" | "paused" | "degraded";

export type Server = {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  status: ServerStatus;
  source_type: ServerSourceType;
  source: Record<string, unknown>;
  auth_enabled: boolean;
  auth_policy: string | null;
  audit_enabled: boolean;
  rate_limit_enabled: boolean;
  rate_limit_rpm: number | null;
  current_deployment_id: string | null;
  created_at: string;
  deployment_count?: number;
  open_session_count?: number;
  error_rate_24h?: number | null;
};

export type DeploymentStatus =
  | "live"
  | "superseded"
  | "rolled_back"
  | "draining"
  | "build_failed"
  | "building";

export type Deployment = {
  id: string;
  server_id: string;
  version: string;
  status: DeploymentStatus;
  git_sha: string | null;
  build_info: Record<string, unknown> | null;
  created_at: string;
  superseded_at: string | null;
  tool_count?: number;
  session_count?: number;
  error_count?: number;
};

export type DeploymentDetail = Deployment & {
  tools: Tool[];
};

export type Tool = {
  id: string;
  deployment_id: string;
  name: string;
  description: string | null;
  input_schema: Record<string, unknown>;
  is_new: boolean;
};

export type SessionStatus = "open" | "closed";

export type Session = {
  id: string;
  deployment_id: string;
  server_id: string;
  client_name: string;
  client_version: string | null;
  protocol_version: string;
  auth_subject: string | null;
  started_at: string;
  ended_at: string | null;
  status: SessionStatus;
  request_count: number;
  error_count: number;
};

export type SessionDetail = Session & {
  logs: LogSummary[];
};

export type LogStatus = "ok" | "error";

export type LogSummary = {
  id: string;
  session_id: string;
  deployment_id: string;
  server_id: string;
  ts: string;
  method: string;
  tool_name: string | null;
  status: LogStatus;
  error_code: number | null;
  error_message: string | null;
  latency_ms: number;
};

export type LogDetail = LogSummary & {
  request_body: Record<string, unknown> | null;
  response_body: Record<string, unknown> | null;
};

export type ServerStatsToolRow = {
  tool_name: string;
  count: number;
  error_count: number;
  error_rate: number;
  max_latency_ms: number;
};

export type ServerStatsDeploymentRow = {
  deployment_id: string;
  version: string;
  count: number;
  error_count: number;
  error_rate: number;
};

export type ServerStatsErrorCodeRow = {
  error_code: number;
  count: number;
};

export type ServerStats = {
  total_requests: number;
  error_rate: number | null;
  session_count: number;
  p50_latency_ms: number | null;
  p95_latency_ms: number | null;
  by_tool: ServerStatsToolRow[];
  by_deployment: ServerStatsDeploymentRow[];
  error_codes: ServerStatsErrorCodeRow[];
};

export type AuditEvent = {
  id: string;
  server_id: string;
  deployment_id: string | null;
  ts: string;
  event_type: string;
  actor: string;
  summary: string;
  metadata: Record<string, unknown> | null;
};

export type LogFilters = {
  serverId?: string;
  deploymentId?: string;
  sessionId?: string;
  toolName?: string;
  status?: string;
  errorCode?: string;
  method?: string;
  since?: string;
  until?: string;
  limit?: number;
  offset?: number;
};

export type SessionFilters = {
  serverId?: string;
  deploymentId?: string;
  clientName?: string;
  status?: string;
  since?: string;
  until?: string;
  limit?: number;
  offset?: number;
};

export type AuditFilters = {
  eventType?: string;
  since?: string;
  until?: string;
};
