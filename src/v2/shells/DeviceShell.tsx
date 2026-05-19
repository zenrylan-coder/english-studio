"use client";

import type { MobileLayoutProps } from "./MobileLayout";
import { DesktopLayout } from "./DesktopLayout";
import { MobileLayout } from "./MobileLayout";
import { TabletLayout } from "./TabletLayout";
import { useDeviceVariant } from "./useDeviceVariant";

export type DeviceShellProps = MobileLayoutProps;

/**
 * Step 3 routing: <768 mobile, 768-1279 tablet, >=1280 desktop.
 */
export function DeviceShell(props: DeviceShellProps) {
  const variant = useDeviceVariant();

  switch (variant) {
    case "desktop":
      return <DesktopLayout {...props} />;
    case "tablet":
      return <TabletLayout {...props} />;
    case "mobile":
    default:
      return <MobileLayout {...props} />;
  }
}