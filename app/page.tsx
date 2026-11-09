import { requireChatGPTUser } from "./chatgpt-auth";
import HealthApp from "./health-app";
export const dynamic = "force-dynamic";
export default async function Page() {
  await requireChatGPTUser("/");
  return <HealthApp />;
}
