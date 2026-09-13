"""
Cooking domain assistant.
Transforms culinary requests into a structured recipe pipeline:
1. Generates structured recipe schema (ingredients, quantities, timed steps, chef tips).
2. Deterministic Nutrition Engine: Computes exact calories and macros (protein, carbs, fat, fiber)
   from the static 100+ ingredient database in Python.
3. Substitution Lookup Engine: Attaches verified culinary substitutions from vetted database.
4. Returns validated CookingRecipe JSON.
"""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional

from app.assistants.base_assistant import BaseAssistant
from app.assistants.cooking.cooking_engine import calculate_recipe_nutrition, get_verified_substitutions
from app.groq.client import GroqClient
from app.intent_router import classify_domain, is_conversational_continuation
from app.llm.schemas import CookingRecipe
from app.llm.structured_output import generate_structured

logger = logging.getLogger(__name__)


def _load_cooking_prompt() -> str:
    default = (
        "You are the Master Chef Cooking Assistant. You provide clear, reliable culinary recipes, kitchen techniques, "
        "ingredient ratios, and food safety advice. "
        "Structure each recipe with accurate ingredient quantities, explicit units (g, cup, tbsp, tsp, piece, ml), "
        "step-by-step instructions with timer_seconds whenever a cooking step requires timed attention (e.g. simmering, baking, resting)."
    )
    path = Path(__file__).resolve().parent.parent / "prompts" / "cooking_prompt.txt"
    if path.exists():
        return path.read_text(encoding="utf-8").strip()
    return default


class CookingAssistant(BaseAssistant):
    def __init__(self, groq: GroqClient) -> None:
        super().__init__(groq)
        self._prompt = _load_cooking_prompt()

    @property
    def domain_name(self) -> str:
        return "cooking"

    @property
    def system_prompt(self) -> str:
        return self._prompt

    def respond(
        self,
        user_message: str,
        context_messages: Optional[List[Dict[str, str]]] = None,
        user_profile: Optional[Dict[str, Any]] = None,
    ) -> str:
        # 1. Domain Isolation Check
        if not is_conversational_continuation(user_message or ""):
            domain = classify_domain(user_message or "")
            if domain not in {"cooking", "unknown"}:
                refusal_recipe = CookingRecipe(
                    title="Cooking Mode Active",
                    description="I am currently in Cooking Assistant mode and can only answer questions related to culinary recipes, ingredients, techniques, and food safety.",
                    prep_time_minutes=0,
                    cook_time_minutes=0,
                    servings=1,
                    difficulty="easy",
                    ingredients=[],
                    steps=[],
                    substitutions=[],
                    chef_tips=["Please switch to Education, Finance, or Healthcare mode for non-cooking inquiries."],
                )
                return json.dumps(refusal_recipe.model_dump(), ensure_ascii=False)

        # 2. Stage 1: Structured Recipe Generation
        user_context_block = ""
        if context_messages:
            recent = context_messages[-4:]
            user_context_block = "\n".join([f"{m.get('role')}: {m.get('content')}" for m in recent]) + "\n\n"

        prompt = (
            f"{user_context_block}User Request: {user_message}\n\n"
            "Generate a complete, delicious, structured recipe. For each ingredient specify the exact name, quantity, and unit. "
            "For timed steps (e.g., bake for 12 minutes, boil for 8 minutes), provide timer_seconds."
        )

        try:
            recipe: CookingRecipe = generate_structured(
                client=self.groq,
                response_model=CookingRecipe,
                user_prompt=prompt,
                system_prompt=self.system_prompt,
                temperature=0.3,
            )
        except Exception as e:
            logger.error(f"Cooking structured recipe generation error: {e}")
            recipe = CookingRecipe(
                title="Recipe Suggestion",
                description=f"Recipe guidance for: {user_message}",
                prep_time_minutes=10,
                cook_time_minutes=15,
                servings=2,
                difficulty="easy",
                ingredients=[],
                steps=[],
                chef_tips=["Always taste and adjust seasoning as you cook."],
            )

        # 3. Stage 2: Deterministic Nutrition Computation in Python
        computed_nutrition = calculate_recipe_nutrition(recipe.ingredients, recipe.servings)
        recipe.nutrition = computed_nutrition

        # 4. Stage 3: Attach Verified Substitutions from Static Database
        verified_subs = get_verified_substitutions(recipe.ingredients)
        if verified_subs:
            # Merge verified substitutions with any recipe-specific ones
            existing_sub_names = {s.substitute_name.lower() for s in recipe.substitutions}
            for v_sub in verified_subs:
                if v_sub.substitute_name.lower() not in existing_sub_names:
                    recipe.substitutions.append(v_sub)

        return json.dumps(recipe.model_dump(), ensure_ascii=False)


