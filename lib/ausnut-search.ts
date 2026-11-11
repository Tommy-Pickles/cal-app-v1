import { ausnutFoods } from "./ausnut-foods.ts";
import type { Food } from "./nutrition.ts";

const normalise = (value: string) =>
  value.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();

export function searchAusnutFoods(query: string, limit = 5): Food[] {
  const q = normalise(query);
  if (!q) return [];
  const words = q.split(/\s+/);
  return ausnutFoods
    .map((row) => {
      const name = normalise(row[1]);
      const baseScore = name === q ? 120
        : name.startsWith(`${q} `) || name.startsWith(`${q},`) ? 110
          : name.includes(` ${q} `) || name.includes(` ${q},`) ? 100
            : name.includes(q) ? 90
              : words.every((word) => name.includes(word)) ? 80
            : 0;
      const score = baseScore > 0
        ? baseScore
          + (/\bnot further defined\b/.test(name) ? 8 : 0)
          + (/\bplain\b/.test(name) ? 5 : 0)
          + (/\bhomemade\b/.test(name) ? 2 : 0)
          - (/\bdry mix\b|\buncooked\b/.test(name) ? 3 : 0)
        : 0;
      return { row, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.row[1].length - b.row[1].length)
    .slice(0, limit)
    .map(({ row }) => ({
      id: row[0], name: row[1], serving: row[2], grams: row[3],
      kcal: row[4], protein: row[5], carbs: row[6], fat: row[7],
      emoji: row[8], aliases: row[9],
    }));
}

export const ausnutFoodCount = ausnutFoods.length;
