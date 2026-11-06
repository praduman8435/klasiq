"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * Dark is the storefront's home theme; light is the visitor's choice,
 * remembered in their browser. Applied as html[data-theme] before first
 * paint (next-themes' inline script), so cached pages never flash.
 * `data-theme`, not the `dark` class: `.dark` is a legacy token block.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="data-theme"
      themes={["dark", "light"]}
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
