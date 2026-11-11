import { commonFoods } from "./common-foods.ts";

export type Macros = {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
};
export type Food = Macros & {
  id: string;
  name: string;
  serving: string;
  grams: number;
  aliases?: string;
  emoji: string;
  source?: "openfoodfacts" | "label" | "manual" | "ai";
  barcode?: string;
  brand?: string;
  sourceUrl?: string;
};
export type Item = Food & { quantity: number };
export type Profile = {
  name: string;
  goal: "gain" | "lose";
  weight: number;
  height: number;
  age: number;
  activity: number;
  sex: "male" | "female" | "average";
  proteinLevel: number;
  calories: number;
};
export type Meal = {
  id: string;
  name: string;
  category: string;
  items: Item[];
  batchGrams?: number;
  servings?: number;
};
export type Entry = {
  id: string;
  date: string;
  category: string;
  name: string;
  items: Item[];
};
export type State = {
  profile: Profile | null;
  entries: Entry[];
  meals: Meal[];
  foods: Food[];
  unit: "kcal" | "kJ";
};
export const emptyState: State = {
  profile: null,
  entries: [],
  meals: [],
  foods: [],
  unit: "kcal",
};
export const categories = ["Breakfast", "Lunch", "Dinner", "Snack"];
export const proteinLevels = [
  { name: "Enough", factor: 1.4, description: "1.4 g per kg of body weight." },
  {
    name: "Plenty",
    factor: 1.8,
    description: "1.8 g per kg of body weight.",
  },
  {
    name: "A punishing amount",
    factor: 2.2,
    description: "2.2 g per kg of body weight.",
  },
];
export const defaultProfile: Profile = {
  name: "",
  goal: "gain",
  weight: 80,
  height: 175,
  age: 30,
  activity: 1.55,
  sex: "average",
  proteinLevel: 1,
  calories: 0,
};
export function targetCalories(p: Profile) {
  const bmr =
    10 * p.weight +
    6.25 * p.height -
    5 * p.age +
    (p.sex === "male" ? 5 : p.sex === "female" ? -161 : -78);
  return Math.max(
    1200,
    Math.round((bmr * p.activity * (p.goal === "gain" ? 1.1 : 0.85)) / 10) * 10,
  );
}
export function targets(p: Profile): Macros {
  const kcal = p.calories || targetCalories(p);
  const protein = Math.round(
    Math.min(
      p.weight * proteinLevels[p.proteinLevel].factor,
      (kcal * 0.35) / 4,
    ),
  );
  const fat = Math.round((kcal * 0.3) / 9);
  return {
    kcal,
    protein,
    fat,
    carbs: Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4)),
  };
}
export function total(items: Item[]): Macros {
  return items.reduce(
    (a, f) => ({
      kcal: a.kcal + f.kcal * f.quantity,
      protein: a.protein + f.protein * f.quantity,
      carbs: a.carbs + f.carbs * f.quantity,
      fat: a.fat + f.fat * f.quantity,
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  );
}
export function energy(kcal: number, unit: string) {
  return Math.round(kcal * (unit === "kJ" ? 4.184 : 1)).toLocaleString("en-AU");
}
export function localDate(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function recipeItem(
  meal: Meal,
  amount: number,
  mode: "serving" | "grams",
): Item {
  const t = total(meal.items);
  const fraction =
    mode === "grams"
      ? amount / (meal.batchGrams || 1)
      : amount / (meal.servings || 1);
  return {
    id: meal.id,
    name: meal.name,
    emoji: "🥣",
    serving:
      mode === "grams"
        ? `${amount} g`
        : `${amount} serving${amount === 1 ? "" : "s"}${meal.batchGrams ? ` · ${Math.round((meal.batchGrams / (meal.servings || 1)) * amount)} g` : ""}`,
    grams: (meal.batchGrams || 0) * fraction,
    quantity: 1,
    kcal: t.kcal * fraction,
    protein: t.protein * fraction,
    carbs: t.carbs * fraction,
    fat: t.fat * fraction,
  };
}
// Starter reference values per stated edible portion. Brand labels take precedence.
export const foods: Food[] = [
  [
    "weetbix",
    "Weet-Bix",
    "2 biscuits",
    30,
    107,
    3.6,
    20.1,
    0.4,
    "🌾",
    "weetbix weet bix weet-bix",
  ],
  [
    "muesli",
    "Muesli",
    "½ cup",
    50,
    190,
    5,
    30,
    5,
    "🥣",
    "museli granola cereal",
  ],
  ["apple", "Apple", "1 medium", 182, 95, 0.5, 25, 0.3, "🍎", ""],
  ["banana", "Banana", "1 medium", 118, 105, 1.3, 27, 0.4, "🍌", "banan"],
  [
    "yoghurt",
    "Greek yoghurt, plain",
    "¾ cup",
    170,
    100,
    17,
    6,
    0.7,
    "🥛",
    "yogurt yoghurt",
  ],
  ["honey", "Honey", "1 tablespoon", 21, 64, 0, 17.3, 0, "🍯", ""],
  [
    "oats",
    "Rolled oats, dry",
    "½ cup",
    40,
    152,
    5.2,
    27,
    2.8,
    "🌾",
    "porridge oatmeal",
  ],
  [
    "milk",
    "Milk, full cream",
    "1 cup · 250 ml",
    258,
    160,
    8.5,
    12,
    8.5,
    "🥛",
    "milk",
  ],
  [
    "skim",
    "Milk, skim",
    "1 cup · 250 ml",
    258,
    88,
    8.8,
    12.5,
    0.3,
    "🥛",
    "skim milk",
  ],
  ["egg", "Egg", "1 large", 50, 72, 6.3, 0.4, 4.8, "🥚", "eggs"],
  [
    "chicken",
    "Chicken breast, cooked",
    "100 g",
    100,
    165,
    31,
    0,
    3.6,
    "🍗",
    "chicken",
  ],
  [
    "rice",
    "White rice, cooked",
    "1 cup",
    158,
    205,
    4.3,
    44.5,
    0.4,
    "🍚",
    "rice",
  ],
  [
    "bread",
    "Wholemeal bread",
    "1 slice",
    40,
    95,
    4,
    16,
    1.5,
    "🍞",
    "toast bread",
  ],
  ["avocado", "Avocado", "½ medium", 75, 120, 1.5, 6.4, 11, "🥑", "avo"],
  ["salmon", "Salmon, cooked", "100 g", 100, 206, 22, 0, 12, "🐟", "fish"],
  [
    "tuna",
    "Tuna in springwater, drained",
    "1 small tin",
    95,
    104,
    23,
    0,
    1,
    "🐟",
    "tuna",
  ],
  [
    "beef",
    "Lean beef mince, cooked",
    "100 g",
    100,
    217,
    26,
    0,
    12,
    "🥩",
    "beef mince",
  ],
  ["pasta", "Pasta, cooked", "1 cup", 140, 220, 8, 43, 1.3, "🍝", "spaghetti"],
  [
    "potato",
    "Potato, boiled",
    "1 medium",
    150,
    130,
    3,
    30,
    0.2,
    "🥔",
    "potatoes",
  ],
  ["broccoli", "Broccoli", "1 cup", 90, 31, 2.6, 6, 0.3, "🥦", "vegetables"],
  ["oil", "Olive oil", "1 tablespoon", 14, 119, 0, 0, 13.5, "🫒", "oil"],
  [
    "peanut",
    "Peanut butter",
    "1 tablespoon",
    16,
    94,
    4,
    3,
    8,
    "🥜",
    "peanut butter",
  ],
  [
    "whey",
    "Whey protein",
    "1 scoop",
    30,
    120,
    24,
    3,
    2,
    "🥤",
    "protein powder shake",
  ],
  [
    "almonds",
    "Almonds",
    "1 small handful",
    30,
    174,
    6.4,
    6.5,
    15,
    "🥜",
    "nuts",
  ],
  ["cheese", "Cheddar cheese", "1 slice", 20, 81, 5, 0.3, 6.7, "🧀", "cheese"],
  ["tofu", "Firm tofu", "100 g", 100, 144, 17, 3, 9, "⬜", "tofu"],
  [
    "lentils",
    "Lentils, cooked",
    "½ cup",
    100,
    116,
    9,
    20,
    0.4,
    "🫘",
    "lentils",
  ],
  [
    "strawberry",
    "Strawberries",
    "1 cup",
    150,
    48,
    1,
    11.5,
    0.5,
    "🍓",
    "berries strawberry",
  ],
  [
    "black-coffee",
    "Black coffee",
    "1 mug · 250 ml",
    0,
    3,
    0.3,
    0,
    0,
    "☕",
    "coffee black coffee long black americano coffe",
  ],
  [
    "espresso",
    "Espresso",
    "1 shot · 30 ml",
    0,
    2,
    0.1,
    0,
    0,
    "☕",
    "short black espresso coffee shot",
  ],
  [
    "flat-white",
    "Flat white",
    "1 cup · 250 ml",
    0,
    120,
    6.5,
    10,
    6,
    "☕",
    "flatwhite milk coffee",
  ],
  [
    "latte",
    "Caffè latte",
    "1 cup · 250 ml",
    0,
    130,
    6.5,
    11,
    6.5,
    "☕",
    "latte cafe latte milk coffee",
  ],
  [
    "tea",
    "Tea, black",
    "1 mug · 250 ml",
    0,
    2,
    0,
    0.5,
    0,
    "🫖",
    "black tea tea no milk",
  ],
  ["water", "Water", "1 glass · 250 ml", 0, 0, 0, 0, 0, "💧", "water glass tap water"],
  ["orange", "Orange", "1 medium", 131, 62, 1.2, 15.4, 0.2, "🍊", "orange fruit"],
  ["pear", "Pear", "1 medium", 178, 101, 0.6, 27, 0.3, "🍐", "pear fruit"],
  ["carrot", "Carrot", "1 medium", 61, 25, 0.6, 6, 0.1, "🥕", "carrots raw"],
  ["cucumber", "Cucumber", "1 cup", 104, 16, 0.7, 3.8, 0.1, "🥒", "cucumber raw"],
  ...commonFoods,
].map(
  ([id, name, serving, grams, kcal, protein, carbs, fat, emoji, aliases]) => ({
    id,
    name,
    serving,
    grams,
    kcal,
    protein,
    carbs,
    fat,
    emoji,
    aliases,
  }),
) as Food[];
export function searchFoods(query: string) {
  const q = query.trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
  if (!q) return [];
  const words = q.split(/\s+/);
  return foods
    .map((food) => {
      const name = food.name.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
      const haystack = `${name} ${food.aliases}`.toLowerCase();
      const score = name === q ? 100
        : name.includes(q) ? 90
          : words.every((word) => name.includes(word)) ? 85
            : haystack.includes(q) ? 80
              : words.every((word) => haystack.includes(word)) ? 60
            : 0;
      return { food, score: score + (score > 0 ? 10 : 0) };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ food }) => food)
    .slice(0, 5);
}

export function validQuantity(value: number) {
  return Number.isFinite(value) && value > 0 && value <= 10000;
}

export function portionLabel(item: Item) {
  const ml = item.serving.match(/([0-9.]+)\s*ml/);
  const amount = (n: number) => Math.round(n * 10) / 10;
  if (ml) return `${amount(Number(ml[1]) * item.quantity)} ml`;
  if (/^[0-9.]+\s*g$/.test(item.serving))
    return `${amount(item.grams * item.quantity)} g`;
  if (item.quantity === 1 && /[0-9.]+\s*g\b/.test(item.serving))
    return item.serving;
  const count = item.serving.match(/^([0-9.]+)\s+(.+)$/);
  const serving = count
    ? `${amount(Number(count[1]) * item.quantity)} ${count[2]}`
    : `${amount(item.quantity)} × ${item.serving}`;
  return item.grams > 0
    ? `${serving} · ${amount(item.grams * item.quantity)} g`
    : serving;
}
