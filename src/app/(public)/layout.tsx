import { PublicHeader } from "@/components/PublicChrome";
import { SiteFooter } from "@/components/SiteFooter";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col text-white">
      <PublicHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 pb-16">{children}</main>
      <SiteFooter />
    </div>
  );
}
