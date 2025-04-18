import type { Metadata } from "next";

// Disable console outputs
if (typeof window !== "undefined") {
  console.log = function () {};
  console.warn = function () {};
}
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import LayoutProvider from "../components/providers/LayoutProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CDEX SWAP",
  description: "CDEX SWAP",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
  ),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black`}
      >
        <LayoutProvider>{children}</LayoutProvider>
      </body>
    </html>
  );
}
