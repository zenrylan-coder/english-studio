"use client";

import { useEffect, useState } from "react";

export type DeviceVariant = "mobile" | "tablet" | "desktop";

const TABLET_MQ = "(min-width: 768px) and (max-width: 1279px)";
const DESKTOP_MQ = "(min-width: 1280px)";

/**
 * Keep SSR and the first client frame on mobile to avoid hydration mismatch.
 * After mount, switch to tablet or desktop from media queries.
 */
export function useDeviceVariant(): DeviceVariant {
  const [variant, setVariant] = useState<DeviceVariant>("mobile");

  useEffect(() => {
    const tabletMq = window.matchMedia(TABLET_MQ);
    const desktopMq = window.matchMedia(DESKTOP_MQ);
    const apply = () => {
      if (desktopMq.matches) {
        setVariant("desktop");
        return;
      }
      if (tabletMq.matches) {
        setVariant("tablet");
        return;
      }
      setVariant("mobile");
    };

    apply();
    tabletMq.addEventListener("change", apply);
    desktopMq.addEventListener("change", apply);
    return () => {
      tabletMq.removeEventListener("change", apply);
      desktopMq.removeEventListener("change", apply);
    };
  }, []);

  return variant;
}