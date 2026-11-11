#!/usr/bin/env python3
"""Convert the official AUSNUT 2023 workbooks into the app's compact tuple format."""

import json
import math
import re
import sys
from pathlib import Path

import pandas as pd


def numeric(value):
    value = pd.to_numeric(value, errors="coerce")
    return None if pd.isna(value) else float(value)


def tidy_number(value):
    rounded = round(value, 2)
    return int(rounded) if rounded.is_integer() else rounded


def choose_measure(rows):
    priorities = {
        "serve": 0, "serving": 0, "cup": 1, "slice": 2, "piece": 3,
        "medium": 4, "small": 5, "tablespoon": 6, "teaspoon": 7,
        "can": 8, "bottle": 9, "glass": 10, "mug": 11, "bowl": 12,
        "packet": 13, "bar": 14, "biscuit": 15, "egg": 16,
    }
    choices = []
    for _, row in rows.iterrows():
        descriptors = [str(row.get(column, "")).strip() for column in (
            "Descriptor 1\n", "Descriptor 2", "Descriptor 3", "Descriptor 4\n"
        ) if pd.notna(row.get(column)) and str(row.get(column)).strip()]
        words = " ".join(descriptors).lower()
        grams = numeric(row.get("Gram amount"))
        if not descriptors or "density" in words or grams is None or not 0 < grams <= 2000:
            continue
        score = min((rank for key, rank in priorities.items() if key in words), default=30)
        # Prefer ordinary single portions over very large or tiny reference measures.
        if grams < 5 or grams > 750:
            score += 20
        choices.append((score, grams, row, descriptors))
    if not choices:
        return None
    choices.sort(key=lambda item: item[0])
    return choices[0][1:]


def main(details_path, nutrients_path, measures_path, output_path):
    details = pd.read_excel(details_path, sheet_name="Food details", header=2)
    nutrients = pd.read_excel(nutrients_path, sheet_name="Food nutrient profiles", header=2)
    measures = pd.read_excel(measures_path, sheet_name="AUSNUT 2023", header=2)
    merged = details[["Survey ID", "Public food key", "Food name"]].merge(
        nutrients[[
            "Survey ID", "Energy with dietary fibre (kJ)", "Protein (g)",
            "Total fat (g)", "Available carbohydrate, with sugar alcohols (g)",
        ]],
        on="Survey ID",
        how="inner",
    )
    measure_groups = {key: group for key, group in measures.groupby("Survey ID")}
    output = []
    seen = set()
    for _, row in merged.iterrows():
        survey_id = int(row["Survey ID"])
        name = re.sub(r"\s+", " ", str(row["Food name"])).strip()
        kj = numeric(row["Energy with dietary fibre (kJ)"])
        protein = numeric(row["Protein (g)"])
        carbs = numeric(row["Available carbohydrate, with sugar alcohols (g)"])
        fat = numeric(row["Total fat (g)"])
        if not name or None in (kj, protein, carbs, fat):
            continue
        selected = choose_measure(measure_groups.get(survey_id, pd.DataFrame()))
        scale_grams = 100.0
        serving = "100 g"
        stored_grams = 100.0
        if selected:
            scale_grams, measure, descriptors = selected
            quantity = numeric(measure.get("Quantity")) or 1
            quantity_text = str(tidy_number(quantity))
            description = " ".join(descriptors)
            volume = numeric(measure.get("Volume"))
            if volume and 5 <= volume <= 2000:
                serving = f"{quantity_text} {description} · {tidy_number(volume)} ml"
                stored_grams = 0
            else:
                serving = f"{quantity_text} {description} · {tidy_number(scale_grams)} g"
                stored_grams = scale_grams
        factor = scale_grams / 100
        public_key = str(row["Public food key"]).strip()
        food_id = f"ausnut-{public_key.lower()}"
        if food_id in seen:
            continue
        seen.add(food_id)
        output.append([
            food_id,
            name[:200],
            serving[:120],
            tidy_number(stored_grams),
            tidy_number(kj / 4.184 * factor),
            tidy_number(protein * factor),
            tidy_number(carbs * factor),
            tidy_number(fat * factor),
            "",
            name.lower()[:300],
        ])
    header = """// Derived from AUSNUT 2023 by Food Standards Australia New Zealand.\n// Converted to Hawkes Health Helper's tuple format; nutrition is scaled to the selected measure.\n// Data licence and required limitations: ../NOTICE-AUSNUT.md\nimport type { CommonFoodTuple } from \"./common-foods.ts\";\n\nexport const ausnutFoods: CommonFoodTuple[] = [\n"""
    body = "".join(f"  {json.dumps(item, ensure_ascii=False, separators=(',', ':'))},\n" for item in output)
    Path(output_path).write_text(header + body + "];\n", encoding="utf-8")
    print(f"Wrote {len(output)} AUSNUT foods to {output_path}")


if __name__ == "__main__":
    if len(sys.argv) != 5:
        raise SystemExit("usage: import-ausnut.py DETAILS NUTRIENTS MEASURES OUTPUT")
    main(*sys.argv[1:])
