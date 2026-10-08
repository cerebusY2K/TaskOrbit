import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OrbitMark } from "@/components/LoginScreen";
import {
  adminEmailAllowed,
  dayOf,
  fillDays,
  shiftDay,
  sumDays,
  topEntries,
  type AppTotals,
  type Breakdown,
  type DayStats,
} from "@/lib/analytics";
import { getAnalytics } from "@/lib/analytics-store";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Visitors", robots: { index: false, follow: false } };

const RANGES = [7, 30, 90, 365];

type PageProps = { searchParams: Promise<{ days?: string }> };

export default async function AdminPage({ searchParams }: PageProps) {
  const session = await getSession();
  if (!session) {
    return (
      <main className="mx-auto max-w-md px-6 py-24 text-center">
        <OrbitMark className="mx-auto h-12 w-12" />
        <h1 className="mt-4 text-2xl font-semibold">Sign in first</h1>
        <p className="mt-2 text-sm text-white/65">Sign in on the home page with your admin Google account, then come back here.</p>
        <Link href="/" className="mt-6 inline-block rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#0b1430]">
          Go to TaskOrb
        </Link>
      </main>
    );
  }
  if (!adminEmailAllowed(session.email)) notFound();

  const requested = Number((await searchParams).days);
  const range = RANGES.includes(requested) ? requested : 30;
  const today = dayOf(new Date());
  const from = shiftDay(today, -(range - 1));
  const analytics = getAnalytics();
  if (!analytics) notFound();

  let days: DayStats[] = [];
  let totals: AppTotals | null = null;
  let problem: string | null = null;
  try {
    const signupsSince = new Date(`${from}T00:00:00Z`).toISOString();
    [days, totals] = await Promise.all([analytics.days(from, today), analytics.totals(signupsSince)]);
  } catch (error) {
    console.error(error);
    problem = error instanceof Error ? error.message : "Could not load the numbers.";
  }
  const series = fillDays(days, from, today);
  const sum = sumDays(series);
  const todayStats = series[series.length - 1]!;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header className="flex flex-wrap items-center gap-4">
        <OrbitMark className="h-10 w-10" />
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">Visitors</h1>
          <p className="text-sm text-white/55">taskorb.app · days in India time · signed in as {session.email}</p>
        </div>
        <nav className="flex rounded-xl border border-white/10 bg-white/5 p-1 text-sm" aria-label="Range">
          {RANGES.map((option) => (
            <Link
              key={option}
              href={`/admin?days=${option}`}
              className={`rounded-lg px-3 py-1.5 ${option === range ? "bg-white text-[#0b1430] font-semibold" : "text-white/70 hover:text-white"}`}
            >
              {option === 365 ? "1 year" : `${option} days`}
            </Link>
          ))}
        </nav>
        <Link href="/" className="text-sm text-white/60 hover:text-white">
          ← Boards
        </Link>
      </header>

      {problem ? (
        <p role="alert" className="mt-6 rounded-xl border border-clay/40 bg-clay/10 px-4 py-3 text-sm text-clay">
          {problem}
        </p>
      ) : null}

      <section className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <Tile label="Visitors today" value={todayStats.visitors} hint={`${todayStats.views} page views`} />
        <Tile label={`Visitors, last ${range} days`} value={sum.visitors} hint="Each person counts once a day" />
        <Tile label="Page views" value={sum.views} hint={`${perVisitor(sum.views, sum.visitors)} per visit`} />
        <Tile label="First-time visitors" value={sum.newVisitors} hint="Never seen before on this device" />
        <Tile label="Sign-ups" value={totals?.signupDates.length ?? 0} hint={`in the last ${range} days`} />
        <Tile
          label="Signed-in views"
          value={sum.signedInViews}
          hint={sum.views ? `${Math.round((sum.signedInViews / sum.views) * 100)}% of views` : "No views yet"}
        />
      </section>

      <section className="glass-panel mt-6 rounded-2xl p-5">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-base font-semibold">Visitors per day</h2>
          <p className="flex items-center gap-4 text-xs text-white/55">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-[#4d84ff]" /> Visitors
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-white/15" /> Page views
            </span>
          </p>
        </div>
        <DailyChart days={series} />
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <BreakdownList title="Where they came from" data={sum.referrers} />
        <BreakdownList title="Countries" data={sum.countries} format={countryLabel} />
        <BreakdownList title="Devices" data={sum.devices} />
        <BreakdownList title="Opened in" data={sum.sources} />
        <BreakdownList title="Pages" data={sum.paths} />
        <section className="glass-panel rounded-2xl p-5">
          <h2 className="text-base font-semibold">TaskOrb so far</h2>
          <dl className="mt-4 grid grid-cols-2 gap-4">
            <Stat label="People signed up" value={totals?.users} />
            <Stat label="Boards" value={totals?.boards} />
            <Stat label="Cards" value={totals?.cards} />
            <Stat label="Tasks" value={totals?.tasks} />
          </dl>
        </section>
      </section>
    </main>
  );
}

function Tile({ label, value, hint }: { label: string; value: number; hint: string }) {
  return (
    <div className="glass-panel rounded-2xl p-4">
      <p className="text-xs text-white/55">{label}</p>
      <p className="mt-1 text-3xl font-semibold tabular-nums">{value.toLocaleString("en-IN")}</p>
      <p className="mt-1 text-xs text-white/45">{hint}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | undefined }) {
  return (
    <div>
      <dt className="text-xs text-white/55">{label}</dt>
      <dd className="text-2xl font-semibold tabular-nums">{value === undefined ? "–" : value.toLocaleString("en-IN")}</dd>
    </div>
  );
}

function BreakdownList({
  title,
  data,
  format = (key) => key,
}: {
  title: string;
  data: Breakdown;
  format?: (key: string) => string;
}) {
  const rows = topEntries(data);
  const max = rows[0]?.[1] ?? 0;
  return (
    <section className="glass-panel rounded-2xl p-5">
      <h2 className="text-base font-semibold">{title}</h2>
      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-white/45">Nothing yet.</p>
      ) : (
        <ul className="mt-3 space-y-1.5">
          {rows.map(([key, count]) => (
            <li key={key} className="relative flex items-center justify-between gap-3 overflow-hidden rounded-lg px-2.5 py-1.5 text-sm">
              <span className="absolute inset-y-0 left-0 rounded-lg bg-[#4d84ff]/15" style={{ width: `${(count / max) * 100}%` }} />
              <span className="relative truncate">{format(key)}</span>
              <span className="relative tabular-nums text-white/70">{count.toLocaleString("en-IN")}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function DailyChart({ days }: { days: DayStats[] }) {
  const width = 1000;
  const height = 220;
  const top = 12;
  const bottom = 26;
  const max = Math.max(1, ...days.map((day) => day.views));
  const step = width / days.length;
  const bar = Math.max(2, step * 0.7);
  const y = (value: number) => top + (height - top - bottom) * (1 - value / max);
  const labelEvery = Math.ceil(days.length / 8);
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="mt-4 h-auto w-full" role="img" aria-label="Visitors per day">
      {[0.5, 1].map((fraction) => (
        <g key={fraction}>
          <line x1={0} x2={width} y1={y(max * fraction)} y2={y(max * fraction)} stroke="rgba(255,255,255,0.08)" />
          <text x={4} y={y(max * fraction) - 4} fontSize={11} fill="rgba(255,255,255,0.45)">
            {Math.round(max * fraction)}
          </text>
        </g>
      ))}
      {days.map((day, index) => {
        const x = index * step + (step - bar) / 2;
        return (
          <g key={day.day}>
            <title>{`${shortDate(day.day)}: ${day.visitors} visitors, ${day.views} views`}</title>
            <rect x={x} width={bar} y={y(day.views)} height={y(0) - y(day.views)} rx={2} fill="rgba(255,255,255,0.13)" />
            <rect x={x} width={bar} y={y(day.visitors)} height={y(0) - y(day.visitors)} rx={2} fill="#4d84ff" />
            {index % labelEvery === 0 || (index === days.length - 1 && index % labelEvery >= labelEvery / 2) ? (
              <text x={x + bar / 2} y={height - 8} fontSize={11} textAnchor="middle" fill="rgba(255,255,255,0.5)">
                {shortDate(day.day)}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}

function shortDate(day: string) {
  return new Date(`${day}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
}

function perVisitor(views: number, visitors: number) {
  return visitors ? (views / visitors).toFixed(1) : "0";
}

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

function countryLabel(code: string) {
  if (!/^[A-Z]{2}$/.test(code)) return code;
  const flag = String.fromCodePoint(...[...code].map((char) => 0x1f1a5 + char.charCodeAt(0)));
  return `${flag} ${regionNames.of(code) ?? code}`;
}
