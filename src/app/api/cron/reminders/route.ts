import { createHash, timingSafeEqual } from "crypto";
import { fail, json } from "@/lib/http";
import { getRuntime } from "@/lib/runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function digest(value: string) {
  return createHash("sha256").update(value).digest();
}

/** Today's date where most users are, since reminders go out once a day. */
function localToday() {
  const timeZone = process.env.REMINDER_TIMEZONE || "Asia/Kolkata";
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

async function run(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return json({ error: "Reminders are not configured." }, 503);
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!timingSafeEqual(digest(token), digest(secret))) return json({ error: "Not allowed." }, 401);
  try {
    return json(await getRuntime().service.sendReminders(localToday()));
  } catch (error) {
    return fail(error);
  }
}

export const GET = run;
export const POST = run;
