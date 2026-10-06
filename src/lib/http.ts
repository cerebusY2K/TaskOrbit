import { NextResponse } from "next/server";
import { BoardError } from "./errors";
import { getSession } from "./session";
import type { SessionUser } from "./types";

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export async function readJson(request: Request): Promise<Record<string, unknown>> {
  try {
    const body = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new BoardError("The request body must be a JSON object.");
    }
    return body as Record<string, unknown>;
  } catch (error) {
    if (error instanceof BoardError) throw error;
    throw new BoardError("The request body must be JSON.");
  }
}

export function fail(error: unknown) {
  if (error instanceof BoardError) return json({ error: error.message }, error.status);
  console.error(error);
  return json({ error: "Something went wrong." }, 500);
}

export async function authed(handler: (session: SessionUser) => Promise<Response>) {
  try {
    const session = await getSession();
    if (!session) return json({ error: "Sign in required." }, 401);
    return await handler(session);
  } catch (error) {
    return fail(error);
  }
}
