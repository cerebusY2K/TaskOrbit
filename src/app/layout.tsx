import type { Metadata, Viewport } from "next";
import { Fraunces, Outfit } from "next/font/google";
import { ServiceWorker } from "@/components/ServiceWorker";
import { VisitTracker } from "@/components/VisitTracker";
import { SITE_DESCRIPTION, SITE_TITLE, SITE_URL } from "@/lib/site";
import "./globals.css";

const sans = Outfit({ subsets: ["latin"], variable: "--font-sans" });
const display = Fraunces({ subsets: ["latin"], variable: "--font-display" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_TITLE, template: "%s · TaskOrb" },
  description: SITE_DESCRIPTION,
  applicationName: "TaskOrb",
  keywords: [
    "task board",
    "task manager",
    "team task tracker",
    "project management",
    "task dependencies",
    "gantt chart",
    "timeline planner",
    "kanban alternative",
    "to-do list for teams",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "TaskOrb",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    locale: "en_US",
  },
  twitter: { card: "summary_large_image", title: SITE_TITLE, description: SITE_DESCRIPTION },
  appleWebApp: { capable: true, title: "TaskOrb", statusBarStyle: "black" },
  formatDetection: { telephone: false },
  robots: { index: true, follow: true },
  verification: process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : undefined,
  category: "productivity",
};

export const viewport: Viewport = {
  themeColor: "#060a18",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${display.variable} font-sans antialiased`}>
        {children}
        <ServiceWorker />
        <VisitTracker />
      </body>
    </html>
  );
}
