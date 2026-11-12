import HealthApp from "./health-app";
import LoginPage from "./login-page";
import { getSupabaseUser } from "../lib/supabase/server";
export const dynamic = "force-dynamic";
export default async function Page() {
  if (!(await getSupabaseUser())) return <LoginPage />;
  return <HealthApp />;
}
