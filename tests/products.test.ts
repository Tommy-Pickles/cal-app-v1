import test from "node:test";
import assert from "node:assert/strict";
import { productFood, productQuery } from "../lib/product-foods.ts";
import { stateSchema } from "../lib/validation.ts";
import { emptyState, total } from "../lib/nutrition.ts";
const product = { code: "9300000000001", product_name: "Cereal", brands: "Test", serving_size: "2 biscuits (30 g)", nutriments: { "energy-kj_100g": 1673.6, proteins_100g: 10, carbohydrates_100g: 65, fat_100g: 8 } };
test("product label converts kJ and scales all nutrients to the stated serving", () => {
  const food = productFood(product)!;
  assert.equal(food.serving, "30 g"); assert.equal(food.grams, 30);
  assert.ok(Math.abs(food.kcal - 120) < 0.00001);
  assert.equal(food.protein, 3); assert.equal(food.carbs, 19.5); assert.equal(food.fat, 2.4);
  assert.equal(total([{ ...food, quantity: 2 }]).protein, 6);
});
test("liquid nutrition uses millilitres without assuming a gram density", () => {
  const food = productFood({ ...product, quantity: "1 L", serving_size: "250 ml" })!;
  assert.equal(food.grams, 0); assert.equal(food.serving, "250 ml");
  assert.equal(food.protein, 25);
});
test("milk category uses millilitres when the community record omits units", () => {
  const food = productFood({
    ...product,
    product_name: "Almond Milky",
    serving_size: undefined,
    quantity: undefined,
    categories_tags: ["en:dairies", "en:milks"],
  })!;
  assert.equal(food.grams, 0);
  assert.equal(food.serving, "100 ml");
});
test("milk chocolate remains a solid when it is not classified as a drink", () => {
  const food = productFood({
    ...product,
    product_name: "Milk chocolate",
    serving_size: undefined,
    quantity: "100 g",
    categories_tags: ["en:chocolates", "en:milk-chocolates"],
  })!;
  assert.equal(food.grams, 100);
  assert.equal(food.serving, "100 g");
});
test("missing and implausible nutrients are rejected rather than guessed", () => {
  assert.equal(productFood({ ...product, nutriments: { ...product.nutriments, proteins_100g: undefined } }), null);
  assert.equal(productFood({ ...product, nutriments: { ...product.nutriments, proteins_100g: "" } }), null);
  assert.equal(productFood({ ...product, nutriments: { ...product.nutriments, fat_100g: 200 } }), null);
  assert.equal(productFood({ ...product, code: "not-a-barcode" }), null);
});
test("explicit zero nutrients remain valid", () => {
  assert.equal(productFood({ ...product, nutriments: { ...product.nutriments, fat_100g: 0 } })?.fat, 0);
});
test("old diaries gain a foods collection and saved label provenance survives validation", () => {
  const { foods, ...old } = emptyState;
  assert.deepEqual(stateSchema.parse(old).foods, []);
  const food = { ...productFood(product)!, source: "label" as const };
  const parsed = stateSchema.parse({ ...emptyState, foods: [food] });
  assert.equal(parsed.foods[0].source, "label");
  assert.equal(parsed.foods[0].barcode, product.code);
});
test("search text cannot inject country or retailer filters", () => {
  const query = productQuery('milk") OR countries_tags:*', 'aldi');
  assert.ok(query.endsWith('countries_tags:"en:australia" (stores_tags:"aldi" OR brands:"aldi")'));
  assert.ok(!query.includes('countries_tags:*'));
});
