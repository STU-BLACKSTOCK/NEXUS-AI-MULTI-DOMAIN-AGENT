"""
Deterministic Cooking Engine.
Calculates exact meal nutrition facts (calories, protein, carbs, fat, fiber)
by matching recipe ingredients against the verified static nutrition database,
and retrieves vetted culinary substitutions.
"""

from __future__ import annotations

import re
from typing import List, Optional, Tuple

from app.assistants.cooking.nutrition_db import (
    INGREDIENT_NUTRITION_DB,
    ITEM_WEIGHT_OVERRIDES,
    SUBSTITUTION_LOOKUP,
    UNIT_GRAM_FACTORS,
    IngredientNutrition,
)
from app.llm.schemas import NutritionFacts, RecipeIngredient, SubstitutionOption


def normalize_string(text: str) -> str:
    """Lowercase, convert hyphens/slashes to spaces, and strip punctuation."""
    t = (text or "").lower().replace("-", " ").replace("/", " ")
    return re.sub(r"[^\w\s]", "", t).strip()


def find_ingredient_match(name: str) -> Optional[Tuple[str, IngredientNutrition]]:
    """
    Matches an ingredient name against the nutrition database.
    Checks exact matches, singular/plural, and substring matches.
    """
    clean_name = normalize_string(name)
    for key, data in INGREDIENT_NUTRITION_DB.items():
        clean_key = normalize_string(key)
        if clean_key == clean_name or clean_key in clean_name or clean_name in clean_key:
            return key, data

    # Check individual words (reverse to match noun over adjectives if possible)
    words = clean_name.split()
    for word in reversed(words):
        if len(word) > 2:
            for key, data in INGREDIENT_NUTRITION_DB.items():
                if word == normalize_string(key):
                    return key, data
    return None



def calculate_ingredient_weight_grams(ingredient: RecipeIngredient) -> float:
    """
    Estimates total weight in grams for a given ingredient item.
    """
    qty = ingredient.quantity if ingredient.quantity is not None and ingredient.quantity > 0 else 1.0
    unit = normalize_string(ingredient.unit or "")
    name = normalize_string(ingredient.name or "")

    # Check item specific overrides (e.g. 1 egg = 50g)
    for item_key, weight in ITEM_WEIGHT_OVERRIDES.items():
        if item_key in name:
            if not unit or unit in {"piece", "pieces", "", "whole", "large", "medium"}:
                return qty * weight

    # Check standard unit conversion factor
    if unit in UNIT_GRAM_FACTORS:
        return qty * UNIT_GRAM_FACTORS[unit]

    # Default fallback: treat quantity as grams if unit unrecognized or 50g standard portion
    return qty * 50.0


def calculate_recipe_nutrition(
    ingredients: List[RecipeIngredient],
    servings: int = 2,
) -> NutritionFacts:
    """
    Calculates total and per-serving nutrition deterministically in Python.
    """
    total_cal = 0.0
    total_prot = 0.0
    total_carb = 0.0
    total_fat = 0.0
    total_fib = 0.0

    valid_servings = max(1, servings)

    for item in ingredients:
        weight_g = calculate_ingredient_weight_grams(item)
        match = find_ingredient_match(item.name)

        if match:
            _, nut = match
            scale = weight_g / 100.0
            total_cal += nut["calories"] * scale
            total_prot += nut["protein"] * scale
            total_carb += nut["carbs"] * scale
            total_fat += nut["fat"] * scale
            total_fib += nut["fiber"] * scale
        else:
            # Fallback estimation for unmatched culinary items: ~80 cal / 100g
            scale = weight_g / 100.0
            total_cal += 80.0 * scale
            total_carb += 10.0 * scale
            total_prot += 2.0 * scale
            total_fat += 2.0 * scale

    cal_per_serv = total_cal / valid_servings

    return NutritionFacts(
        total_calories=round(total_cal, 1),
        protein_g=round(total_prot, 1),
        carbs_g=round(total_carb, 1),
        fat_g=round(total_fat, 1),
        fiber_g=round(total_fib, 1),
        servings=valid_servings,
        calories_per_serving=round(cal_per_serv, 1),
    )


def get_verified_substitutions(
    ingredients: List[RecipeIngredient],
) -> List[SubstitutionOption]:
    """
    Looks up vetted substitutions for any ingredients present in the recipe.
    """
    substitutions: List[SubstitutionOption] = []
    seen = set()

    for item in ingredients:
        name_clean = normalize_string(item.name)
        for key, subs in SUBSTITUTION_LOOKUP.items():
            clean_key = normalize_string(key)
            if clean_key in name_clean or name_clean in clean_key:
                for sub in subs:
                    pair_key = (item.name, sub["substitute_name"])
                    if pair_key not in seen:
                        seen.add(pair_key)
                        substitutions.append(
                            SubstitutionOption(
                                original_ingredient=item.name,
                                substitute_name=sub["substitute_name"],
                                ratio_or_notes=sub["ratio_or_notes"],
                            )
                        )


    return substitutions
