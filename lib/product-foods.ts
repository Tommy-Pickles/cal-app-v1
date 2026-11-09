import type { Food } from "./nutrition";

const number = (v: unknown): number | null =>
  (typeof v === "number" || (typeof v === "string" && v.trim() !== "")) &&
  Number.isFinite(Number(v)) && Number(v) >= 0 ? Number(v) : null;
const text = (v: unknown) => typeof v === "string" ? v : Array.isArray(v) ? v.join(", ") : "";

export function productFood(p: Record<string, any>): Food | null {
  const barcode = String(p.code || "");
  const name = text(p.product_name_en || p.product_name).trim();
  if (!/^\d{8,14}$/.test(barcode) || !name) return null;
  const n = p.nutriments || {};
  const kj = number(n["energy-kj_100g"] ?? n.energy_100g);
  const kcal = number(n["energy-kcal_100g"]) ?? (kj === null ? null : kj / 4.184);
  const protein = number(n.proteins_100g), carbs = number(n.carbohydrates_100g), fat = number(n.fat_100g);
  // Missing label values are unknown, never zero. Reject implausible per-100 values.
  if (kcal === null || protein === null || carbs === null || fat === null ||
      kcal > 1000 || protein > 100 || carbs > 100 || fat > 100) return null;
  const serving = text(p.serving_size).toLowerCase();
  const measure = serving.match(/(?:^|[ (])(\d+(?:\.\d+)?)\s*(ml|g)\b/);
  const liquid = p.product_quantity_unit === "ml" || p.serving_quantity_unit === "ml" ||
    p.nutrition_data_per === "100ml" || /\b\d+(?:\.\d+)?\s*(?:ml|l)\b/i.test(text(p.quantity)) || measure?.[2] === "ml";
  const unit = liquid ? "ml" : "g";
  const amount = measure && measure[2] === unit && +measure[1] > 0 && +measure[1] <= 2000 ? +measure[1] : 100;
  const brand = text(p.brands).trim().slice(0, 200);
  return {
    id: `off-${barcode}`, name: (brand && !name.toLowerCase().includes(brand.toLowerCase()) ? `${brand} ${name}` : name).slice(0, 200),
    brand, barcode, serving: `${amount} ${unit}`, grams: liquid ? 0 : amount,
    kcal: kcal * amount / 100, protein: protein * amount / 100,
    carbs: carbs * amount / 100, fat: fat * amount / 100, emoji: "",
    source: "openfoodfacts", sourceUrl: `https://world.openfoodfacts.org/product/${barcode}`,
  };
}

export function productQuery(query: string, store: string) {
  // Unfielded quoted strings are interpreted as field "*" by this API.
  // Keep ordinary text outside the filter expression and remove Lucene operators.
  const plain = query.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter(w => w && !["and", "or", "not"].includes(w)).join(" ");
  const shop = ["woolworths", "coles", "aldi"].includes(store)
    ? ` (stores_tags:"${store}" OR brands:"${store}")` : "";
  return `${plain} countries_tags:"en:australia"${shop}`;
}
