"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_VARIANTS = {
  CREATED: "bg-slate-100 text-slate-700 border-slate-200",
  SENT: "bg-blue-50 text-blue-700 border-blue-200",
  BOOKED: "bg-cyan-50 text-cyan-700 border-cyan-200",
  CONFIRMED: "bg-green-50 text-green-700 border-green-200",
  ATTENDED: "bg-emerald-100 text-emerald-800 border-emerald-300",
  NO_SHOW: "bg-red-100 text-red-800 border-red-300",
  NEEDS_RESCHEDULE: "bg-amber-100 text-amber-800 border-amber-300",
  CLOSED: "bg-gray-100 text-gray-600 border-gray-200",
};

export function StatusBadge({ status, className }) {
  const variant = STATUS_VARIANTS[status] || STATUS_VARIANTS.CREATED;
  return (
    <Badge variant="outline" className={cn("font-medium", variant, className)}>
      {status?.replace(/_/g, " ") || "—"}
    </Badge>
  );
}
