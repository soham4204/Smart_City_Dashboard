// frontend/src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import StoreProvider from "./StoreProvider"; // Import the provider

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Smart City Dashboard",
  description: "Unified Dashboard for Mumbai City Management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <StoreProvider>{children}</StoreProvider> {/* Wrap the children */}
      </body>
    </html>
  );
}