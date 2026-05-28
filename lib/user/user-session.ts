import { storage } from "@/lib/storage/storage";
import { UserMetadata, USER_META_STORAGE_KEY } from "./user-metadata";

function generateId(prefix: string) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}

function nowIso() {
  return new Date().toISOString();
}

export function getOrCreateUserMetadata(): UserMetadata {
  try {
    const raw = storage.getItem(USER_META_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as UserMetadata;
      const updated = { ...parsed, lastActiveAt: nowIso() };
      storage.setItem(USER_META_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    }
  } catch {
    // ignore
  }

  const created: UserMetadata = {
    anonymousUserId: generateId("anon"),
    deviceId: generateId("dev"),
    createdAt: nowIso(),
    lastActiveAt: nowIso(),
  };

  try {
    storage.setItem(USER_META_STORAGE_KEY, JSON.stringify(created));
  } catch {
    // ignore
  }

  return created;
}

export function refreshLastActive() {
  try {
    const raw = storage.getItem(USER_META_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as UserMetadata;
    parsed.lastActiveAt = nowIso();
    storage.setItem(USER_META_STORAGE_KEY, JSON.stringify(parsed));
  } catch {
    // ignore
  }
}
