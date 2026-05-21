import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "词源 · 英语学习工作台",
  description: "从词汇到开口的学习工作台",
};

export default function V2Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
