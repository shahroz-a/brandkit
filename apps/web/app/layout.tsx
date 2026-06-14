import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BrandKit OS",
  description: "Open-source developer branding toolkit for deterministic brand assets.",
  openGraph: {
    title: "BrandKit OS",
    description: "Generate deterministic brand assets locally.",
    type: "website"
  }
};

export const viewport: Viewport = {
  themeColor: "#2563EB"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
