"use client";

const OFFLINE_QUEUE_KEY = "closed-loop-offline-queue";

export function getOfflineQueue() {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function addToOfflineQueue(action) {
  const queue = getOfflineQueue();
  queue.push({
    ...action,
    id: `q-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    queuedAt: new Date().toISOString(),
  });
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
}

export function clearOfflineQueue() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(OFFLINE_QUEUE_KEY);
}

export function removeFromOfflineQueue(id) {
  const queue = getOfflineQueue().filter((a) => a.id !== id);
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
}

export function isOnline() {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine;
}
