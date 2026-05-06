import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LocalPulse AI — Your Marketing Strategist",
  description:
    "AI-powered marketing strategy for independent restaurant owners in Calgary. Strategic guidance on demand, at a price SMBs can sustain.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
