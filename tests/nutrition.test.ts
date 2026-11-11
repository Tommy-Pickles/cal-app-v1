import test from "node:test";
import assert from "node:assert/strict";
import {
  total,
  recipeItem,
  targets,
  defaultProfile,
  energy,
  searchFoods,
  localDate,
  foods,
} from "../lib/nutrition.ts";
const ingredient = {
  id: "1",
  name: "Test ingredient",
  serving: "100 g",
  grams: 100,
  kcal: 200,
  protein: 20,
  carbs: 10,
  fat: 8,
  emoji: "🥣",
  quantity: 3,
};
test("scales all nutrients with portions", () =>
  assert.deepEqual(total([ingredient]), {
    kcal: 600,
    protein: 60,
    carbs: 30,
    fat: 24,
  }));
test("uses cooked batch weight for 300g and serving", () => {
  const recipe = {
    id: "r",
    name: "Recipe",
    category: "Dinner",
    items: [ingredient],
    batchGrams: 1200,
    servings: 4,
  };
  assert.equal(recipeItem(recipe, 300, "grams").kcal, 150);
  assert.equal(recipeItem(recipe, 1, "serving").protein, 15);
  assert.equal(recipeItem(recipe, 2, "serving").grams, 600);
});
test("energy conversion is 4.184 kJ per kcal", () =>
  assert.equal(energy(100, "kJ"), "418"));
test("Weet-Bix and spelling variants are searchable", () => {
  assert.equal(searchFoods("wee")[0].name, "Weet-Bix");
  assert.equal(searchFoods("museli")[0].name, "Muesli");
});
test("generic food search prioritises common intent over branded products", () => {
  assert.equal(searchFoods("black coffee")[0].name, "Black coffee");
  assert.equal(searchFoods("coffee")[0].name, "Black coffee");
  assert.equal(searchFoods("coffee black")[0].name, "Black coffee");
  assert.equal(searchFoods("black coffe")[0].name, "Black coffee");
  assert.equal(searchFoods("boss coffee").length, 0);
});
test("common catalogue is broad and distinguishes mince fat levels", () => {
  assert.ok(foods.length >= 230);
  assert.equal(new Set(foods.map((food) => food.id)).size, foods.length);
  assert.match(searchFoods("beef mince 5%")[0].name, /5% fat/);
  assert.match(searchFoods("beef mince 20%")[0].name, /20% fat/);
  assert.equal(searchFoods("scotch fillet")[0].name, "Beef scotch fillet, cooked");
  assert.ok(searchFoods("mince").some((food) => food.name.includes("5% fat")));
});
test("targets reconcile and high protein is capped", () => {
  for (const proteinLevel of [0, 1, 2]) {
    const t = targets({ ...defaultProfile, proteinLevel });
    assert.ok(Math.abs(t.protein * 4 + t.carbs * 4 + t.fat * 9 - t.kcal) <= 2);
    assert.ok(t.carbs > 0);
  }
  const t = targets({
    ...defaultProfile,
    weight: 200,
    calories: 1800,
    proteinLevel: 2,
  });
  assert.ok(t.protein <= 158);
});
test("day keys use calendar date in local timezone", () =>
  assert.equal(localDate(new Date(2026, 10, 7, 0, 1)), "2026-11-07"));

test("weighed portions preserve precision through recipe calculations", () => {
  const rice = { ...ingredient, grams: 158, kcal: 205, quantity: 300 / 158 };
  const recipe = {
    id: "fractional",
    name: "Rice",
    category: "Dinner",
    items: [rice],
    batchGrams: 300,
    servings: 4,
  };
  assert.ok(
    Math.abs(recipeItem(recipe, 1, "serving").kcal - (205 * 300) / 158 / 4) <
      1e-9,
  );
  assert.equal(recipeItem(recipe, 1, "serving").grams, 75);
});

test("portion validation accepts weighed fractions and rejects invalid values", async () => {
  const { validQuantity } = await import("../lib/nutrition.ts");
  assert.equal(validQuantity(300 / 158), true);
  assert.equal(validQuantity(0.001), true);
  for (const amount of [0, -1, 10001, Infinity, NaN])
    assert.equal(validQuantity(amount), false);
});

test("empty diary totals remain zero", () => {
  assert.deepEqual(total([]), { kcal: 0, protein: 0, carbs: 0, fat: 0 });
});

test("diary portions show the actual amount consumed", async () => {
  const { portionLabel } = await import("../lib/nutrition.ts");
  assert.equal(
    portionLabel({ ...ingredient, serving: "1 cup · 250 ml", quantity: 0.4 }),
    "100 ml",
  );
  assert.equal(
    portionLabel({
      ...ingredient,
      serving: "2 biscuits",
      grams: 30,
      quantity: 2,
    }),
    "4 biscuits · 60 g",
  );
  assert.equal(
    portionLabel({ ...ingredient, serving: "300 g", grams: 300, quantity: 1 }),
    "300 g",
  );
});

test("recipe serving descriptions do not repeat their gram weight", async () => {
  const { portionLabel } = await import("../lib/nutrition.ts");
  assert.equal(
    portionLabel({
      ...ingredient,
      serving: "1 serving · 300 g",
      grams: 300,
      quantity: 1,
    }),
    "1 serving · 300 g",
  );
});
