"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const PRIORITY_VARIANTS = {
  High: "bg-red-50 text-red-700 border-red-200",
  Medium: "bg-amber-50 text-amber-700 border-amber-200",
  Low: "bg-slate-50 text-slate-600 border-slate-200",
};

export function PriorityBadge({ priority, className }) {
  const variant = PRIORITY_VARIANTS[priority] || PRIORITY_VARIANTS.Low;
  return (
    <Badge variant="outline" className={cn("font-medium", variant, className)}>
      {priority || "—"}
    </Badge>
  );
}
