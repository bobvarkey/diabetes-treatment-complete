import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type Theme = "light" | "dark" | "auto";
const KEY = "erx:theme";

type Ctx = { theme: Theme; setTheme: (t: Theme) => void; resolved: "light" | "dark" };
const ThemeCtx = createContext<Ctx>({ theme: "auto", setTheme: () => {}, resolved: "light" });

function apply(t: Theme) {
  if (typeof document === "undefined") return;
  const sysDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
  const dark = t === "dark" || (t === "auto" && sysDark);
  document.documentElement.classList.toggle("dark", dark);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("auto");

  useEffect(() => {
    const stored = (typeof localStorage !== "undefined" && localStorage.getItem(KEY)) as Theme | null;
    const initial: Theme = stored === "light" || stored === "dark" || stored === "auto" ? stored : "auto";
    setThemeState(initial);
    apply(initial);
  }, []);

  useEffect(() => {
    if (theme !== "auto") return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = () => apply("auto");
    mql.addEventListener("change", listener);
    return () => mql.removeEventListener("change", listener);
  }, [theme]);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    try { localStorage.setItem(KEY, t); } catch { /* ignore */ }
    apply(t);
  }, []);

  const resolved: "light" | "dark" =
    theme === "dark" ||
    (theme === "auto" && typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-color-scheme: dark)").matches)
      ? "dark" : "light";

  return <ThemeCtx.Provider value={{ theme, setTheme, resolved }}>{children}</ThemeCtx.Provider>;
}

export const useTheme = () => useContext(ThemeCtx);

/** Inline pre-hydration script that sets .dark before first paint (prevents flash). */
export const themeBootScript = `(function(){try{var t=localStorage.getItem('${KEY}')||'auto';var m=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches;var d=t==='dark'||(t==='auto'&&m);document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;
