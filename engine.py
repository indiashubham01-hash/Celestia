"""
Bachega - Risk & Simulation Engine
Deterministic math powered by Python & NumPy.
Calculates Health Factors (HF), liquidation thresholds, proximity margins,
and multidimensional collateral price shock matrices (-10% to -50%).
"""

from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timezone
import uuid
import numpy as np

from schemas import (
    RiskLevel,
    ScenarioOutcome,
    ShockStepResult,
    SimulationResponse,
)
from config import settings


def classify_risk_level(health_factor: float) -> RiskLevel:
    """Categorizes Health Factor into standardized borrower safety tiers."""
    if health_factor >= 1.50:
        return RiskLevel.SAFE
    elif health_factor >= 1.25:
        return RiskLevel.MODERATE
    elif health_factor >= 1.10:
        return RiskLevel.ELEVATED
    elif health_factor >= 1.00:
        return RiskLevel.CRITICAL
    else:
        return RiskLevel.LIQUIDATABLE


def calculate_position_metrics(
    position_data: Dict[str, Any],
    spot_prices: Optional[Dict[str, Dict[str, float]]] = None,
) -> Dict[str, Any]:
    """
    Computes precise Health Factor, LTV, Liquidation Price, and Proximity %
    using current market or oracle prices.
    """
    collaterals = position_data.get("collaterals", [])
    debts = position_data.get("debts", [])

    total_collateral_usd = 0.0
    weighted_liquidation_capacity = 0.0
    weighted_max_ltv_capacity = 0.0

    volatile_asset_amount = 0.0
    volatile_asset_price = 0.0
    volatile_asset_lt = 0.80
    stable_liquidation_capacity = 0.0

    enriched_collaterals = []
    for c in collaterals:
        sym = c["symbol"]
        price = c["spot_price_usd"]
        if spot_prices and sym in spot_prices:
            price = spot_prices[sym]["usd"]

        amount = float(c["amount"])
        usd_val = amount * price
        lt_ratio = float(c["liquidation_threshold_pct"]) / 100.0
        max_ltv_ratio = float(c["max_ltv_pct"]) / 100.0

        total_collateral_usd += usd_val
        weighted_liquidation_capacity += usd_val * lt_ratio
        weighted_max_ltv_capacity += usd_val * max_ltv_ratio

        if c.get("is_volatile", True):
            volatile_asset_amount += amount
            volatile_asset_price = price
            volatile_asset_lt = lt_ratio
        else:
            stable_liquidation_capacity += usd_val * lt_ratio

        enriched_collaterals.append({
            "symbol": sym,
            "amount": amount,
            "spot_price_usd": round(price, 2),
            "usd_value": round(usd_val, 2),
            "liquidation_threshold_pct": c["liquidation_threshold_pct"],
            "max_ltv_pct": c["max_ltv_pct"],
            "is_volatile": c.get("is_volatile", True),
        })

    # Debt calculations
    total_debt_usd = 0.0
    enriched_debts = []
    for d in debts:
        sym = d["symbol"]
        price = d["spot_price_usd"]
        if spot_prices and sym in spot_prices:
            price = spot_prices[sym]["usd"]

        amount = float(d["amount"])
        usd_val = amount * price
        total_debt_usd += usd_val

        enriched_debts.append({
            "symbol": sym,
            "amount": amount,
            "spot_price_usd": round(price, 2),
            "usd_value": round(usd_val, 2),
            "borrow_apy_pct": d.get("borrow_apy_pct", 5.0),
            "borrow_type": d.get("borrow_type", "VARIABLE"),
        })

    # Health Factor = sum(Collateral_i * LT_i) / Total Debt
    if total_debt_usd > 0.0:
        health_factor = weighted_liquidation_capacity / total_debt_usd
        current_ltv_pct = (total_debt_usd / total_collateral_usd) * 100.0 if total_collateral_usd > 0 else 0.0
    else:
        health_factor = 999.0
        current_ltv_pct = 0.0

    avg_liquidation_threshold_pct = (
        (weighted_liquidation_capacity / total_collateral_usd) * 100.0
        if total_collateral_usd > 0
        else 80.0
    )
    avg_max_ltv_pct = (
        (weighted_max_ltv_capacity / total_collateral_usd) * 100.0
        if total_collateral_usd > 0
        else 75.0
    )

    # Liquidation Price calculation for volatile collateral asset:
    # Liquidation occurs when (volatile_amount * P_liq * LT_volatile + stable_capacity) = Total Debt
    # => P_liq = (Total Debt - stable_capacity) / (volatile_amount * LT_volatile)
    if volatile_asset_amount > 0 and volatile_asset_lt > 0:
        debt_to_cover = max(0.0, total_debt_usd - stable_liquidation_capacity)
        liquidation_price_usd = debt_to_cover / (volatile_asset_amount * volatile_asset_lt)
        # Proximity: % price drop needed to hit liquidation
        if volatile_asset_price > 0:
            liquidation_proximity_pct = (
                (liquidation_price_usd - volatile_asset_price) / volatile_asset_price
            ) * 100.0
        else:
            liquidation_proximity_pct = 0.0
    else:
        liquidation_price_usd = 0.0
        liquidation_proximity_pct = -100.0

    risk_level = classify_risk_level(health_factor)

    return {
        "health_factor": round(float(health_factor), 3),
        "current_ltv_pct": round(float(current_ltv_pct), 2),
        "max_ltv_pct": round(float(avg_max_ltv_pct), 2),
        "liquidation_threshold_pct": round(float(avg_liquidation_threshold_pct), 2),
        "liquidation_price_usd": round(float(liquidation_price_usd), 2),
        "liquidation_proximity_pct": round(float(liquidation_proximity_pct), 2),
        "risk_level": risk_level,
        "total_collateral_usd": round(float(total_collateral_usd), 2),
        "total_debt_usd": round(float(total_debt_usd), 2),
        "net_value_usd": round(float(total_collateral_usd - total_debt_usd), 2),
        "collaterals": enriched_collaterals,
        "debts": enriched_debts,
        "volatile_asset_price": volatile_asset_price,
        "volatile_asset_amount": volatile_asset_amount,
        "volatile_asset_lt": volatile_asset_lt,
        "stable_liquidation_capacity": stable_liquidation_capacity,
    }


def execute_stress_test_simulation(
    position_data: Dict[str, Any],
    custom_shocks: Optional[List[float]] = None,
    repay_amounts_usd: Optional[List[float]] = None,
    add_collateral_amounts_usd: Optional[List[float]] = None,
    spot_prices: Optional[Dict[str, Dict[str, float]]] = None,
) -> SimulationResponse:
    """
    Executes vectorized stress test calculations across hypothetical collateral price shocks (-10% to -50%).
    Evaluates:
      1. 'Do Nothing' (status quo under market crash)
      2. 'Repay Debt' (de-leveraging action)
      3. 'Add Collateral' (buffer fortification)
    Guarantees deterministic math via NumPy and includes explicit disclaimers.
    """
    # 1. Base position metrics
    base = calculate_position_metrics(position_data, spot_prices)
    base_debt = base["total_debt_usd"]
    volatile_amount = base["volatile_asset_amount"]
    base_volatile_price = base["volatile_asset_price"]
    volatile_lt = base["volatile_asset_lt"]
    stable_cap = base["stable_liquidation_capacity"]
    stable_collateral = sum(
        c["usd_value"] for c in base["collaterals"] if not c.get("is_volatile", True)
    )

    # 2. Setup shock percentages as NumPy array (default: -10%, -20%, -30%, -40%, -50%)
    if custom_shocks:
        shocks_arr = np.array(sorted(custom_shocks, reverse=True), dtype=np.float64)
    else:
        shocks_arr = np.array([-0.10, -0.20, -0.30, -0.40, -0.50], dtype=np.float64)

    # 3. Setup default action scenarios if not provided
    if repay_amounts_usd:
        repay_steps = np.array(repay_amounts_usd, dtype=np.float64)
    else:
        # Default de-leveraging scenarios: 15%, 30%, 50% of total debt
        repay_steps = np.array([
            round(base_debt * 0.15, 2),
            round(base_debt * 0.30, 2),
            round(base_debt * 0.50, 2),
        ], dtype=np.float64)

    if add_collateral_amounts_usd:
        add_collat_steps = np.array(add_collateral_amounts_usd, dtype=np.float64)
    else:
        # Default collateral injection scenarios: 10%, 25%, 50% of debt equivalent in buffer
        add_collat_steps = np.array([
            round(base_debt * 0.10, 2),
            round(base_debt * 0.25, 2),
            round(base_debt * 0.50, 2),
        ], dtype=np.float64)

    # 4. Simulation calculations for each shock step
    step_results: List[ShockStepResult] = []

    for shock in shocks_arr:
        shock_pct = float(shock * 100.0)
        shock_factor = float(1.0 + shock)
        shocked_volatile_price = float(base_volatile_price * shock_factor)
        shocked_volatile_usd = float(volatile_amount * shocked_volatile_price)
        total_shocked_collateral = float(shocked_volatile_usd + stable_collateral)

        # Weighted liquidation capacity under shock
        shocked_liq_capacity = float(
            (shocked_volatile_usd * volatile_lt) + stable_cap
        )

        # A. Scenario 1: DO NOTHING
        do_nothing_hf = (
            shocked_liq_capacity / base_debt if base_debt > 0 else 999.0
        )
        do_nothing_ltv = (
            (base_debt / total_shocked_collateral) * 100.0
            if total_shocked_collateral > 0
            else 0.0
        )
        is_liquidated = bool(do_nothing_hf < 1.0)
        shortfall = max(0.0, base_debt - shocked_liq_capacity)
        buffer_usd = max(0.0, shocked_liq_capacity - base_debt)

        do_nothing_outcome = ScenarioOutcome(
            action_type="DO_NOTHING",
            action_description=f"Maintain current position without action at {shock_pct:.1f}% market drop",
            simulated_health_factor=round(float(do_nothing_hf), 3),
            simulated_ltv_pct=round(float(do_nothing_ltv), 2),
            simulated_collateral_usd=round(float(total_shocked_collateral), 2),
            simulated_debt_usd=round(float(base_debt), 2),
            is_liquidated=is_liquidated,
            liquidation_shortfall_usd=round(float(shortfall), 2),
            buffer_to_liquidation_usd=round(float(buffer_usd), 2),
            risk_level=classify_risk_level(do_nothing_hf),
        )

        # B. Scenario 2: REPAY DEBT
        repay_outcomes: List[ScenarioOutcome] = []
        for repay_val in repay_steps:
            rem_debt = max(0.0, base_debt - repay_val)
            r_hf = shocked_liq_capacity / rem_debt if rem_debt > 0 else 999.0
            r_ltv = (
                (rem_debt / total_shocked_collateral) * 100.0
                if total_shocked_collateral > 0
                else 0.0
            )
            r_liquidated = bool(r_hf < 1.0)
            r_shortfall = max(0.0, rem_debt - shocked_liq_capacity)
            r_buffer = max(0.0, shocked_liq_capacity - rem_debt)

            repay_outcomes.append(
                ScenarioOutcome(
                    action_type="REPAY_DEBT",
                    action_description=f"Repay ${repay_val:,.2f} debt before shock hits",
                    simulated_health_factor=round(float(r_hf), 3),
                    simulated_ltv_pct=round(float(r_ltv), 2),
                    simulated_collateral_usd=round(float(total_shocked_collateral), 2),
                    simulated_debt_usd=round(float(rem_debt), 2),
                    is_liquidated=r_liquidated,
                    liquidation_shortfall_usd=round(float(r_shortfall), 2),
                    buffer_to_liquidation_usd=round(float(r_buffer), 2),
                    risk_level=classify_risk_level(r_hf),
                )
            )

        # C. Scenario 3: ADD COLLATERAL (Assumes stable collateral addition, e.g. USDC with 85% LT)
        add_collat_outcomes: List[ScenarioOutcome] = []
        assumed_deposit_lt = 0.85
        for add_collat_val in add_collat_steps:
            new_collat_usd = total_shocked_collateral + add_collat_val
            new_liq_cap = shocked_liq_capacity + (add_collat_val * assumed_deposit_lt)
            c_hf = new_liq_cap / base_debt if base_debt > 0 else 999.0
            c_ltv = (base_debt / new_collat_usd) * 100.0 if new_collat_usd > 0 else 0.0
            c_liquidated = bool(c_hf < 1.0)
            c_shortfall = max(0.0, base_debt - new_liq_cap)
            c_buffer = max(0.0, new_liq_cap - base_debt)

            add_collat_outcomes.append(
                ScenarioOutcome(
                    action_type="ADD_COLLATERAL",
                    action_description=f"Deposit +${add_collat_val:,.2f} stable collateral buffer",
                    simulated_health_factor=round(float(c_hf), 3),
                    simulated_ltv_pct=round(float(c_ltv), 2),
                    simulated_collateral_usd=round(float(new_collat_usd), 2),
                    simulated_debt_usd=round(float(base_debt), 2),
                    is_liquidated=c_liquidated,
                    liquidation_shortfall_usd=round(float(c_shortfall), 2),
                    buffer_to_liquidation_usd=round(float(c_buffer), 2),
                    risk_level=classify_risk_level(c_hf),
                )
            )

        step_results.append(
            ShockStepResult(
                shock_percentage=round(shock_pct, 1),
                shock_factor=round(shock_factor, 2),
                simulated_volatile_asset_price=round(shocked_volatile_price, 2),
                do_nothing=do_nothing_outcome,
                repay_debt_scenarios=repay_outcomes,
                add_collateral_scenarios=add_collat_outcomes,
            )
        )

    assumptions_list = [
        "Instantaneous price shock applied exclusively to volatile collateral asset.",
        "Debt assets are pegged to $1.00 face value; no interest or fee compounding during the crash window.",
        "Protocol liquidation threshold (LT) and liquidation penalty factors remain constant.",
        "Excludes on-chain transaction gas costs, DEX slippage, and protocol liquidation bonus penalties.",
        "Model evaluates individual retail borrower insolvency boundaries in a deterministic environment.",
    ]

    return SimulationResponse(
        simulation_id=f"sim_{uuid.uuid4().hex[:10]}",
        position_id=position_data.get("position_id", "pos_unknown"),
        timestamp=datetime.now(timezone.utc),
        disclaimer=settings.SIMULATION_DISCLAIMER,
        assumptions=assumptions_list,
        base_metrics={
            "initial_health_factor": base["health_factor"],
            "initial_ltv_pct": base["current_ltv_pct"],
            "initial_collateral_usd": base["total_collateral_usd"],
            "initial_debt_usd": base["total_debt_usd"],
            "liquidation_price_usd": base["liquidation_price_usd"],
            "liquidation_proximity_pct": base["liquidation_proximity_pct"],
            "volatile_asset_spot_usd": base["volatile_asset_price"],
        },
        results=step_results,
    )

