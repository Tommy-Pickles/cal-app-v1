import { getChatGPTUser } from "../../chatgpt-auth";
import { env } from "cloudflare:workers";
import { stateSchema } from "../../../lib/validation";
import { emptyState } from "../../../lib/nutrition";
export async function GET() {
  const user = await getChatGPTUser();
  if (!user)
    return Response.json({ error: "Please sign in." }, { status: 401 });
  const row = await env
    .DB!.prepare("SELECT data, version FROM health_accounts WHERE user_id = ?")
    .bind(user.userId)
    .first<{ data: string; version: number }>();
  return Response.json(
    {
      state: row ? JSON.parse(row.data) : emptyState,
      version: row?.version ?? 0,
      aiReady: !!env.OPENAI_API_KEY,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
export async function PUT(request: Request) {
  const user = await getChatGPTUser();
  if (!user)
    return Response.json({ error: "Please sign in." }, { status: 401 });
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return Response.json({ error: "Invalid origin." }, { status: 403 });
  const raw = await request.text();
  if (raw.length > 2000000)
    return Response.json(
      { error: "Your diary is too large." },
      { status: 413 },
    );
  try {
    const body = JSON.parse(raw);
    const state = stateSchema.parse(body.state);
    if (!Number.isInteger(body.version) || body.version < 0) throw Error();
    const result = await env
      .DB!.prepare(
        "INSERT INTO health_accounts (user_id, data, version) VALUES (?, ?, 1) ON CONFLICT(user_id) DO UPDATE SET data = excluded.data, version = health_accounts.version + 1 WHERE health_accounts.version = ?",
      )
      .bind(user.userId, JSON.stringify(state), body.version)
      .run();
    if (!result.meta.changes)
      return Response.json(
        {
          error:
            "Your diary changed in another tab. Reload before saving again.",
        },
        { status: 409 },
      );
    return Response.json({ version: body.version + 1 });
  } catch {
    return Response.json(
      { error: "Please check the values and try again." },
      { status: 400 },
    );
  }
}
