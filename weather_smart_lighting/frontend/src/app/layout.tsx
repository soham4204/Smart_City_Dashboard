// frontend/src/app/layout.tsx
'use client'; // Required for hooks

import { Inter } from "next/font/google";
import "./globals.css";
import StoreProvider from "./StoreProvider";
import { useWebSocket } from "@/hooks/useWebsocket"; // Correct relative path

const inter = Inter({ subsets: ["latin"] });

// Metadata can't be exported from a client component, move to a parent if needed or handle with `document.title`
// export const metadata: Metadata = { ... };

function RootContent({ children }: { children: React.ReactNode }) {
  // Initialize WebSocket connection for the entire application lifetime
  useWebSocket();

  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StoreProvider>
      <RootContent>{children}</RootContent>
    </StoreProvider>
  );
}