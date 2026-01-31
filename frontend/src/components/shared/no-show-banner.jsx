"use client";

import { AlertTriangle } from "lucide-react";

export function NoShowBanner({ referral }) {
  const isNoShow = referral?.status === "NO_SHOW" || referral?.status === "NEEDS_RESCHEDULE";
  const aptNoShow = referral?.appointments?.some((a) => a.status === "NO_SHOW");
  if (!isNoShow && !aptNoShow) return null;
  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 text-amber-900 p-4 flex items-start gap-3">
      <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
      <div>
        <p className="font-semibold">No-show detected — Reschedule needed</p>
        <p className="text-sm mt-1 opacity-90">
          This triggers NEEDS_RESCHEDULE status and creates a nurse task. Please reschedule the appointment.
        </p>
      </div>
    </div>
  );
}
