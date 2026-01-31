"use client";

import { cn } from "@/lib/utils";

export function LoadingSpinner({ className }) {
  return (
    <div
      className={cn(
        "animate-spin rounded-full border-2 border-muted border-t-primary h-6 w-6",
        className
      )}
    />
  );
}
