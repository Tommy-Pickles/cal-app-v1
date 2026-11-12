import { z } from "zod";
const n = z.number().finite().min(0).max(100000);
export const foodSchema = z.object({
  id: z.string().max(100),
  name: z.string().min(1).max(200),
  serving: z.string().max(200),
  grams: n,
  kcal: n,
  protein: n,
  carbs: n,
  fat: n,
  emoji: z.string().max(20),
  aliases: z.string().max(1000).optional(),
  source: z.enum(["openfoodfacts", "label", "manual", "ai"]).optional(),
  barcode: z.string().regex(/^\d{8,14}$/).optional(),
  brand: z.string().max(200).optional(),
  sourceUrl: z.string().url().max(300).refine((url) => /^https:\/\/world\.openfoodfacts\.org\/product\/\d{8,14}$/.test(url)).optional(),
});
export const itemSchema = foodSchema.extend({ quantity: z.number().finite().positive().max(10000) });
const category = z.enum(["Breakfast", "Lunch", "Dinner", "Snack"]);
export const stateSchema = z.object({
  profile: z
    .object({
      name: z.string().max(80),
      goal: z.enum(["gain", "lose"]),
      weight: z.number().min(35).max(300),
      height: z.number().min(120).max(230),
      age: z.number().int().min(18).max(100),
      activity: z.number().min(1.2).max(1.9),
      sex: z.enum(["male", "female", "average"]),
      proteinLevel: z.number().int().min(0).max(2),
      weeklyChangeKg: z.number().min(0.1).max(1).optional(),
      calories: z
        .number()
        .min(0)
        .max(6000)
        .refine((n) => n === 0 || n >= 1200),
    })
    .nullable(),
  foods: z.array(foodSchema).max(2000).default([]),
  entries: z
    .array(
      z.object({
        id: z.string().max(100),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        name: z.string().max(200),
        category,
        items: z.array(itemSchema).min(1).max(100),
      }),
    )
    .max(10000),
  meals: z
    .array(
      z.object({
        id: z.string().max(100),
        name: z.string().min(1).max(200),
        category,
        items: z.array(itemSchema).min(1).max(100),
        batchGrams: z.number().positive().max(100000).optional(),
        servings: z.number().positive().max(1000).optional(),
      }),
    )
    .max(1000),
  unit: z.enum(["kcal", "kJ"]),
});
