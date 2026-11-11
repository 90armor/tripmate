import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "TripMate",
    template: "%s · TripMate",
  },
  description: "Plan together. Travel smoothly. Settle easily.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Matches --background in globals.css (meta tags cannot read CSS variables).
  themeColor: "#f6f5f2",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
