import Link from "next/link";
import { Todo } from "@/components/PublicChrome";
import { LEGAL_UPDATED, publicMetadata } from "@/lib/site";

export const metadata = publicMetadata("/privacy");

export default function PrivacyPage() {
  return (
    <article>
      <h1 className="font-display text-4xl font-semibold tracking-tight">Privacy Policy</h1>
      <p className="mt-3 text-sm text-white/50">Last updated {LEGAL_UPDATED}</p>
      <p className="mt-4 text-sm leading-relaxed text-white/70">
        TaskOrb is a free task board at taskorb.app. This page describes what the app actually collects and stores.
        It is operated by <Todo>legal entity name</Todo>. To ask a question or request deletion of your account,
        email <Todo>contact email</Todo>. Governing law and jurisdiction: <Todo>governing law and jurisdiction</Todo>.
      </p>

      <h2 className="mt-10 font-display text-2xl font-semibold tracking-tight">Your account</h2>
      <p className="mt-3 text-sm leading-relaxed text-white/70">
        Sign-in is Google only. TaskOrb never asks for or stores a password. When you continue with Google, Firebase
        Authentication checks the Google sign-in token. We keep the account id Google assigns, your email address,
        your name, and the profile photo address Google provides. If Google does not send a name, the part of your
        email before the @ sign is used. The profile photo itself stays at the address Google gave us. We store the
        address, not a separate copy of the file.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-white/70">
        The first sign-in creates your boards. Signing out clears the sign-in cookie in the browser. It does not
        delete the account or the boards.
      </p>

      <h2 className="mt-10 font-display text-2xl font-semibold tracking-tight">Boards, tasks and people you add</h2>
      <p className="mt-3 text-sm leading-relaxed text-white/70">
        Everything you put on a board is stored: board and card names and colours, and for each task the name, owner,
        priority, status, from and to dates, what it depends on, what it is waiting for, what it blocks, the next
        action, notes, a reason when it is on hold, and the times it was created and last changed.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-white/70">
        When you add someone to a board, we store the name and email address you typed, even if they have not signed
        up. When they later sign in with that Google email, the membership is linked to their account. If they leave,
        the link to their account is cleared, and the name and email stay until the board owner removes them.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-white/70">
        People you invite can see the whole board, including task notes and the names and email addresses of members.
        A board is not visible to anyone else until they join it.
      </p>

      <h2 className="mt-10 font-display text-2xl font-semibold tracking-tight">Invite links</h2>
      <p className="mt-3 text-sm leading-relaxed text-white/70">
        Each board has one invite link. We store the token in that link, which board it opens, who created it, when,
        and which accounts have accepted it. The link is not locked to a single email address. Anyone with the link
        who signs in with Google can join that board. TaskOrb does not send the invite by email. You copy the link
        and send it yourself.
      </p>

      <h2 className="mt-10 font-display text-2xl font-semibold tracking-tight">Notices and push notifications</h2>
      <p className="mt-3 text-sm leading-relaxed text-white/70">
        The app stores in-app notices: a title, a short message, whether you have read it, when it was created, and
        the task it refers to when there is one. Typical notices are a task assigned to you, someone joining or
        leaving a board, and tasks moved onto you when two members are merged.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-white/70">
        Push is off until you turn it on. If you do, we store a push subscription for that device. In the browser
        that is the push endpoint and the two keys the browser provides. In the iPhone and Android app builds it is a
        Firebase Cloud Messaging token, plus the platform name. Turning push off deletes that device&apos;s
        subscription. A subscription the push service reports as expired is deleted as well. The notice text is sent
        to your browser&apos;s push service, or through Firebase Cloud Messaging for the app builds. We do not use
        push for marketing.
      </p>

      <h2 className="mt-10 font-display text-2xl font-semibold tracking-tight">Visit statistics</h2>
      <p className="mt-3 text-sm leading-relaxed text-white/70">
        Public pages and the signed-in app send one beacon to /api/visit. This is first-party. There is no Google
        Analytics, advertising pixel, or other third-party analytics script. Known bots are skipped and nothing is
        stored for them.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-white/70">
        On the first beacon the server sets a cookie named taskorb_vid. It holds a random id, is HTTP-only, lasts
        about 400 days, and is limited to this site. In production it is only sent over HTTPS. Before anything is
        written down, that id is hashed with a server secret. The database stores the hash, not the cookie value, so a later visit can be counted as returning
        without keeping the raw id.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-white/70">The stored visit record is:</p>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-white/70">
        <li>The day, counted in India time unless the server&apos;s timezone setting says otherwise.</li>
        <li>The hashed visitor id.</li>
        <li>The path, trimmed. Invite links are stored as /invite so the token is not kept in the visit log.</li>
        <li>
          Where the visit came from: a named site such as Google or a direct visit, or the hostname of the referrer.
          A utm_source or ref value in the link is kept instead when one is present. These are shortened. The full
          referrer URL is not stored.
        </li>
        <li>
          A country code, only when the network in front of the site sends one (the cf-ipcountry or
          x-vercel-ip-country header). Otherwise the country is recorded as unknown. This is not a precise location,
          and the IP address is not stored.
        </li>
        <li>A coarse device label taken from the browser&apos;s user agent, such as Mac or iPhone. The raw user agent string is not stored.</li>
        <li>Whether the visit was from the browser, an installed home-screen app, or the iPhone or Android app build.</li>
        <li>Whether a sign-in cookie was present. The visit is not attached to your Google account.</li>
      </ul>
      <p className="mt-3 text-sm leading-relaxed text-white/70">
        Those records are rolled into daily totals: page views, visitors, new visitors, signed-in views, and counts
        by path, referrer, country, device and source. The site operator can read the totals on a private page. Other
        people are not shown that page.
      </p>

      <h2 className="mt-10 font-display text-2xl font-semibold tracking-tight">Cookies and data on your device</h2>
      <p className="mt-3 text-sm leading-relaxed text-white/70">
        The sign-in cookie is named depend_session. It lasts 14 days, is HTTP-only, and is sent only to this site. It
        holds your account id, email, name and profile photo address, and a signature so it cannot be edited into
        someone else&apos;s session. In production it is only sent over HTTPS.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-white/70">
        Firebase Authentication also keeps its own sign-in state in the browser so Google sign-in can complete. The
        service worker caches an offline page and some static files on your device. The app remembers, on that
        device only, which board view you last used. The native app builds keep the push token in local storage on
        the device as well as on the server.
      </p>

      <h2 className="mt-10 font-display text-2xl font-semibold tracking-tight">Where data is kept, and who else handles it</h2>
      <p className="mt-3 text-sm leading-relaxed text-white/70">
        Account and board data, notices, push subscriptions, invite records and the visit totals are stored in Google
        Cloud Firestore. Google Firebase Authentication checks your sign-in. Firebase Cloud Messaging delivers push
        to the iPhone and Android app builds. Browser push is delivered by the push service your browser chose when
        you subscribed.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-white/70">
        The website is hosted on Render. The host&apos;s own connection logs can include an IP address and user agent
        for operating the server. TaskOrb&apos;s database does not store IP addresses. We do not sell personal
        information, and we do not share board contents with anyone except the people on that board and the
        processors above, who handle it to run the service.
      </p>

      <h2 className="mt-10 font-display text-2xl font-semibold tracking-tight">How long it is kept</h2>
      <p className="mt-3 text-sm leading-relaxed text-white/70">
        Board data stays until you delete it or until the account is removed. You can delete cards and tasks, and you
        can delete a board as long as you keep one. Removing a member deletes that membership. There is no button in
        the app that deletes your whole account. Email <Todo>contact email</Todo> to ask for that, and for a copy of
        the account data we hold. The sign-in cookie expires after 14 days. The visitor cookie expires after about
        400 days. Daily visit totals are kept so the operator can see them.
      </p>

      <h2 className="mt-10 font-display text-2xl font-semibold tracking-tight">Children</h2>
      <p className="mt-3 text-sm leading-relaxed text-white/70">
        TaskOrb is not directed at children. Signing in requires a Google account.
      </p>

      <h2 className="mt-10 font-display text-2xl font-semibold tracking-tight">Changes</h2>
      <p className="mt-3 text-sm leading-relaxed text-white/70">
        When this policy changes, the date at the top of this page changes with it. The{" "}
        <Link href="/terms" className="text-[#9dbcff] underline decoration-white/20 underline-offset-2 hover:text-white">
          Terms of Service
        </Link>{" "}
        describe the rules for using the product.
      </p>
    </article>
  );
}
