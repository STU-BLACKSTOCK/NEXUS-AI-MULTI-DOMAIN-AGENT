"""
Evaluation Harness for NexusAI Multi-Domain Assistant Pipelines.
Runs queries from evals/eval_queries.json, validates against Pydantic schemas,
checks deterministic domain assertions, and outputs pass/fail metrics.
"""

from __future__ import annotations

import json
import os
import sys
import time
from pathlib import Path
from typing import Any, Dict, List

# Ensure app package is importable
root_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root_dir))

from dotenv import load_dotenv
load_dotenv(dotenv_path=root_dir / ".env")

from app.orchestrator import Orchestrator
from app.llm.schemas import FinanceOutput, CookingRecipe, EducationOutput, HealthcareOutput


def load_dataset() -> List[Dict[str, Any]]:
    dataset_path = Path(__file__).resolve().parent / "eval_queries.json"
    with open(dataset_path, "r", encoding="utf-8") as f:
        return json.load(f)


def evaluate_finance_case(result: Dict[str, Any], assertions: Dict[str, Any]) -> List[str]:
    errors = []
    # If returned as JSON string, parse or validate
    resp_raw = result.get("response", "")
    try:
        data = json.loads(resp_raw) if isinstance(resp_raw, str) and resp_raw.strip().startswith("{") else resp_raw
        if isinstance(data, dict):
            # Validate schema
            FinanceOutput.model_validate(data)
            metrics = data.get("metrics", {})
            if "min_expenses" in assertions:
                if metrics.get("total_expenses", 0) < assertions["min_expenses"]:
                    errors.append(f"total_expenses {metrics.get('total_expenses')} < {assertions['min_expenses']}")
            if "expected_net_savings" in assertions:
                if abs(metrics.get("net_savings_monthly", 0) - assertions["expected_net_savings"]) > 1.0:
                    errors.append(f"net_savings_monthly {metrics.get('net_savings_monthly')} != {assertions['expected_net_savings']}")
            if "expected_runway_months" in assertions:
                if abs(metrics.get("emergency_fund_months", 0) - assertions["expected_runway_months"]) > 0.1:
                    errors.append(f"runway {metrics.get('emergency_fund_months')} != {assertions['expected_runway_months']}")
        else:
            errors.append("Response is not structured JSON dict")
    except Exception as e:
        errors.append(f"Finance schema validation failed: {e}")
    return errors


def evaluate_cooking_case(result: Dict[str, Any], assertions: Dict[str, Any]) -> List[str]:
    errors = []
    resp_raw = result.get("response", "")
    try:
        data = json.loads(resp_raw) if isinstance(resp_raw, str) and resp_raw.strip().startswith("{") else resp_raw
        if isinstance(data, dict):
            CookingRecipe.model_validate(data)
            if "min_ingredients" in assertions:
                if len(data.get("ingredients", [])) < assertions["min_ingredients"]:
                    errors.append(f"ingredients count {len(data.get('ingredients', []))} < {assertions['min_ingredients']}")
            if "min_steps" in assertions:
                if len(data.get("steps", [])) < assertions["min_steps"]:
                    errors.append(f"steps count {len(data.get('steps', []))} < {assertions['min_steps']}")
            if "min_substitutions" in assertions:
                if len(data.get("substitutions", [])) < assertions["min_substitutions"]:
                    errors.append(f"substitutions count {len(data.get('substitutions', []))} < {assertions['min_substitutions']}")
        else:
            errors.append("Response is not structured JSON dict")
    except Exception as e:
        errors.append(f"Cooking schema validation failed: {e}")
    return errors


def evaluate_education_case(result: Dict[str, Any], assertions: Dict[str, Any]) -> List[str]:
    errors = []
    resp_raw = result.get("response", "")
    try:
        data = json.loads(resp_raw) if isinstance(resp_raw, str) and resp_raw.strip().startswith("{") else resp_raw
        if isinstance(data, dict):
            EducationOutput.model_validate(data)
            if "has_diagram" in assertions and assertions["has_diagram"]:
                if not data.get("diagram"):
                    errors.append("Expected diagram but none found")
            if "min_quiz_questions" in assertions:
                if len(data.get("quiz", [])) < assertions["min_quiz_questions"]:
                    errors.append(f"quiz questions {len(data.get('quiz', []))} < {assertions['min_quiz_questions']}")
        else:
            errors.append("Response is not structured JSON dict")
    except Exception as e:
        errors.append(f"Education schema validation failed: {e}")
    return errors


def evaluate_healthcare_case(result: Dict[str, Any], assertions: Dict[str, Any]) -> List[str]:
    errors = []
    resp_raw = result.get("response", "")
    try:
        data = json.loads(resp_raw) if isinstance(resp_raw, str) and resp_raw.strip().startswith("{") else resp_raw
        if isinstance(data, dict):
            HealthcareOutput.model_validate(data)
            banner = data.get("safety_banner", {})
            if "is_emergency" in assertions:
                if banner.get("is_emergency") != assertions["is_emergency"]:
                    errors.append(f"is_emergency {banner.get('is_emergency')} != expected {assertions['is_emergency']}")
        else:
            errors.append("Response is not structured JSON dict")
    except Exception as e:
        errors.append(f"Healthcare schema validation failed: {e}")
    return errors


def run_evals(target_domain: str | None = None) -> None:
    dataset = load_dataset()
    if target_domain:
        dataset = [d for d in dataset if d["domain"] == target_domain]

    print("=" * 70)
    print(f" NEXUSAI EVALUATION HARNESS: Running {len(dataset)} test queries")
    print("=" * 70)

    orch = Orchestrator()
    passed = 0
    failed = 0
    results = []

    for test_case in dataset:
        cid = test_case["id"]
        domain = test_case["domain"]
        query = test_case["query"]
        assertions = test_case.get("assertions", {})

        print(f"[{cid}] [{domain.upper()}] Query: {query[:60]}...")
        start_t = time.time()
        try:
            res = orch.handle_query(
                user_message=query,
                mode=domain,
                session_id=f"eval_{cid}",
                user_profile={"name": "Eval User", "age": 28, "education": "College", "email": "eval@test.com"},
            )
            elapsed = time.time() - start_t

            errs = []
            if domain == "finance":
                errs = evaluate_finance_case(res, assertions)
            elif domain == "cooking":
                errs = evaluate_cooking_case(res, assertions)
            elif domain == "education":
                errs = evaluate_education_case(res, assertions)
            elif domain == "healthcare":
                errs = evaluate_healthcare_case(res, assertions)

            if not errs:
                print(f"  --> PASS (took {elapsed:.2f}s)")
                passed += 1
                results.append({"id": cid, "status": "PASS", "time": elapsed})
            else:
                print(f"  --> FAIL: {errs} (took {elapsed:.2f}s)")
                failed += 1
                results.append({"id": cid, "status": "FAIL", "errors": errs, "time": elapsed})

        except Exception as e:
            elapsed = time.time() - start_t
            print(f"  --> EXCEPTION: {e} (took {elapsed:.2f}s)")
            failed += 1
            results.append({"id": cid, "status": "ERROR", "errors": [str(e)], "time": elapsed})

    total = passed + failed
    pass_pct = (passed / total * 100) if total > 0 else 0
    print("\n" + "=" * 70)
    print(f" EVALUATION SUMMARY: {passed}/{total} PASSED ({pass_pct:.1f}%)")
    print("=" * 70)


if __name__ == "__main__":
    domain_arg = sys.argv[1] if len(sys.argv) > 1 else None
    run_evals(target_domain=domain_arg)
