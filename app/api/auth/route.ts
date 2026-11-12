import { z } from "zod";
import { normalizeLoginIdentifier } from "../../../lib/auth";
import { createSupabaseServerClient } from "../../../lib/supabase/server";

const requestSchema = z.object({
  mode: z.enum(["sign_in", "sign_up"]),
  identifier: z.string().max(254),
  password: z.string().min(8).max(72),
});

export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return Response.json({ error: "Invalid request." }, { status: 403 });
  try {
    const input = requestSchema.parse(await request.json());
    const identifier = normalizeLoginIdentifier(input.identifier);
    if (!identifier)
      return Response.json(
        { error: "Enter a valid email address." },
        { status: 400 },
      );

    const credentials =
      identifier.kind === "email"
        ? { email: identifier.value, password: input.password }
        : { phone: identifier.value, password: input.password };
    const supabase = await createSupabaseServerClient();
    const result = input.mode === "sign_up"
      ? await supabase.auth.signUp(credentials)
      : await supabase.auth.signInWithPassword(credentials);

    if (result.error || !result.data.session)
      return Response.json(
        {
          error: input.mode === "sign_up"
            ? "That account could not be created. It may already exist."
            : "The email, mobile number or password is incorrect.",
        },
        { status: 400 },
      );
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Check the details and try again." }, { status: 400 });
  }
}
