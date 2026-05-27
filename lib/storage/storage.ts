import { isBrowser } from "@/lib/browser-capabilities";

export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const supportsLocalStorage = () => {
  if (!isBrowser) {
    return false;
  }

  try {
    const key = "__storage_test__";
    window.localStorage.setItem(key, key);
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
};

const localStorageAdapter: StorageAdapter = {
  getItem(key: string) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem(key: string, value: string) {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // no-op when storage is unavailable
    }
  },
  removeItem(key: string) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // no-op when storage is unavailable
    }
  },
};

const noopStorageAdapter: StorageAdapter = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

const capacitorStorageAdapter: StorageAdapter = {
  getItem: (key: string) => {
    if (!isBrowser || typeof (window as any).Capacitor === "undefined") {
      return null;
    }
    return null;
  },
  setItem: (key: string, value: string) => {
    // Placeholder for Capacitor Storage integration.
  },
  removeItem: (key: string) => {
    // Placeholder for Capacitor Storage integration.
  },
};

export const storage: StorageAdapter = supportsLocalStorage()
  ? localStorageAdapter
  : capacitorStorageAdapter;
