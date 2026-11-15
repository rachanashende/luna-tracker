import type { Metadata } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { getSupabaseUserClient } from "@/lib/supabase-server";
import { ThemeProvider } from "@/components/theme-provider";
import { NavShell } from "@/components/nav-shell";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600"],
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Luna",
  description:
    "A personal productivity hub — calendar, notes, journal, pomodoro, and AI study planning.",
};

// Runs before hydration so the correct theme class is present on first
// paint — avoids a flash of the wrong theme when localStorage says "dark"
// but the server-rendered HTML has no class yet.
const themeInitScript = `
(function () {
  try {
    var stored = window.localStorage.getItem("luna-theme");
    var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    var isDark = stored ? stored === "dark" : prefersDark;
    if (isDark) document.documentElement.classList.add("dark");
  } catch (e) {}
})();
`;

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authenticated = (await getSupabaseUserClient()) !== null;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body
        className={`${fraunces.variable} ${plusJakarta.variable} antialiased`}
      >
        <ThemeProvider>
          {authenticated ? <NavShell>{children}</NavShell> : children}
        </ThemeProvider>
      </body>
    </html>
  );
}
