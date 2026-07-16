import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { Input } from "@/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/Select";
import { useDeployments } from "@/hooks/queries/useDeployments";
import { useServers } from "@/hooks/queries/useServers";
import { useUrlFilters } from "@/hooks/useUrlFilters";
import type { LogFilters as LogFiltersState } from "@/lib/api/types";
import { logFilterDefaults, logFilterSchema } from "@/lib/url-state";

const ALL_FILTER_VALUE = "__all__";
const TEXT_FILTER_DEBOUNCE_MS = 300;

const METHOD_OPTIONS = [
  { value: ALL_FILTER_VALUE, label: "All methods" },
  { value: "initialize", label: "initialize" },
  { value: "tools/list", label: "tools/list" },
  { value: "tools/call", label: "tools/call" },
] as const;

const STATUS_OPTIONS = [
  { value: ALL_FILTER_VALUE, label: "All statuses" },
  { value: "ok", label: "ok" },
  { value: "error", label: "error" },
] as const;

const filterFieldClassName = "flex min-w-[140px] flex-1 flex-col gap-1";

type TextFilterKey = "sessionId" | "toolName" | "errorCode";

const getServerLabel = (
  serverId: string | undefined,
  servers: Array<{ id: string; display_name: string }>,
) => {
  if (!serverId) {
    return "All servers";
  }

  return (
    servers.find((server) => server.id === serverId)?.display_name ?? serverId
  );
};

const getDeploymentLabel = (
  deploymentId: string | undefined,
  deployments: Array<{ id: string; version: string }>,
) => {
  if (!deploymentId) {
    return "All deployments";
  }

  return (
    deployments.find((deployment) => deployment.id === deploymentId)?.version ??
    deploymentId
  );
};

const getMethodLabel = (method: string | undefined) =>
  METHOD_OPTIONS.find((option) => option.value === (method ?? ALL_FILTER_VALUE))
    ?.label ?? "All methods";

const getStatusLabel = (status: string | undefined) =>
  STATUS_OPTIONS.find((option) => option.value === (status ?? ALL_FILTER_VALUE))
    ?.label ?? "All statuses";

const isUserSelectChange = (eventDetails: { reason: string }) =>
  eventDetails.reason === "item-press" ||
  eventDetails.reason === "list-navigation" ||
  eventDetails.reason === "keyboard";

const useDebouncedTextFilter = (
  filterKey: TextFilterKey,
  filters: LogFiltersState,
  setFilters: ReturnType<typeof useUrlFilters<LogFiltersState>>["setFilters"],
) => {
  const [input, setInput] = useState(filters[filterKey] ?? "");
  const debounceRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // useEffect(() => {
  //   setInput(filters[filterKey] ?? "");
  // }, [filterKey, filters[filterKey]]);

  useEffect(
    () => () => {
      if (debounceRef.current !== undefined) {
        clearTimeout(debounceRef.current);
      }
    },
    [],
  );

  const onChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setInput(value);

      if (debounceRef.current !== undefined) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        debounceRef.current = undefined;
        setFilters({
          [filterKey]: value || undefined,
          offset: 0,
        });
      }, TEXT_FILTER_DEBOUNCE_MS);
    },
    [filterKey, setFilters],
  );

  const cancel = useCallback(() => {
    if (debounceRef.current !== undefined) {
      clearTimeout(debounceRef.current);
      debounceRef.current = undefined;
    }
  }, []);

  return { input, onChange, cancel };
};

export const LogFilters = () => {
  const { filters, setFilters } = useUrlFilters(
    logFilterSchema,
    logFilterDefaults,
  );
  const { data: serversData } = useServers();
  const servers = serversData?.data ?? [];
  const { data: deploymentsData } = useDeployments(filters.serverId);
  const deployments = deploymentsData?.data ?? [];
  const sessionIdFilter = useDebouncedTextFilter(
    "sessionId",
    filters,
    setFilters,
  );
  const toolNameFilter = useDebouncedTextFilter(
    "toolName",
    filters,
    setFilters,
  );
  const errorCodeFilter = useDebouncedTextFilter(
    "errorCode",
    filters,
    setFilters,
  );

  const applyImmediateFilters = (
    updates: Partial<LogFiltersState>,
    options?: { includePendingText?: boolean },
  ) => {
    if (options?.includePendingText) {
      sessionIdFilter.cancel();
      toolNameFilter.cancel();
      errorCodeFilter.cancel();
    }

    setFilters({
      ...(options?.includePendingText
        ? {
            sessionId: sessionIdFilter.input || undefined,
            toolName: toolNameFilter.input || undefined,
            errorCode: errorCodeFilter.input || undefined,
          }
        : undefined),
      ...updates,
    });
  };

  return (
    <div
      className="shrink-0 space-y-3 px-4 pt-3 pb-1"
      data-testid="log-filters"
    >
      <div className="flex flex-wrap items-end gap-3">
        <div className={filterFieldClassName}>
          <span id="log-filter-server-label" className="sr-only">
            Server
          </span>
          <Select
            value={filters.serverId ?? ALL_FILTER_VALUE}
            onValueChange={(value, eventDetails) => {
              if (!isUserSelectChange(eventDetails)) {
                return;
              }

              const nextServerId =
                value === ALL_FILTER_VALUE || !value
                  ? undefined
                  : (value ?? undefined);

              if (nextServerId === filters.serverId) {
                return;
              }

              applyImmediateFilters(
                {
                  serverId: nextServerId,
                  deploymentId: undefined,
                  offset: 0,
                },
                { includePendingText: true },
              );
            }}
          >
            <SelectTrigger
              aria-labelledby="log-filter-server-label"
              aria-label="Server"
              className="w-full min-w-[160px]"
            >
              <span className="flex flex-1 text-left">
                {getServerLabel(filters.serverId, servers)}
              </span>
            </SelectTrigger>
            <SelectContent align="start">
              <SelectItem value={ALL_FILTER_VALUE}>All servers</SelectItem>
              {servers.map((server) => (
                <SelectItem key={server.id} value={server.id}>
                  {server.display_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className={filterFieldClassName}>
          <span id="log-filter-deployment-label" className="sr-only">
            Deployment
          </span>
          <Select
            value={filters.deploymentId ?? ALL_FILTER_VALUE}
            disabled={!filters.serverId}
            onValueChange={(value, eventDetails) => {
              if (!isUserSelectChange(eventDetails)) {
                return;
              }

              applyImmediateFilters({
                deploymentId:
                  value === ALL_FILTER_VALUE ? undefined : (value ?? undefined),
                offset: 0,
              });
            }}
          >
            <SelectTrigger
              aria-labelledby="log-filter-deployment-label"
              aria-label="Deployment"
              className="w-full min-w-[160px]"
              disabled={!filters.serverId}
            >
              <span className="flex flex-1 text-left">
                {getDeploymentLabel(filters.deploymentId, deployments)}
              </span>
            </SelectTrigger>
            <SelectContent align="start">
              <SelectItem value={ALL_FILTER_VALUE}>All deployments</SelectItem>
              {deployments.map((deployment) => (
                <SelectItem key={deployment.id} value={deployment.id}>
                  {deployment.version}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <label htmlFor="log-filter-session-id" className={filterFieldClassName}>
          <span className="sr-only">Session ID</span>
          <Input
            id="log-filter-session-id"
            aria-label="Session ID"
            placeholder="Session ID"
            value={sessionIdFilter.input}
            onChange={sessionIdFilter.onChange}
          />
        </label>

        <label htmlFor="log-filter-tool-name" className={filterFieldClassName}>
          <span className="sr-only">Tool name</span>
          <Input
            id="log-filter-tool-name"
            aria-label="Tool name"
            placeholder="Filter by tool name"
            value={toolNameFilter.input}
            onChange={toolNameFilter.onChange}
          />
        </label>

        <div className="flex min-w-[140px] flex-col gap-1">
          <span id="log-filter-method-label" className="sr-only">
            Method
          </span>
          <Select
            value={filters.method ?? ALL_FILTER_VALUE}
            onValueChange={(value, eventDetails) => {
              if (!isUserSelectChange(eventDetails)) {
                return;
              }

              applyImmediateFilters({
                method:
                  value === ALL_FILTER_VALUE ? undefined : (value ?? undefined),
                offset: 0,
              });
            }}
          >
            <SelectTrigger
              aria-labelledby="log-filter-method-label"
              aria-label="Method"
              className="w-full"
            >
              <span className="flex flex-1 text-left">
                {getMethodLabel(filters.method)}
              </span>
            </SelectTrigger>
            <SelectContent align="start">
              {METHOD_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex min-w-[120px] flex-col gap-1">
          <span id="log-filter-status-label" className="sr-only">
            Status
          </span>
          <Select
            value={filters.status ?? ALL_FILTER_VALUE}
            onValueChange={(value, eventDetails) => {
              if (!isUserSelectChange(eventDetails)) {
                return;
              }

              applyImmediateFilters({
                status:
                  value === ALL_FILTER_VALUE ? undefined : (value ?? undefined),
                offset: 0,
              });
            }}
          >
            <SelectTrigger
              aria-labelledby="log-filter-status-label"
              aria-label="Status"
              className="w-full"
            >
              <span className="flex flex-1 text-left">
                {getStatusLabel(filters.status)}
              </span>
            </SelectTrigger>
            <SelectContent align="start">
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <label htmlFor="log-filter-error-code" className={filterFieldClassName}>
          <span className="sr-only">Error code</span>
          <Input
            id="log-filter-error-code"
            aria-label="Error code"
            placeholder="Error code"
            value={errorCodeFilter.input}
            onChange={errorCodeFilter.onChange}
          />
        </label>
      </div>
    </div>
  );
};
