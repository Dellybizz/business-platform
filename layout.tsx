import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Modular Business Platform",
  description: "Build online stores, service websites, portfolios and more from one modular platform.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
