import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "JEE Tracker",
  description: "JEE preparation platform with custom authentication",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-100 font-sans">
        {children}
        {/* DEV ONLY — process.env.NODE_ENV is a build-time constant; Next.js
            tree-shakes this entire branch and its imports in production. */}
        {false && process.env.NODE_ENV === "development" && <DevOnlyPanel />}
      </body>
    </html>
  );
}

/**
 * Thin async wrapper that dynamically imports the DevPanel component.
 * The async import is co-located here so it's only ever reached when
 * NODE_ENV === "development" — the branch above short-circuits in prod.
 */
async function DevOnlyPanel() {
  const { DevPanel } = await import("@/components/dev/dev-panel");
  return <DevPanel />;
}
