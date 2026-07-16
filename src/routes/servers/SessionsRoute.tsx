import { SessionFilters } from "@/components/domain/sessions/SessionFilters";
import { SessionsTable } from "@/components/domain/sessions/SessionsTable";

export const SessionsRoute = () => {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SessionFilters />
      <SessionsTable />
    </div>
  );
};
