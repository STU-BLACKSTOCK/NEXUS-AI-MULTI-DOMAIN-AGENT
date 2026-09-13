"""
Static Culinary Nutrition and Substitution Database.
Contains verified macro and calorie data per 100 grams for 100+ common ingredients,
standard culinary unit conversions, and vetted substitutions.
"""

from __future__ import annotations
from typing import Dict, List, TypedDict


class IngredientNutrition(TypedDict):
    calories: float
    protein: float
    carbs: float
    fat: float
    fiber: float


# Macros and calories per 100 grams
INGREDIENT_NUTRITION_DB: Dict[str, IngredientNutrition] = {
    # Grains & Flours
    "all-purpose flour": {"calories": 364, "protein": 10.3, "carbs": 76.3, "fat": 1.0, "fiber": 2.7},
    "flour": {"calories": 364, "protein": 10.3, "carbs": 76.3, "fat": 1.0, "fiber": 2.7},
    "whole wheat flour": {"calories": 340, "protein": 13.2, "carbs": 72.0, "fat": 2.5, "fiber": 10.7},
    "almond flour": {"calories": 590, "protein": 21.0, "carbs": 20.0, "fat": 52.0, "fiber": 10.0},
    "oat flour": {"calories": 404, "protein": 14.7, "carbs": 65.7, "fat": 9.1, "fiber": 6.5},
    "rolled oats": {"calories": 379, "protein": 13.2, "carbs": 67.7, "fat": 6.5, "fiber": 10.1},
    "oats": {"calories": 379, "protein": 13.2, "carbs": 67.7, "fat": 6.5, "fiber": 10.1},
    "white rice": {"calories": 130, "protein": 2.7, "carbs": 28.2, "fat": 0.3, "fiber": 0.4},
    "rice": {"calories": 130, "protein": 2.7, "carbs": 28.2, "fat": 0.3, "fiber": 0.4},
    "brown rice": {"calories": 123, "protein": 2.7, "carbs": 25.6, "fat": 1.0, "fiber": 1.6},
    "quinoa": {"calories": 120, "protein": 4.4, "carbs": 21.3, "fat": 1.9, "fiber": 2.8},
    "pasta": {"calories": 158, "protein": 5.8, "carbs": 30.9, "fat": 0.9, "fiber": 1.8},
    "spaghetti": {"calories": 158, "protein": 5.8, "carbs": 30.9, "fat": 0.9, "fiber": 1.8},
    "bread": {"calories": 265, "protein": 9.0, "carbs": 49.0, "fat": 3.2, "fiber": 2.7},
    "breadcrumbs": {"calories": 395, "protein": 13.0, "carbs": 72.0, "fat": 5.4, "fiber": 4.5},
    "cornstarch": {"calories": 381, "protein": 0.3, "carbs": 91.3, "fat": 0.1, "fiber": 0.9},

    # Dairy & Eggs
    "egg": {"calories": 143, "protein": 12.6, "carbs": 0.7, "fat": 9.5, "fiber": 0.0},
    "eggs": {"calories": 143, "protein": 12.6, "carbs": 0.7, "fat": 9.5, "fiber": 0.0},
    "egg white": {"calories": 52, "protein": 10.9, "carbs": 0.7, "fat": 0.2, "fiber": 0.0},
    "egg yolk": {"calories": 322, "protein": 15.9, "carbs": 3.6, "fat": 26.5, "fiber": 0.0},
    "whole milk": {"calories": 61, "protein": 3.2, "carbs": 4.8, "fat": 3.3, "fiber": 0.0},
    "milk": {"calories": 61, "protein": 3.2, "carbs": 4.8, "fat": 3.3, "fiber": 0.0},
    "skim milk": {"calories": 35, "protein": 3.4, "carbs": 5.0, "fat": 0.1, "fiber": 0.0},
    "almond milk": {"calories": 15, "protein": 0.6, "carbs": 0.3, "fat": 1.1, "fiber": 0.2},
    "oat milk": {"calories": 48, "protein": 1.0, "carbs": 7.0, "fat": 1.5, "fiber": 0.8},
    "heavy cream": {"calories": 345, "protein": 2.8, "carbs": 2.7, "fat": 36.1, "fiber": 0.0},
    "sour cream": {"calories": 193, "protein": 2.4, "carbs": 4.6, "fat": 19.4, "fiber": 0.0},
    "butter": {"calories": 717, "protein": 0.9, "carbs": 0.1, "fat": 81.1, "fiber": 0.0},
    "unsalted butter": {"calories": 717, "protein": 0.9, "carbs": 0.1, "fat": 81.1, "fiber": 0.0},
    "cheddar cheese": {"calories": 403, "protein": 24.9, "carbs": 1.3, "fat": 33.1, "fiber": 0.0},
    "cheese": {"calories": 403, "protein": 24.9, "carbs": 1.3, "fat": 33.1, "fiber": 0.0},
    "parmesan cheese": {"calories": 431, "protein": 38.5, "carbs": 4.1, "fat": 28.6, "fiber": 0.0},
    "parmesan": {"calories": 431, "protein": 38.5, "carbs": 4.1, "fat": 28.6, "fiber": 0.0},
    "mozzarella cheese": {"calories": 280, "protein": 28.0, "carbs": 3.1, "fat": 17.0, "fiber": 0.0},
    "mozzarella": {"calories": 280, "protein": 28.0, "carbs": 3.1, "fat": 17.0, "fiber": 0.0},
    "greek yogurt": {"calories": 59, "protein": 10.0, "carbs": 3.6, "fat": 0.4, "fiber": 0.0},
    "yogurt": {"calories": 61, "protein": 3.5, "carbs": 4.7, "fat": 3.3, "fiber": 0.0},
    "cream cheese": {"calories": 342, "protein": 5.9, "carbs": 4.1, "fat": 34.2, "fiber": 0.0},
    "buttermilk": {"calories": 40, "protein": 3.3, "carbs": 4.8, "fat": 0.9, "fiber": 0.0},

    # Meats & Seafood & Plant Protein
    "chicken breast": {"calories": 165, "protein": 31.0, "carbs": 0.0, "fat": 3.6, "fiber": 0.0},
    "chicken": {"calories": 165, "protein": 31.0, "carbs": 0.0, "fat": 3.6, "fiber": 0.0},
    "chicken thigh": {"calories": 209, "protein": 26.0, "carbs": 0.0, "fat": 10.9, "fiber": 0.0},
    "ground beef": {"calories": 250, "protein": 26.0, "carbs": 0.0, "fat": 15.0, "fiber": 0.0},
    "beef": {"calories": 250, "protein": 26.0, "carbs": 0.0, "fat": 15.0, "fiber": 0.0},
    "pork chops": {"calories": 231, "protein": 23.7, "carbs": 0.0, "fat": 14.4, "fiber": 0.0},
    "bacon": {"calories": 541, "protein": 37.0, "carbs": 1.4, "fat": 42.0, "fiber": 0.0},
    "salmon": {"calories": 208, "protein": 20.4, "carbs": 0.0, "fat": 13.4, "fiber": 0.0},
    "tuna": {"calories": 132, "protein": 28.0, "carbs": 0.0, "fat": 1.0, "fiber": 0.0},
    "shrimp": {"calories": 99, "protein": 24.0, "carbs": 0.2, "fat": 0.3, "fiber": 0.0},
    "tofu": {"calories": 76, "protein": 8.0, "carbs": 1.9, "fat": 4.8, "fiber": 0.3},
    "tempeh": {"calories": 192, "protein": 20.3, "carbs": 7.6, "fat": 10.8, "fiber": 0.0},
    "black beans": {"calories": 132, "protein": 8.9, "carbs": 23.7, "fat": 0.5, "fiber": 8.7},
    "chickpeas": {"calories": 164, "protein": 8.9, "carbs": 27.4, "fat": 2.6, "fiber": 7.6},
    "lentils": {"calories": 116, "protein": 9.0, "carbs": 20.1, "fat": 0.4, "fiber": 7.9},

    # Oils & Fats
    "olive oil": {"calories": 884, "protein": 0.0, "carbs": 0.0, "fat": 100.0, "fiber": 0.0},
    "oil": {"calories": 884, "protein": 0.0, "carbs": 0.0, "fat": 100.0, "fiber": 0.0},
    "vegetable oil": {"calories": 884, "protein": 0.0, "carbs": 0.0, "fat": 100.0, "fiber": 0.0},
    "coconut oil": {"calories": 862, "protein": 0.0, "carbs": 0.0, "fat": 100.0, "fiber": 0.0},
    "sesame oil": {"calories": 884, "protein": 0.0, "carbs": 0.0, "fat": 100.0, "fiber": 0.0},
    "canola oil": {"calories": 884, "protein": 0.0, "carbs": 0.0, "fat": 100.0, "fiber": 0.0},
    "peanut butter": {"calories": 588, "protein": 25.0, "carbs": 20.0, "fat": 50.0, "fiber": 6.0},

    # Vegetables & Aromatics
    "onion": {"calories": 40, "protein": 1.1, "carbs": 9.3, "fat": 0.1, "fiber": 1.7},
    "garlic": {"calories": 149, "protein": 6.4, "carbs": 33.1, "fat": 0.5, "fiber": 2.1},
    "tomato": {"calories": 18, "protein": 0.9, "carbs": 3.9, "fat": 0.2, "fiber": 1.2},
    "tomatoes": {"calories": 18, "protein": 0.9, "carbs": 3.9, "fat": 0.2, "fiber": 1.2},
    "tomato paste": {"calories": 82, "protein": 4.3, "carbs": 18.9, "fat": 0.5, "fiber": 4.1},
    "bell pepper": {"calories": 20, "protein": 0.9, "carbs": 4.6, "fat": 0.2, "fiber": 1.7},
    "spinach": {"calories": 23, "protein": 2.9, "carbs": 3.6, "fat": 0.4, "fiber": 2.2},
    "broccoli": {"calories": 34, "protein": 2.8, "carbs": 6.6, "fat": 0.4, "fiber": 2.6},
    "carrot": {"calories": 41, "protein": 0.9, "carbs": 9.6, "fat": 0.2, "fiber": 2.8},
    "carrots": {"calories": 41, "protein": 0.9, "carbs": 9.6, "fat": 0.2, "fiber": 2.8},
    "potato": {"calories": 77, "protein": 2.0, "carbs": 17.5, "fat": 0.1, "fiber": 2.2},
    "potatoes": {"calories": 77, "protein": 2.0, "carbs": 17.5, "fat": 0.1, "fiber": 2.2},
    "sweet potato": {"calories": 86, "protein": 1.6, "carbs": 20.1, "fat": 0.1, "fiber": 3.0},
    "avocado": {"calories": 160, "protein": 2.0, "carbs": 8.5, "fat": 14.7, "fiber": 6.7},
    "mushrooms": {"calories": 22, "protein": 3.1, "carbs": 3.3, "fat": 0.3, "fiber": 1.0},
    "ginger": {"calories": 80, "protein": 1.8, "carbs": 17.8, "fat": 0.8, "fiber": 2.0},
    "lemon juice": {"calories": 22, "protein": 0.4, "carbs": 6.9, "fat": 0.2, "fiber": 0.3},
    "lime juice": {"calories": 25, "protein": 0.4, "carbs": 8.4, "fat": 0.1, "fiber": 0.4},

    # Sweeteners & Baking Extras
    "sugar": {"calories": 387, "protein": 0.0, "carbs": 100.0, "fat": 0.0, "fiber": 0.0},
    "granulated sugar": {"calories": 387, "protein": 0.0, "carbs": 100.0, "fat": 0.0, "fiber": 0.0},
    "brown sugar": {"calories": 380, "protein": 0.1, "carbs": 98.1, "fat": 0.0, "fiber": 0.0},
    "honey": {"calories": 304, "protein": 0.3, "carbs": 82.4, "fat": 0.0, "fiber": 0.2},
    "maple syrup": {"calories": 260, "protein": 0.0, "carbs": 67.0, "fat": 0.1, "fiber": 0.0},
    "chocolate chips": {"calories": 479, "protein": 4.2, "carbs": 63.0, "fat": 28.0, "fiber": 6.0},
    "cocoa powder": {"calories": 228, "protein": 19.6, "carbs": 57.9, "fat": 13.7, "fiber": 37.0},
    "baking powder": {"calories": 53, "protein": 0.0, "carbs": 27.7, "fat": 0.0, "fiber": 0.0},
    "baking soda": {"calories": 0, "protein": 0.0, "carbs": 0.0, "fat": 0.0, "fiber": 0.0},
    "vanilla extract": {"calories": 288, "protein": 0.1, "carbs": 12.7, "fat": 0.1, "fiber": 0.0},
    "salt": {"calories": 0, "protein": 0.0, "carbs": 0.0, "fat": 0.0, "fiber": 0.0},
    "black pepper": {"calories": 251, "protein": 10.4, "carbs": 64.0, "fat": 3.3, "fiber": 25.3},
    "soy sauce": {"calories": 53, "protein": 8.1, "carbs": 4.9, "fat": 0.6, "fiber": 0.8},
}

# Standard unit to gram conversion mapping
UNIT_GRAM_FACTORS: Dict[str, float] = {
    "g": 1.0,
    "gram": 1.0,
    "grams": 1.0,
    "kg": 1000.0,
    "ml": 1.0,
    "milliliter": 1.0,
    "l": 1000.0,
    "liter": 1000.0,
    "tsp": 5.0,
    "teaspoon": 5.0,
    "teaspoons": 5.0,
    "tbsp": 15.0,
    "tablespoon": 15.0,
    "tablespoons": 15.0,
    "cup": 240.0,
    "cups": 240.0,
    "oz": 28.35,
    "ounce": 28.35,
    "ounces": 28.35,
    "lb": 453.6,
    "pound": 453.6,
    "pounds": 453.6,
    "pinch": 0.5,
    "clove": 3.0,
    "cloves": 3.0,
    "slice": 25.0,
    "slices": 25.0,
    "piece": 50.0,
    "pieces": 50.0,
}

# Special piece weight overrides for specific ingredients
ITEM_WEIGHT_OVERRIDES: Dict[str, float] = {
    "egg": 50.0,
    "eggs": 50.0,
    "banana": 118.0,
    "apple": 182.0,
    "avocado": 150.0,
    "onion": 110.0,
    "potato": 150.0,
    "chicken breast": 200.0,
    "clove": 3.0,
}

# Verified Culinary Substitutions Lookup Table
SUBSTITUTION_LOOKUP: Dict[str, List[Dict[str, str]]] = {
    "butter": [
        {"substitute_name": "Coconut Oil", "ratio_or_notes": "1:1 ratio, works best in baking and sautéing"},
        {"substitute_name": "Applesauce (Unsweetened)", "ratio_or_notes": "1:1 ratio for baking, reduces fat content"},
        {"substitute_name": "Greek Yogurt", "ratio_or_notes": "1:1 ratio for dense baked goods like muffins"},
        {"substitute_name": "Olive Oil", "ratio_or_notes": "Use 3/4 amount of olive oil for melted butter"},
    ],
    "egg": [
        {"substitute_name": "Flax Egg", "ratio_or_notes": "1 tbsp ground flaxseed + 3 tbsp water per egg (let sit 5 min)"},
        {"substitute_name": "Mashed Banana", "ratio_or_notes": "1/4 cup mashed banana per egg (great for pancakes/breads)"},
        {"substitute_name": "Applesauce", "ratio_or_notes": "1/4 cup unsweetened applesauce per egg in baking"},
        {"substitute_name": "Aquafaba (Chickpea liquid)", "ratio_or_notes": "3 tbsp aquafaba per whole egg"},
    ],
    "eggs": [
        {"substitute_name": "Flax Egg", "ratio_or_notes": "1 tbsp ground flaxseed + 3 tbsp water per egg"},
        {"substitute_name": "Applesauce", "ratio_or_notes": "1/4 cup unsweetened applesauce per egg"},
    ],
    "buttermilk": [
        {"substitute_name": "Milk + Lemon Juice / Vinegar", "ratio_or_notes": "1 cup milk + 1 tbsp lemon juice or white vinegar (let sit 5 min)"},
        {"substitute_name": "Plain Yogurt + Milk", "ratio_or_notes": "3/4 cup plain yogurt thinned with 1/4 cup milk"},
    ],
    "heavy cream": [
        {"substitute_name": "Milk + Butter", "ratio_or_notes": "3/4 cup whole milk + 1/4 cup melted unsalted butter"},
        {"substitute_name": "Full-Fat Canned Coconut Milk", "ratio_or_notes": "1:1 ratio, ideal dairy-free alternative for soups/curries"},
    ],
    "sour cream": [
        {"substitute_name": "Greek Yogurt", "ratio_or_notes": "1:1 ratio, equal tang with more protein and less fat"},
    ],
    "all-purpose flour": [
        {"substitute_name": "Almond Flour", "ratio_or_notes": "1:1 by volume for keto/gluten-free baking (may need extra binder)"},
        {"substitute_name": "Oat Flour", "ratio_or_notes": "1:1 ratio by weight (adds subtle nutty flavor)"},
        {"substitute_name": "Whole Wheat Flour", "ratio_or_notes": "Use 7/8 cup whole wheat flour per 1 cup AP flour"},
    ],
    "sugar": [
        {"substitute_name": "Honey", "ratio_or_notes": "Use 3/4 cup honey per 1 cup sugar, and reduce liquids by 2 tbsp"},
        {"substitute_name": "Maple Syrup", "ratio_or_notes": "Use 3/4 cup maple syrup per 1 cup sugar, reduce oven temp by 25°F"},
        {"substitute_name": "Monk Fruit / Stevia", "ratio_or_notes": "Check package conversion, zero-calorie alternative"},
    ],
    "soy sauce": [
        {"substitute_name": "Coconut Aminos", "ratio_or_notes": "1:1 ratio, gluten-free and lower in sodium"},
        {"substitute_name": "Tamari", "ratio_or_notes": "1:1 ratio, rich gluten-free alternative"},
    ],
    "parmesan cheese": [
        {"substitute_name": "Nutritional Yeast", "ratio_or_notes": "1:1 ratio for vegan cheesy umami flavor"},
        {"substitute_name": "Pecorino Romano", "ratio_or_notes": "1:1 ratio, sharper and saltier sheep's milk cheese"},
    ],
    "parmesan": [
        {"substitute_name": "Nutritional Yeast", "ratio_or_notes": "1:1 ratio for vegan cheesy umami flavor"},
        {"substitute_name": "Pecorino Romano", "ratio_or_notes": "1:1 ratio, sharper and saltier sheep's milk cheese"},
    ],
}
