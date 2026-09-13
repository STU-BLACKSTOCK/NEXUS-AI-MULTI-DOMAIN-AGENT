"""Unit tests for the Cooking nutrition calculation and substitution lookup engine."""

import pytest
from app.llm.schemas import RecipeIngredient
from app.assistants.cooking.cooking_engine import (
    calculate_ingredient_weight_grams,
    calculate_recipe_nutrition,
    get_verified_substitutions,
)


def test_ingredient_weight_calculation():
    egg = RecipeIngredient(name="eggs", quantity=2, unit="piece")
    assert calculate_ingredient_weight_grams(egg) == 100.0

    flour = RecipeIngredient(name="all-purpose flour", quantity=1, unit="cup")
    assert calculate_ingredient_weight_grams(flour) == 240.0

    butter = RecipeIngredient(name="butter", quantity=2, unit="tbsp")
    assert calculate_ingredient_weight_grams(butter) == 30.0


def test_recipe_nutrition_computation():
    ingredients = [
        RecipeIngredient(name="chicken breast", quantity=200, unit="g"),  # ~330 kcal, 62g protein
        RecipeIngredient(name="olive oil", quantity=1, unit="tbsp"),     # ~15g = 132 kcal
        RecipeIngredient(name="broccoli", quantity=100, unit="g"),        # ~34 kcal, 2.8g protein
    ]
    nutrition = calculate_recipe_nutrition(ingredients, servings=2)

    assert nutrition.servings == 2
    assert nutrition.total_calories > 400.0
    assert nutrition.protein_g > 60.0
    assert nutrition.calories_per_serving == pytest.approx(nutrition.total_calories / 2.0, abs=0.1)


def test_verified_substitutions_lookup():
    ingredients = [
        RecipeIngredient(name="unsalted butter", quantity=100, unit="g"),
        RecipeIngredient(name="large eggs", quantity=2, unit="piece"),
        RecipeIngredient(name="all-purpose flour", quantity=200, unit="g"),
    ]
    subs = get_verified_substitutions(ingredients)
    sub_names = [s.substitute_name for s in subs]

    assert any("Coconut Oil" in s or "Applesauce" in s for s in sub_names)
    assert any("Flax" in s or "Banana" in s for s in sub_names)
    assert any("Almond Flour" in s or "Oat Flour" in s for s in sub_names)
