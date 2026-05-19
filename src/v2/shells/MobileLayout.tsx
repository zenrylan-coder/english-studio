"use client";

import type { ReactNode } from "react";

import type { PhoneShellTab } from "@/components/v2/PhoneShell";
import { PhoneShell } from "@/components/v2/PhoneShell";

export type MobileLayoutProps = {
  children: ReactNode;
  tabs: PhoneShellTab[];
  activeTab: string;
  onTab: (key: string) => void;
  immersiveCall?: boolean;
};

/** 移动端壳：与历史实现一致，直接委托给 PhoneShell。 */
export function MobileLayout({ children, tabs, activeTab, onTab, immersiveCall }: MobileLayoutProps) {
  return (
    <PhoneShell tabs={tabs} activeTab={activeTab} onTab={onTab} immersiveCall={immersiveCall}>
      {children}
    </PhoneShell>
  );
}
