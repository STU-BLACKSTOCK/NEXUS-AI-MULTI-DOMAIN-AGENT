"""
Finance calculation engine: pure Python deterministic arithmetic.
Calculates savings rates, compound growth projections, debt amortization,
expense ratios (50/30/20), and emergency runway without relying on LLM math.
"""

from __future__ import annotations

import math
from typing import Dict, Optional
from app.llm.schemas import FinanceExtraction, FinanceMetrics


def calculate_finance_metrics(extracted: FinanceExtraction) -> FinanceMetrics:
    """
    Computes all quantitative metrics deterministically using standard financial formulas.
    """
    metrics = FinanceMetrics()

    # 1. Total Expenses
    total_expenses = sum(item.amount for item in extracted.expenses) if extracted.expenses else 0.0
    metrics.total_expenses = round(total_expenses, 2)

    # 2. Monthly Net Savings & Savings Rate
    income = extracted.monthly_income
    if income is not None and income > 0:
        net_savings = income - total_expenses
        metrics.net_savings_monthly = round(net_savings, 2)
        savings_rate = (net_savings / income) * 100.0
        metrics.savings_rate_pct = round(savings_rate, 2)

        # 3. 50/30/20 Needs, Wants, Savings Breakdown
        needs_categories = {"rent", "mortgage", "groceries", "utilities", "bills", "healthcare", "insurance", "loan", "debt", "transport"}
        needs_total = 0.0
        wants_total = 0.0
        for item in extracted.expenses:
            cat = (item.category or "").lower()
            if any(n in cat for n in needs_categories):
                needs_total += item.amount
            else:
                wants_total += item.amount

        # If categories weren't specifically tagged, treat expenses as needs
        if needs_total == 0.0 and wants_total > 0.0:
            needs_total = wants_total
            wants_total = 0.0

        needs_pct = round((needs_total / income) * 100.0, 1)
        wants_pct = round((wants_total / income) * 100.0, 1)
        savings_pct = round(max(0.0, (net_savings / income) * 100.0), 1)
        metrics.needs_wants_savings_ratio = {
            "needs": needs_pct,
            "wants": wants_pct,
            "savings": savings_pct,
        }

    # 4. Emergency Fund Runway (Months of survival)
    savings = extracted.current_savings
    if savings is not None and total_expenses > 0:
        runway_months = savings / total_expenses
        metrics.emergency_fund_months = round(runway_months, 2)

    # 5. Compound Growth Projections (Future Value FV)
    # FV = P*(1 + r/n)^(nt) + PMT * [((1 + r/n)^(nt) - 1) / (r/n)]
    principal = savings or 0.0
    monthly_deposit = max(0.0, metrics.net_savings_monthly) if income is not None else 0.0
    rate_pct = extracted.annual_interest_rate_pct or (7.0 if extracted.goal_type == "compound_growth" else None)
    timeframe_m = extracted.timeframe_months

    if rate_pct is not None and timeframe_m is not None and timeframe_m > 0:
        monthly_rate = (rate_pct / 100.0) / 12.0
        if monthly_rate > 0:
            fv_principal = principal * math.pow(1.0 + monthly_rate, timeframe_m)
            fv_contributions = monthly_deposit * ((math.pow(1.0 + monthly_rate, timeframe_m) - 1.0) / monthly_rate)
            total_fv = fv_principal + fv_contributions
            total_deposited = principal + (monthly_deposit * timeframe_m)
            metrics.projected_balance = round(total_fv, 2)
            metrics.total_interest_paid_or_earned = round(max(0.0, total_fv - total_deposited), 2)
        else:
            total_fv = principal + (monthly_deposit * timeframe_m)
            metrics.projected_balance = round(total_fv, 2)
            metrics.total_interest_paid_or_earned = 0.0

    # 6. Time to reach Target Savings Goal
    goal = extracted.target_savings_goal
    if goal is not None and goal > principal:
        needed = goal - principal
        if monthly_deposit > 0:
            if rate_pct and rate_pct > 0:
                monthly_rate = (rate_pct / 100.0) / 12.0
                try:
                    # n = ln((FV*r + PMT) / (P*r + PMT)) / ln(1+r)
                    num = (goal * monthly_rate + monthly_deposit)
                    denom = (principal * monthly_rate + monthly_deposit)
                    months = math.ceil(math.log(num / denom) / math.log(1.0 + monthly_rate))
                    metrics.months_to_reach_goal = max(1, months)
                except (ValueError, ZeroDivisionError):
                    metrics.months_to_reach_goal = math.ceil(needed / monthly_deposit)
            else:
                metrics.months_to_reach_goal = math.ceil(needed / monthly_deposit)

    # 7. Debt Payoff Amortization
    debt = extracted.debt_amount
    debt_apr = extracted.debt_interest_rate_pct
    debt_pmt = extracted.monthly_debt_payment or (metrics.net_savings_monthly if metrics.net_savings_monthly > 0 else None)

    if debt is not None and debt > 0 and debt_pmt is not None and debt_pmt > 0:
        if debt_apr is not None and debt_apr > 0:
            r = (debt_apr / 100.0) / 12.0
            if debt_pmt > debt * r:
                try:
                    # n = -ln(1 - (debt*r)/PMT) / ln(1+r)
                    n_months = math.ceil(-math.log(1.0 - (debt * r) / debt_pmt) / math.log(1.0 + r))
                    metrics.months_to_payoff_debt = max(1, n_months)
                    total_paid = debt_pmt * n_months
                    metrics.total_interest_paid_or_earned = round(max(0.0, total_paid - debt), 2)
                except (ValueError, ZeroDivisionError):
                    metrics.months_to_payoff_debt = math.ceil(debt / debt_pmt)
            else:
                # Minimum payment does not cover monthly interest accumulation
                metrics.months_to_payoff_debt = 999
        else:
            metrics.months_to_payoff_debt = math.ceil(debt / debt_pmt)

    return metrics
