import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "English Studio · V2 Study Workspace",
  description: "English Studio · V2 Study Workspace",
};

export default function V2Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
