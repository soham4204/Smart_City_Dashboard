// // frontend/src/app/layout.tsx
// src/app/layout.tsx

import type { Metadata } from 'next';
import './globals.css'; // Your global styles
import { DashboardProvider } from './StoreProvider'; // Import the provider

export const metadata: Metadata = {
  title: 'Smart City Dashboard',
  description: 'Real-time Cyber Security & Operations Center',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <DashboardProvider>
          {children}
        </DashboardProvider>
      </body>
    </html>
  );
}
// import type { Metadata } from "next";
// import { Inter } from "next/font/google";
// import "./globals.css";
// import StoreProvider from "./StoreProvider"; // Import the provider

// const inter = Inter({ subsets: ["latin"] });

// export const metadata: Metadata = {
//   title: "Smart City Dashboard",
//   description: "Unified Dashboard for Mumbai City Management",
// };

// export default function RootLayout({
//   children,
// }: Readonly<{
//   children: React.ReactNode;
// }>) {
//   return (
//     <html lang="en">
//       <body className={inter.className}>
//         <StoreProvider>{children}</StoreProvider> {/* Wrap the children */}
//       </body>
//     </html>
//   );
// }