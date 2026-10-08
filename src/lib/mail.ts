import nodemailer from "nodemailer";
import type { MailMessage } from "./types";

export type OutgoingMail = MailMessage & { replyTo?: string | null };

export type Mailer = {
  kind: "smtp" | "brevo" | "resend";
  send(message: OutgoingMail): Promise<void>;
};

function sender() {
  const address = process.env.MAIL_FROM || process.env.SMTP_FROM || process.env.SMTP_USER || "bot@taskorb.app";
  const match = address.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  return match ? { name: match[1] || "TaskOrb", email: match[2]! } : { name: "TaskOrb", email: address.trim() };
}

async function postJson(url: string, headers: Record<string, string>, body: unknown) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json", ...headers },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    const detail = (await response.text().catch(() => "")).slice(0, 300);
    throw new Error(`Mail service answered ${response.status}${detail ? `: ${detail}` : ""}`);
  }
}

export function createMailer(): Mailer | null {
  const from = sender();

  if (process.env.BREVO_API_KEY) {
    const key = process.env.BREVO_API_KEY;
    return {
      kind: "brevo",
      send: (message) =>
        postJson(
          "https://api.brevo.com/v3/smtp/email",
          { "api-key": key },
          {
            sender: from,
            to: [{ email: message.to }],
            subject: message.subject,
            textContent: message.text,
            htmlContent: message.html,
            ...(message.replyTo ? { replyTo: { email: message.replyTo } } : {}),
          },
        ),
    };
  }

  if (process.env.RESEND_API_KEY) {
    const key = process.env.RESEND_API_KEY;
    return {
      kind: "resend",
      send: (message) =>
        postJson(
          "https://api.resend.com/emails",
          { Authorization: `Bearer ${key}` },
          {
            from: `${from.name} <${from.email}>`,
            to: [message.to],
            subject: message.subject,
            text: message.text,
            html: message.html,
            ...(message.replyTo ? { reply_to: message.replyTo } : {}),
          },
        ),
    };
  }

  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (user && pass) {
    const port = Number(process.env.SMTP_PORT || 465);
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.hostinger.com",
      port,
      secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : port === 465,
      auth: { user, pass },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });
    return {
      kind: "smtp",
      async send(message) {
        await transport.sendMail({
          from: { name: from.name, address: from.email },
          to: message.to,
          replyTo: message.replyTo ?? undefined,
          subject: message.subject,
          text: message.text,
          html: message.html,
        });
      },
    };
  }

  return null;
}

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);

export function boardInviteEmail(input: {
  to: string;
  memberName: string;
  fromName: string;
  fromEmail: string;
  boardName: string;
  url: string;
}): OutgoingMail {
  const { memberName, fromName, boardName, url, to } = input;
  const subject = `${fromName} invited you to ${boardName} on TaskOrb`;
  const text = [
    `Hi ${memberName},`,
    "",
    `${fromName} added you to the "${boardName}" board on TaskOrb, so you can see the tasks you own and what each one is waiting on.`,
    "",
    `Open the board: ${url}`,
    "",
    `Sign in with Google as ${to} and you'll join straight away.`,
    "",
    `Reply to this email to reach ${fromName}.`,
    "",
    "TaskOrb · https://taskorb.app",
  ].join("\n");
  const [name, from, board, link, email] = [memberName, fromName, boardName, url, to].map(escapeHtml);
  const html = `<!doctype html>
<html><body style="margin:0;background:#f3f5fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#1b2440">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 6px 24px rgba(20,30,70,0.08)">
<tr><td style="background:#0b1430;padding:22px 28px;color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.2px">TaskOrb</td></tr>
<tr><td style="padding:28px">
<p style="margin:0 0 14px;font-size:16px">Hi ${name},</p>
<p style="margin:0 0 22px;font-size:16px;line-height:1.5"><strong>${from}</strong> added you to the <strong>${board}</strong> board on TaskOrb, so you can see the tasks you own and what each one is waiting on.</p>
<p style="margin:0 0 24px"><a href="${link}" style="display:inline-block;background:#4d84ff;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 22px;border-radius:10px">Open ${board}</a></p>
<p style="margin:0 0 8px;font-size:14px;color:#5a6688;line-height:1.5">Sign in with Google as ${email} and you'll join straight away. Reply to this email to reach ${from}.</p>
<p style="margin:16px 0 0;font-size:12px;color:#8a94b0;word-break:break-all">If the button doesn't work, paste this into your browser:<br>${link}</p>
</td></tr></table>
<p style="margin:16px 0 0;font-size:12px;color:#8a94b0">Sent by <a href="https://taskorb.app" style="color:#8a94b0">TaskOrb</a></p>
</td></tr></table></body></html>`;
  return { to, subject, text, html, replyTo: input.fromEmail };
}
