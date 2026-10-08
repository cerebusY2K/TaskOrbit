import { headers } from "next/headers";
import { AppShell } from "@/components/AppShell";
import { Landing } from "@/components/Landing";
import { publicConfig } from "@/lib/runtime";
import { getSession } from "@/lib/session";

// Served fresh on every visit so browsers and the desktop app never keep an old build.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getSession();
  if (session) return <AppShell />;
  const head = await headers();
  const config = publicConfig(head.get("x-forwarded-host") ?? head.get("host"));
  return <AppShell initialConfig={config} landing={<Landing />} />;
}
