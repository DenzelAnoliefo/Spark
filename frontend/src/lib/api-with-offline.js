"use client";

/**
 * Wraps API calls to queue when offline.
 * Use this in components that need offline support.
 */
import { isOnline } from "./offline-queue";
import { addToOfflineQueue } from "./offline-queue";

export async function withOfflineSupport(fn, action = {}) {
  if (isOnline()) {
    return fn();
  }
  addToOfflineQueue({
    type: action.type || "unknown",
    payload: action.payload,
    queuedAt: new Date().toISOString(),
  });
  throw new Error("OFFLINE_QUEUED");
}
