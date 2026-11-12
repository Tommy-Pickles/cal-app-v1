import { getSupabaseUser } from "../../../lib/supabase/server";
import { stateSchema } from "../../../lib/validation";
import { emptyState } from "../../../lib/nutrition";

export async function GET() {
  const auth = await getSupabaseUser();
  if (!auth) return Response.json({ error: "Please sign in." }, { status: 401 });
  const { data, error } = await auth.supabase
    .from("health_accounts")
    .select("data, version")
    .eq("user_id", auth.id)
    .maybeSingle();
  if (error) return Response.json({ error: "Unable to load your diary." }, { status: 503 });
  return Response.json(
    {
      state: data ? { ...emptyState, ...(data.data as object) } : emptyState,
      version: Number(data?.version || 0),
      aiReady: !!process.env.OPENAI_API_KEY,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function PUT(request: Request) {
  const auth = await getSupabaseUser();
  if (!auth) return Response.json({ error: "Please sign in." }, { status: 401 });
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return Response.json({ error: "Invalid origin." }, { status: 403 });
  const raw = await request.text();
  if (raw.length > 2000000)
    return Response.json({ error: "Your diary is too large." }, { status: 413 });
  try {
    const body = JSON.parse(raw);
    const state = stateSchema.parse(body.state);
    if (!Number.isInteger(body.version) || body.version < 0) throw new Error();
    const nextVersion = body.version + 1;
    if (body.version === 0) {
      const { error } = await auth.supabase.from("health_accounts").insert({
        user_id: auth.id,
        data: state,
        version: nextVersion,
        updated_at: new Date().toISOString(),
      });
      if (error) {
        if (error.code === "23505")
          return Response.json({ error: "Your diary changed in another tab. Reload before saving again." }, { status: 409 });
        throw error;
      }
    } else {
      const { data, error } = await auth.supabase
        .from("health_accounts")
        .update({ data: state, version: nextVersion, updated_at: new Date().toISOString() })
        .eq("user_id", auth.id)
        .eq("version", body.version)
        .select("version")
        .maybeSingle();
      if (error) throw error;
      if (!data)
        return Response.json({ error: "Your diary changed in another tab. Reload before saving again." }, { status: 409 });
    }
    return Response.json({ version: nextVersion });
  } catch {
    return Response.json({ error: "Please check the values and try again." }, { status: 400 });
  }
}
