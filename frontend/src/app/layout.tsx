import type { Metadata, Viewport } from "next";
import { Inter, Poppins, Fredoka } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-inter",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
  variable: "--font-poppins",
});

const fredoka = Fredoka({
  subsets: ["latin"],
  weight: ["600"],
  display: "swap",
  variable: "--font-fredoka",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://agenzy.online"),
  title: "Agenzy | Your AI marketing strategist",
  description:
    "Agenzy helps independent local business owners decide what to do next, why it matters, and what results to watch.",
};

export const viewport: Viewport = {
  themeColor: "#6840DE",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable} ${fredoka.variable}`}>
      <body>{children}</body>
    </html>
  );
}
