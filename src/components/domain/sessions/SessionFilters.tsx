import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Input } from "@/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/Select";
import { useDeployments } from "@/hooks/queries/useDeployments";
import { useUrlFilters } from "@/hooks/useUrlFilters";
import { sessionFilterDefaults, sessionFilterSchema } from "@/lib/url-state";

const ALL_FILTER_VALUE = "__all__";

const STATUS_OPTIONS = [
  { value: ALL_FILTER_VALUE, label: "All statuses" },
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
] as const;

const filterFieldClassName = "flex min-w-[160px] flex-1 flex-col gap-1";

const CLIENT_NAME_FILTER_DEBOUNCE_MS = 300;

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

const getStatusLabel = (status: string | undefined) =>
  STATUS_OPTIONS.find((option) => option.value === (status ?? ALL_FILTER_VALUE))
    ?.label ?? "All statuses";

export const SessionFilters = () => {
  const { serverId } = useParams();
  const { filters, setFilters } = useUrlFilters(
    sessionFilterSchema,
    sessionFilterDefaults,
  );
  const { data: deploymentsData } = useDeployments(serverId);
  const deployments = deploymentsData?.data ?? [];
  const [clientNameInput, setClientNameInput] = useState(
    filters.clientName ?? "",
  );
  const clientNameDebounceRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // cleanup debounce timeout when unmounting
  useEffect(
    () => () => {
      if (clientNameDebounceRef.current !== undefined) {
        clearTimeout(clientNameDebounceRef.current);
      }
    },
    [],
  );

  const handleClientNameChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setClientNameInput(value);

      if (clientNameDebounceRef.current !== undefined) {
        clearTimeout(clientNameDebounceRef.current);
      }

      clientNameDebounceRef.current = setTimeout(() => {
        setFilters({
          clientName: value || undefined,
          offset: 0,
        });
      }, CLIENT_NAME_FILTER_DEBOUNCE_MS);
    },
    [setFilters],
  );

  return (
    <div
      className="flex flex-wrap items-end gap-3 px-4 pt-3 pb-0"
      data-testid="session-filters"
    >
      <div className={filterFieldClassName}>
        <span id="session-filter-deployment-label" className="sr-only">
          Deployment
        </span>
        <Select
          value={filters.deploymentId ?? ALL_FILTER_VALUE}
          onValueChange={(value) =>
            setFilters({
              deploymentId:
                value === ALL_FILTER_VALUE ? undefined : (value ?? undefined),
              offset: 0,
            })
          }
        >
          <SelectTrigger
            aria-labelledby="session-filter-deployment-label"
            aria-label="Deployment"
            className="w-full min-w-[160px]"
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

      <label
        htmlFor="session-filter-client-name"
        className={filterFieldClassName}
      >
        <span className="sr-only">Client name</span>
        <Input
          id="session-filter-client-name"
          aria-label="Client name"
          placeholder="Filter by client name"
          value={clientNameInput}
          onChange={handleClientNameChange}
        />
      </label>

      <div className="flex min-w-[140px] flex-col gap-1">
        <span id="session-filter-status-label" className="sr-only">
          Status
        </span>
        <Select
          value={filters.status ?? ALL_FILTER_VALUE}
          onValueChange={(value) =>
            setFilters({
              status:
                value === ALL_FILTER_VALUE ? undefined : (value ?? undefined),
              offset: 0,
            })
          }
        >
          <SelectTrigger
            aria-labelledby="session-filter-status-label"
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
    </div>
  );
};
