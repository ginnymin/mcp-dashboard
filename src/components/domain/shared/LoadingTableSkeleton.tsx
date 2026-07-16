import { Skeleton } from "@/components/ui/Skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { cn } from "@/lib/utils";

type LoadingTableSkeletonProps = {
  columns?: number;
  rows?: number;
  className?: string;
};

export const LoadingTableSkeleton = ({
  columns = 4,
  rows = 5,
  className,
}: LoadingTableSkeletonProps) => {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-border-soft bg-panel",
        className,
      )}
      aria-busy="true"
      aria-label="Loading table data"
    >
      <Table>
        <TableHeader>
          <TableRow className="border-table-row-border hover:bg-transparent">
            {Array.from({ length: columns }).map((_, i) => (
              <TableHead
                key={i}
                className="h-8 text-[11px] font-semibold text-faint"
              >
                <Skeleton className="h-3 w-16 bg-panel-3" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <TableRow
              key={rowIndex}
              className="border-table-row-border hover:bg-transparent"
            >
              {Array.from({ length: columns }).map((_, colIndex) => (
                <TableCell
                  key={colIndex}
                  className="text-[12px] text-table-cell"
                >
                  <Skeleton className="h-3 w-full max-w-[120px] bg-panel-3" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
