import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/Select";
import { useUrlFilters } from "@/hooks/useUrlFilters";
import {
  AUDIT_EVENT_TYPE_OPTIONS,
  formatEventTypeLabel,
} from "@/components/domain/audit/audit-utils";
import { auditFilterDefaults, auditFilterSchema } from "@/lib/url-state";

const ALL_FILTER_VALUE = "__all__";

const filterFieldClassName = "flex min-w-[180px] flex-1 flex-col gap-1";

const getEventTypeLabel = (eventType: string | undefined) => {
  if (!eventType) {
    return "All event types";
  }

  return formatEventTypeLabel(eventType);
};

export const AuditFilters = () => {
  const { filters, setFilters } = useUrlFilters(
    auditFilterSchema,
    auditFilterDefaults,
  );

  return (
    <div
      className="shrink-0 space-y-3 px-4 pt-3 pb-0"
      data-testid="audit-filters"
    >
      <div className="flex flex-wrap items-end gap-3">
        <div className={filterFieldClassName}>
          <span id="audit-filter-event-type-label" className="sr-only">
            Event type
          </span>
          <Select
            value={filters.eventType ?? ALL_FILTER_VALUE}
            onValueChange={(value) =>
              setFilters({
                eventType:
                  value === ALL_FILTER_VALUE ? undefined : (value ?? undefined),
              })
            }
          >
            <SelectTrigger
              aria-labelledby="audit-filter-event-type-label"
              className="btn-toolbar h-8 w-full text-[12px]"
            >
              <span className="flex flex-1 text-left">
                {getEventTypeLabel(filters.eventType)}
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_FILTER_VALUE}>All event types</SelectItem>
              {AUDIT_EVENT_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};
