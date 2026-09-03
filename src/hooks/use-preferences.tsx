import { useCallback, useEffect, useState } from "react";

export type PreferenceKey = "density" | "motion" | "kbdHints";

type Preferences = Record<PreferenceKey, boolean>;

const STORAGE_KEY = "autarch:preferences";

const DEFAULTS: Preferences = { density: false, motion: false, kbdHints: false };

function read(): Preferences {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Preferences>) };
  } catch {
    return DEFAULTS;
  }
}

function apply(prefs: Preferences) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.dataset["density"] = prefs.density ? "compact" : "comfortable";
  root.dataset["motion"] = prefs.motion ? "reduced" : "full";
  root.dataset["kbdHints"] = prefs.kbdHints ? "on" : "off";
}

export function usePreferences() {
  const [prefs, setPrefs] = useState<Preferences>(DEFAULTS);

  useEffect(() => {
    const next = read();
    setPrefs(next);
    apply(next);
  }, []);

  const setPreference = useCallback((key: PreferenceKey, value: boolean) => {
    setPrefs((current) => {
      const next = { ...current, [key]: value };
      apply(next);
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* storage unavailable */
      }
      return next;
    });
  }, []);

  return { prefs, setPreference };
}
