import Link from "next/link";
import { Todo } from "@/components/PublicChrome";
import { LEGAL_UPDATED, publicMetadata } from "@/lib/site";

export const metadata = publicMetadata("/terms");

export default function TermsPage() {
  return (
    <article>
      <h1 className="font-display text-4xl font-semibold tracking-tight">Terms of Service</h1>
      <p className="mt-3 text-sm text-white/50">Last updated {LEGAL_UPDATED}</p>
      <p className="mt-4 text-sm leading-relaxed text-white/70">
        These terms cover the free task board at taskorb.app. The service is operated by{" "}
        <Todo>legal entity name</Todo>. Questions about these terms go to <Todo>contact email</Todo>. Governing law
        and jurisdiction: <Todo>governing law and jurisdiction</Todo>. By signing in or using a board, you agree to
        these terms and to the{" "}
        <Link href="/privacy" className="text-[#9dbcff] underline decoration-white/20 underline-offset-2 hover:text-white">
          Privacy Policy
        </Link>
        .
      </p>

      <h2 className="mt-10 font-display text-2xl font-semibold tracking-tight">The service</h2>
      <p className="mt-3 text-sm leading-relaxed text-white/70">
        TaskOrb lets you keep boards of cards and tasks, with owners, priorities, dates, statuses and a note of what
        each task is waiting on. You can look at a board as an orbit, a simple board, or a timeline. It is a tool for
        you and the people you invite. There is no paid plan and the app does not collect payment.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-white/70">
        The service is offered free of charge as it stands today. If that ever changes, it will be said on the site
        before anyone is asked to pay. The operator may change features, or stop offering TaskOrb, without promising
        a particular notice period. There is no uptime commitment.
      </p>

      <h2 className="mt-10 font-display text-2xl font-semibold tracking-tight">Your account</h2>
      <p className="mt-3 text-sm leading-relaxed text-white/70">
        You sign in with Google. You need a Google account you are allowed to use. You are responsible for what
        happens through that account. TaskOrb does not offer a separate password.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-white/70">
        Signing out ends the session in the browser. It does not delete your boards. There is no control in the app
        that deletes an entire account. To ask for deletion, email <Todo>contact email</Todo>.
      </p>

      <h2 className="mt-10 font-display text-2xl font-semibold tracking-tight">Your content</h2>
      <p className="mt-3 text-sm leading-relaxed text-white/70">
        You keep ownership of the text you put into boards, cards and tasks. You give TaskOrb permission to store
        that content and to show it to you and to people who have joined the board, which is what makes the product
        work. You are responsible for having the right to store that content, including the names and email addresses
        of people you add.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-white/70">
        Do not put content on TaskOrb that you are not allowed to store, or that is illegal. Do not try to open boards
        you were not invited to, and do not disrupt the site.
      </p>

      <h2 className="mt-10 font-display text-2xl font-semibold tracking-tight">Sharing</h2>
      <p className="mt-3 text-sm leading-relaxed text-white/70">
        Boards are private to you until someone joins. The owner can add a member by name and email, and can copy an
        invite link. Anyone who opens that link and signs in with Google joins the board and can see its cards,
        tasks, notes, and member names and emails. Treat the link as private. The owner can remove a member. A member
        can leave. TaskOrb does not email invitations on your behalf.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-white/70">
        On a board you do not own, you can edit tasks you added and tasks assigned to you. The owner can edit the
        board. Push notifications, if you turn them on, tell you about assignments and similar board events. They are
        described in the privacy policy.
      </p>

      <h2 className="mt-10 font-display text-2xl font-semibold tracking-tight">Availability and your data</h2>
      <p className="mt-3 text-sm leading-relaxed text-white/70">
        TaskOrb is provided as available. It may be interrupted, and data can be lost. Keep your own copy of anything
        you cannot afford to lose. There is no service credit, because the product does not charge a fee.
      </p>

      <h2 className="mt-10 font-display text-2xl font-semibold tracking-tight">As-is, and liability</h2>
      <p className="mt-3 text-sm leading-relaxed text-white/70">
        The service is provided as is. To the extent the law allows, TaskOrb is offered without warranties of
        merchantability, fitness for a particular purpose, or uninterrupted operation. To the extent the law allows,
        the operator is not liable for lost data, lost profits, or indirect damages arising from your use of the
        service. Some places do not allow those limits. Where they do not, the limits apply only as far as the law
        there permits. Which law that is has not been chosen yet: <Todo>governing law and jurisdiction</Todo>.
      </p>

      <h2 className="mt-10 font-display text-2xl font-semibold tracking-tight">Stopping</h2>
      <p className="mt-3 text-sm leading-relaxed text-white/70">
        You can stop using TaskOrb at any time by signing out and not returning. The operator may refuse or end
        access if these terms are broken. Ending access does not, by itself, promise that stored boards are exported
        first. Ask <Todo>contact email</Todo> if you need a copy before an account is removed.
      </p>

      <h2 className="mt-10 font-display text-2xl font-semibold tracking-tight">Changes to these terms</h2>
      <p className="mt-3 text-sm leading-relaxed text-white/70">
        These terms can be updated by editing this page. The date at the top is the date of the current version. If
        you keep using TaskOrb after that date changes, the updated terms apply.
      </p>
    </article>
  );
}
