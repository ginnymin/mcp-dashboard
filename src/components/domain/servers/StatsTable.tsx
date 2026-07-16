import type { ReactNode } from "react";
import { EmptyState } from "@/components/domain/shared/EmptyState";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { cn } from "@/lib/utils";

type StatsTableColumn<T> = {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
};

type StatsTableProps<T> = {
  title: string;
  headerAction?: ReactNode;
  columns: StatsTableColumn<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  emptyTitle?: string;
  className?: string;
};

export const StatsTable = <T,>({
  title,
  headerAction,
  columns,
  rows,
  getRowKey,
  onRowClick,
  emptyTitle = "No data for this range",
  className,
}: StatsTableProps<T>) => {
  return (
    <section className={cn("space-y-2", className)}>
      <div className="flex items-center gap-3">
        <h3 className="text-[13px] font-semibold text-text">{title}</h3>
        {headerAction}
      </div>
      {rows.length === 0 ? (
        <EmptyState title={emptyTitle} className="py-8" />
      ) : (
        <div className="overflow-hidden rounded-lg border border-border-soft bg-panel">
          <Table>
            <TableHeader>
              <TableRow className="border-table-row-border hover:bg-transparent">
                {columns.map((column) => (
                  <TableHead
                    key={column.key}
                    className={cn(
                      "h-8 text-[11px] font-semibold uppercase text-faint px-2",
                      column.className,
                    )}
                  >
                    {column.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const rowKey = getRowKey(row);
                const isInteractive = Boolean(onRowClick);

                return (
                  <TableRow
                    key={rowKey}
                    tabIndex={isInteractive ? 0 : undefined}
                    role={isInteractive ? "link" : undefined}
                    className={cn(
                      "border-table-row-border",
                      isInteractive &&
                        "group/stats-row cursor-pointer outline-none hover:bg-panel-2 focus-visible:bg-panel-2 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset active:bg-panel-3",
                    )}
                    onClick={
                      isInteractive ? () => onRowClick?.(row) : undefined
                    }
                    onKeyDown={
                      isInteractive
                        ? (event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              onRowClick?.(row);
                            }
                          }
                        : undefined
                    }
                  >
                    {columns.map((column) => (
                      <TableCell
                        key={column.key}
                        className={cn(
                          "text-[12px] text-table-cell",
                          column.className,
                        )}
                      >
                        {column.cell(row)}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  );
};
