import { getChatGPTUser } from "../../chatgpt-auth";
import { productFood, productQuery } from "../../../lib/product-foods";

const cache = new Map<string, { until: number; data: unknown }>();
const recent = new Map<string, number[]>();
const headers = { "User-Agent": "HawkesHealthHelper/1.0 (https://github.com/Tommy-Pickles/cal-app-v1)", Accept: "application/json" };
export async function GET(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Please sign in." }, { status: 401 });
  const params = new URL(request.url).searchParams;
  const query = (params.get("q") || "").trim().slice(0, 100);
  const code = params.get("code") || (/^\d{8,14}$/.test(query) ? query : "");
  const store = params.get("store") || "";
  const page = Math.min(10, Math.max(1, Math.floor(Number(params.get("page"))) || 1));
  if ((code && !/^\d{8,14}$/.test(code)) || (!code && query.length < 2))
    return Response.json({ error: "Enter a product name or an 8–14 digit barcode." }, { status: 400 });
  const key = JSON.stringify([code, query.toLowerCase(), store, page]);
  const cached = cache.get(key);
  if (cached && cached.until > Date.now()) return Response.json(cached.data);
  const calls = (recent.get(user.userId) || []).filter(t => t > Date.now() - 60000);
  if (calls.length >= 8) return Response.json({ error: "Please wait a minute before another product search." }, { status: 429 });
  if (recent.size > 500) recent.clear();
  recent.set(user.userId, [...calls, Date.now()]);
  try {
    let url: string;
    if (code) {
      const fields = "code,product_name,product_name_en,brands,nutriments,serving_size,serving_quantity_unit,product_quantity_unit,quantity,nutrition_data_per,categories_tags";
      url = `https://world.openfoodfacts.org/api/v3/product/${code}?fields=${fields}`;
    } else {
      const p = new URLSearchParams({ q: productQuery(query, store), langs: "en", page_size: "20", page: String(page), fields: "code,product_name,brands,quantity" });
      url = `https://search.openfoodfacts.org/search?${p}`;
    }
    const response = await fetch(url, { headers, signal: AbortSignal.timeout(15000) });
    if (response.status === 404) return Response.json({ error: "Product not found. Add it from its nutrition label." }, { status: 404 });
    if (!response.ok) throw Error();
    const raw: any = await response.json();
    let data: unknown;
    if (code) {
      const food = productFood(raw.product || {});
      if (!food) return Response.json({ error: "This product’s nutrition is incomplete. Add a photo of its label instead." }, { status: 422 });
      data = { food };
    } else {
      data = { products: (raw.hits || []).filter((p: any) => /^\d{8,14}$/.test(String(p.code)) && typeof p.product_name === "string").map((p: any) => ({ code: String(p.code), name: p.product_name.slice(0, 200), brand: (Array.isArray(p.brands) ? p.brands.join(", ") : String(p.brands || "")).slice(0, 200), pack: String(p.quantity || "").slice(0, 100) })), hasMore: page < Math.min(raw.page_count || 1, 10), page };
    }
    if (cache.size >= 128) cache.delete(cache.keys().next().value!);
    cache.set(key, { until: Date.now() + 3600000, data });
    return Response.json(data);
  } catch {
    return Response.json({ error: "Product search is unavailable. Try again or add the nutrition label." }, { status: 503 });
  }
}
