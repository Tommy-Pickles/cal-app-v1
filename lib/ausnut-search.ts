import { ausnutFoods } from "./ausnut-foods.ts";
import type { Food } from "./nutrition.ts";

const normalise = (value: string) =>
  value.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();

export function searchAusnutFoods(query: string, limit = 8): Food[] {
  const q = normalise(query);
  if (!q) return [];
  const words = q.split(/\s+/);
  return ausnutFoods
    .map((row) => {
      const name = normalise(row[1]);
      const score = name === q ? 100
        : name.includes(q) ? 90
          : words.every((word) => name.includes(word)) ? 80
            : 0;
      return { row, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ row }) => ({
      id: row[0], name: row[1], serving: row[2], grams: row[3],
      kcal: row[4], protein: row[5], carbs: row[6], fat: row[7],
      emoji: row[8], aliases: row[9],
    }));
}

export const ausnutFoodCount = ausnutFoods.length;
