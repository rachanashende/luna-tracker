"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type Theme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = "luna-theme";

export function ThemeProvider({ children }: { children: ReactNode }) {
  // The inline script in app/layout.tsx already set the `.dark` class (or
  // not) on <html> before hydration, so we just read that back to stay in
  // sync without causing a flash.
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const initial = document.documentElement.classList.contains("dark")
      ? "dark"
      : "light";
    // Reading the class the inline theme-init script already applied to
    // <html> (before hydration) into React state. This has to happen in an
    // effect — doing it during render would mismatch between server and
    // client — and it's a one-time sync, not a cascading update.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(initial);
  }, []);

  function toggleTheme() {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      document.documentElement.classList.toggle("dark", next === "dark");
      window.localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}

export const THEME_STORAGE_KEY = STORAGE_KEY;
