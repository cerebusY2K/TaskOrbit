import { AppShell } from "@/components/AppShell";

// Served fresh on every visit so browsers and the desktop app never keep an old build.
export const dynamic = "force-dynamic";

export default function HomePage() {
  return <AppShell />;
}
