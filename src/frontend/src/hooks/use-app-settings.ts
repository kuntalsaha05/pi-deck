import { useCallback, useEffect, useState } from "react";
import type { AppSettings } from "../types/solver-types";

const STORAGE_KEY = "app-settings";

const DEFAULT_SETTINGS: AppSettings = {
  soundEnabled: true,
  volume: 70,
  animationSpeed: 1,
  theme: "system",
};

function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return {
        ...DEFAULT_SETTINGS,
        ...(JSON.parse(raw) as Partial<AppSettings>),
      };
    }
  } catch {
    // ignore
  }
  return { ...DEFAULT_SETTINGS };
}

export function useAppSettings() {
  const [settings, setSettings] = useState<AppSettings>(loadSettings);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // ignore
    }
  }, [settings]);

  const updateSettings = useCallback((partial: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  }, []);

  return { settings, updateSettings };
}
