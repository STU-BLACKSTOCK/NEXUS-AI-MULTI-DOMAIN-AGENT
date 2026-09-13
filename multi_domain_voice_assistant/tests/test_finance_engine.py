"""Unit tests for the Finance arithmetic calculation engine."""

import pytest
from app.llm.schemas import FinanceExtraction, ExpenseItem
from app.assistants.finance.finance_engine import calculate_finance_metrics


def test_savings_rate_and_cashflow():
    extracted = FinanceExtraction(
        monthly_income=6000.0,
        expenses=[
            ExpenseItem(category="rent", amount=2000.0),
            ExpenseItem(category="groceries", amount=600.0),
            ExpenseItem(category="utilities", amount=400.0),
            ExpenseItem(category="entertainment", amount=500.0),
        ],
    )
    metrics = calculate_finance_metrics(extracted)

    assert metrics.total_expenses == 3500.0
    assert metrics.net_savings_monthly == 2500.0
    assert metrics.savings_rate_pct == pytest.approx(41.67, abs=0.01)
    assert metrics.needs_wants_savings_ratio is not None
    assert metrics.needs_wants_savings_ratio["needs"] == pytest.approx(50.0, abs=0.1)


def test_emergency_fund_runway():
    extracted = FinanceExtraction(
        monthly_income=4000.0,
        current_savings=8000.0,
        expenses=[
            ExpenseItem(category="living", amount=3200.0),
        ],
    )
    metrics = calculate_finance_metrics(extracted)
    assert metrics.emergency_fund_months == 2.5


def test_compound_growth_projections():
    extracted = FinanceExtraction(
        monthly_income=5000.0,
        current_savings=15000.0,
        annual_interest_rate_pct=8.0,
        timeframe_months=60,  # 5 years
        expenses=[
            ExpenseItem(category="all", amount=4200.0),  # net savings = $800/mo
        ],
    )
    metrics = calculate_finance_metrics(extracted)
    assert metrics.projected_balance is not None
    assert metrics.projected_balance > 80000.0  # Compound growth exceeds base deposits
    assert metrics.total_interest_paid_or_earned is not None
    assert metrics.total_interest_paid_or_earned > 15000.0


def test_debt_payoff_timeline():
    extracted = FinanceExtraction(
        debt_amount=5000.0,
        debt_interest_rate_pct=20.0,
        monthly_debt_payment=300.0,
    )
    metrics = calculate_finance_metrics(extracted)
    assert metrics.months_to_payoff_debt is not None
    assert 18 <= metrics.months_to_payoff_debt <= 24
