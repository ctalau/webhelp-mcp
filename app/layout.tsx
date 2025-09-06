import { ReactNode } from "react";
import Script from "next/script";

export const metadata = {
  title: "WebHelp MCP Service",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        <Script
          src="https://cdn.jsdelivr.net/npm/particles.js@2.0.0/particles.min.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}

