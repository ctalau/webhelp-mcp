import type { ReactNode } from "react";

export const metadata = {
  title: "WebHelp Search MCP",
  description: "MCP server for Oxygen WebHelp documentation",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
