import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type JsonViewerProps = {
  title: string;
  value: Record<string, unknown> | null;
  defaultExpanded?: boolean;
  className?: string;
};

const formatJson = (value: Record<string, unknown> | null) => {
  if (!value) {
    return null;
  }

  return JSON.stringify(value, null, 2);
};

export const JsonViewer = ({
  title,
  value,
  defaultExpanded = true,
  className,
}: JsonViewerProps) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const formattedJson = useMemo(() => formatJson(value), [value]);
  const panelId = `${title.toLowerCase().replace(/\s+/g, "-")}-json-panel`;

  const handleCopy = async () => {
    if (!formattedJson) {
      return;
    }

    await navigator.clipboard.writeText(formattedJson);
  };

  return (
    <section
      className={cn(
        "overflow-hidden rounded-lg border border-border-soft bg-panel",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-border-soft px-3 py-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-[12px] font-semibold text-text hover:bg-panel-2 focus-visible:ring-ring"
          aria-expanded={expanded}
          aria-controls={panelId}
          onClick={() => setExpanded((previous) => !previous)}
        >
          {title}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="btn-toolbar h-6 px-2 text-[11px] focus-visible:ring-ring"
          aria-label={`Copy ${title} JSON`}
          disabled={!formattedJson}
          onClick={() => void handleCopy()}
        >
          Copy JSON
        </Button>
      </div>
      {expanded && (
        <div id={panelId} className="bg-panel-3 p-3">
          {formattedJson ? (
            <pre className="overflow-x-auto text-[11px] leading-relaxed whitespace-pre-wrap text-table-cell">
              {formattedJson}
            </pre>
          ) : (
            <p className="text-[12px] text-muted-foreground">No body</p>
          )}
        </div>
      )}
    </section>
  );
};
