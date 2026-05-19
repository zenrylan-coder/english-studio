import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "English Studio",
  description: "English Studio",
  applicationName: "English Studio",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "English Studio",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/pwa-192x192.svg", sizes: "192x192", type: "image/svg+xml" },
      { url: "/pwa-512x512.svg", sizes: "512x512", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-touch-icon.svg", sizes: "180x180", type: "image/svg+xml" }],
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: "#175DC5",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
