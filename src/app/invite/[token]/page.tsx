import { InviteGate } from "@/components/InviteGate";

type PageProps = { params: Promise<{ token: string }> };

export default async function InvitePage({ params }: PageProps) {
  const { token } = await params;
  return <InviteGate token={decodeURIComponent(token)} />;
}
