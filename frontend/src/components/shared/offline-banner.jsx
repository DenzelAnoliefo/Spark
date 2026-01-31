"use client";

import { WifiOff } from "lucide-react";

export function OfflineBanner({ offline }) {
  if (!offline) return null;
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-amber-950 py-2 px-4 text-center text-sm font-medium flex items-center justify-center gap-2">
      <WifiOff className="h-4 w-4" />
      Offline mode: changes will be queued and synced when back online
    </div>
  );
}
