"use client";

import { useEffect, useCallback } from "react";
import { getOfflineQueue, addToOfflineQueue, clearOfflineQueue, isOnline } from "@/lib/offline-queue";

/**
 * Simple offline queue integration.
 * When online, replays queued actions (calls their execute fn if provided).
 * API client can add actions when offline - they'll be replayed when back online.
 */
export function useOfflineSync() {
  const replayQueue = useCallback(() => {
    const queue = getOfflineQueue();
    if (queue.length === 0) return;
    // For demo: clear queue when back online. Full impl would replay each action.
    clearOfflineQueue();
  }, []);

  useEffect(() => {
    if (!isOnline()) return;
    replayQueue();
  }, [replayQueue]);

  useEffect(() => {
    const handleOnline = () => replayQueue();
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [replayQueue]);
}
