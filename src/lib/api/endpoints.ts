import { apiGet } from "@/lib/api/client";
import type {
  AuditEvent,
  AuditFilters,
  Deployment,
  DeploymentDetail,
  LogDetail,
  LogFilters,
  LogSummary,
  PaginatedResponse,
  Server,
  ServerStats,
  Session,
  SessionDetail,
  SessionFilters,
} from "@/lib/api/types";

const toQueryParams = (
  params?: Record<string, string | number | undefined>,
): Record<string, string | number | undefined> | undefined => {
  if (!params) {
    return undefined;
  }

  const entries = Object.entries(params).filter(
    ([, value]) => value !== undefined && value !== "",
  );

  if (entries.length === 0) {
    return undefined;
  }

  return Object.fromEntries(entries);
};

export const fetchServers = (params: { since: string; until?: string }) =>
  apiGet<PaginatedResponse<Server>>("/servers", toQueryParams(params));

export const fetchServer = (id: string) => apiGet<Server>(`/servers/${id}`);

export const fetchServerStats = (id: string, since?: string) =>
  apiGet<ServerStats>(`/servers/${id}/stats`, toQueryParams({ since }));

export const fetchDeployments = (serverId: string) =>
  apiGet<PaginatedResponse<Deployment>>(`/servers/${serverId}/deployments`);

export const fetchDeployment = (id: string) =>
  apiGet<DeploymentDetail>(`/deployments/${id}`);

export const fetchSessions = (filters: SessionFilters = {}) =>
  apiGet<PaginatedResponse<Session>>("/sessions", toQueryParams(filters));

export const fetchSession = (id: string) =>
  apiGet<SessionDetail>(`/sessions/${id}`);

export const fetchLogs = (filters: LogFilters = {}) =>
  apiGet<PaginatedResponse<LogSummary>>("/logs", toQueryParams(filters));

export const fetchLog = (id: string) => apiGet<LogDetail>(`/logs/${id}`);

export const fetchAuditEvents = (
  serverId: string,
  filters: AuditFilters = {},
) =>
  apiGet<PaginatedResponse<AuditEvent>>(
    `/servers/${serverId}/audit`,
    toQueryParams(filters),
  );
