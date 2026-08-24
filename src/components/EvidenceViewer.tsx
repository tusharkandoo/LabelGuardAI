import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CheckStatus, EvidenceBox } from "@/lib/types";

export function EvidenceViewer({
  image,
  boxes,
  activeField,
  statusOf,
  onSelect,
}: {
  image?: string | undefined;
  boxes: EvidenceBox[];
  activeField?: string | undefined;
  statusOf: (field: string) => CheckStatus | undefined;
  onSelect: (field: string) => void;
}) {
  const toneFor = (status?: CheckStatus) =>
    status === "FAIL"
      ? "border-destructive bg-destructive/12"
      : status === "WARN"
        ? "border-warning bg-warning/15"
        : status === "REVIEW"
          ? "border-info bg-info/12"
          : "border-success bg-success/10";

  return (
    <div className="relative overflow-hidden rounded-lg border border-border bg-surface">
      {image ? (
        <img src={image} alt="Packaged commodity label under inspection" className="block w-full" />
      ) : (
        <div className="flex aspect-[4/5] w-full flex-col items-center justify-center gap-2 text-muted-foreground">
          <ImageOff className="h-8 w-8" />
          <p className="text-xs">No label image attached to this inspection</p>
        </div>
      )}

      {image &&
        boxes.map((box) => {
          const status = statusOf(box.field);
          const active = activeField === box.field;
          return (
            <button
              key={box.field + box.text}
              onClick={() => onSelect(box.field)}
              style={{
                left: `${box.x * 100}%`,
                top: `${box.y * 100}%`,
                width: `${box.w * 100}%`,
                height: `${box.h * 100}%`,
              }}
              className={cn(
                "absolute rounded-[3px] border-2 transition-all",
                toneFor(status),
                active ? "ring-2 ring-ring ring-offset-1" : "opacity-80 hover:opacity-100",
              )}
              title={box.text}
            >
              <span
                className={cn(
                  "absolute -top-5 left-0 max-w-[220px] truncate rounded-sm px-1.5 py-0.5 text-[10px] font-semibold",
                  status === "FAIL"
                    ? "bg-destructive text-destructive-foreground"
                    : status === "WARN"
                      ? "bg-warning text-warning-foreground"
                      : status === "REVIEW"
                        ? "bg-info text-info-foreground"
                        : "bg-success text-success-foreground",
                )}
              >
                {box.field} · {Math.round(box.confidence * 100)}%
              </span>
            </button>
          );
        })}
    </div>
  );
}
