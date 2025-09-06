import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "WebHelp Search MCP",
  description: "MCP server for Oxygen WebHelp documentation",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
