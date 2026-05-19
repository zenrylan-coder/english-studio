"use client";

import { createContext, useContext } from "react";

const DesktopVisualContext = createContext(false);

/** Scoped to DesktopLayout content so Mobile / Tablet visuals stay untouched. */
export function DesktopVisualScope({ children }: { children: React.ReactNode }) {
  return <DesktopVisualContext.Provider value={true}>{children}</DesktopVisualContext.Provider>;
}

export function useInsideDesktopVisualScope() {
  return useContext(DesktopVisualContext);
}
