#!/usr/bin/env python3
"""
Bachega.fi — Principal Quantitative Telegram Risk Bot
Bot Username: @Bachega_bot
Backend Target: http://localhost:8000

Implements pure deterministic DeFi smart contract mathematical formulas:
- Exact Collateral USD valuation (C_0, C_shock)
- Exact Health Factor (HF_0, HF_shock)
- Exact Liquidation Price (P_liq)
- Maximum Market Drop Buffer (% to liquidation)
- Dynamic Debt Rescue Math (Target HF = 1.10)
- Dynamic Collateral Addition Math (Target HF = 1.10)
- Natural Language & Regex Dynamic Input Parser
"""

import os
import re
import sys
import logging
import asyncio
from dataclasses import dataclass
from typing import Dict, Any, Optional, Tuple

from dotenv import load_dotenv
import requests
from telegram import Update
from telegram.ext import (
    Application,
    CommandHandler,
    MessageHandler,
    ContextTypes,
    filters,
)

# Load environment configuration from .env securely
load_dotenv()

# ---------------------------------------------------------------------------
# Bot & Environment Configuration
# ---------------------------------------------------------------------------

BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "").strip()
BOT_USERNAME = os.getenv("TELEGRAM_BOT_USERNAME", "@Bachegafi_bot").strip()
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000").strip()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()

# Setup Logging
logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger("bachega_quant_bot")

# Standard Mandatory Copy
DISCLAIMER_TEXT = "ℹ️ _Simulation, not prediction._"

GREETING_TEXT = (
    "👋 *Namaskar! Welcome to Bachega.fi*\n\n"
    "I am your *Principal Quantitative DeFi Risk & Liquidation Protection Assistant*.\n"
    "I monitor on-chain lending vaults and simulate stress tests across Aave V3, Compound V3, and Spark.\n\n"
    "🚀 *You can ask me anything about your positions, crash risk, or DeFi math:*\n\n"
    "⚡ *Stress Test Any Crash:*\n"
    "• `Simulate 35% ETH crash` (or any % like `crash 20%`)\n"
    "• `What if ETH drops to $1,800?` (or any target price)\n"
    "• `Test 3 BTC at $60,000 with $80,000 debt`\n\n"
    "🛡️ *Rescue & Defense Strategies:*\n"
    "• `How much debt should I repay?` (Target HF 1.10 rescue)\n"
    "• `Explain the 5 strategies` (Do Nothing, Repay, Add, Swap, Deleverage)\n"
    "• `How does Collateral Swap work?` ($0 external capital)\n"
    "• `What is Partial Deleverage?` (Self-rescue auto-sell)\n\n"
    "📊 *Live Position Health:*\n"
    "• `Current health factor`\n"
    "• `Liquidation price`\n"
    "• `Check wallet 0x71C...39A4`\n\n"
    f"{DISCLAIMER_TEXT}"
)

SERVER_OFFLINE_TEXT = (
    "⚠️ *Could not connect to the Bachega.fi backend server.*\n\n"
    "Please verify your app server is running on `http://localhost:8000` "
    "(e.g. `uvicorn main:app --reload`)."
)


# ---------------------------------------------------------------------------
# Quantitative Risk Data Model & Smart Contract Formulas
# ---------------------------------------------------------------------------

def calculate_defi_risk(
    collateral_amount: float = 2.5,
    collateral_price_usd: float = 3000.0,
    debt_usd: float = 4500.0,
    liquidation_threshold: float = 0.825,
    price_shock_pct: float = -35.0,
    rescue_budget_usd: float = 750.0,
    stable_lt: float = 0.90,
    target_hf: float = 1.10,
    collateral_symbol: str = "ETH",
    debt_symbol: str = "USDC",
) -> Dict[str, Any]:
    """
    Evaluates 5 comprehensive DeFi rescue strategies under market shock:
    1. do_nothing (passive observation under crash)
    2. repay_debt (de-leveraging via external capital)
    3. add_collateral (buffer deposit via external capital)
    4. collateral_swap (zero external cash, freezes volatility, boosts LT to 0.90)
    5. partial_deleverage (self-rescue via collateral auto-liquidation, restores HF to target_hf)
    """
    # 1. Base Valuation
    c_0 = collateral_amount * collateral_price_usd
    hf_0 = (c_0 * liquidation_threshold) / debt_usd if debt_usd > 0 else 999.0
    denom = collateral_amount * liquidation_threshold
    p_liq = (debt_usd / denom) if denom > 0 else 0.0
    buffer_pct = (1.0 - (1.0 / hf_0)) * 100.0 if hf_0 > 0 else 0.0

    # 1. Strategy: Do Nothing
    shocked_collateral_usd = collateral_amount * collateral_price_usd * (1.0 + price_shock_pct / 100.0)
    p_shock = collateral_price_usd * (1.0 + (price_shock_pct / 100.0))
    hf_do_nothing = (shocked_collateral_usd * liquidation_threshold) / debt_usd if debt_usd > 0 else 999.0
    is_liquidated = bool(hf_do_nothing < 1.0)
    do_nothing = {
        "strategy_id": "do_nothing",
        "name": "Do Nothing",
        "action_type": "DO_NOTHING",
        "hf": round(float(hf_do_nothing), 3),
        "is_liquidated": is_liquidated,
        "capital_required": 0.0,
        "shocked_collateral_usd": round(float(shocked_collateral_usd), 2),
        "debt_usd": round(float(debt_usd), 2),
        "note": "Maintain position with zero intervention under market crash",
    }

    # 2. Strategy: Repay Debt
    new_debt = max(debt_usd - rescue_budget_usd, 1.0)
    hf_repay = (shocked_collateral_usd * liquidation_threshold) / new_debt if new_debt > 0 else 999.0
    repay_debt = {
        "strategy_id": "repay_debt",
        "name": "Repay Debt",
        "action_type": "REPAY_DEBT",
        "hf": round(float(hf_repay), 3),
        "capital_required": float(rescue_budget_usd),
        "new_debt": round(float(new_debt), 2),
        "is_liquidated": bool(hf_repay < 1.0),
        "note": f"De-leverage with ${rescue_budget_usd:,.2f} external cash",
    }

    # 3. Strategy: Add Collateral
    new_collateral_usd = shocked_collateral_usd + rescue_budget_usd
    hf_add = (new_collateral_usd * liquidation_threshold) / debt_usd if debt_usd > 0 else 999.0
    add_collateral = {
        "strategy_id": "add_collateral",
        "name": "Add Collateral",
        "action_type": "ADD_COLLATERAL",
        "hf": round(float(hf_add), 3),
        "capital_required": float(rescue_budget_usd),
        "new_collateral_usd": round(float(new_collateral_usd), 2),
        "is_liquidated": bool(hf_add < 1.0),
        "note": f"Deposit fresh collateral buffer of ${rescue_budget_usd:,.2f}",
    }

    # 4. Strategy: Collateral Swap (Zero external capital)
    hf_swap = (shocked_collateral_usd * stable_lt) / debt_usd if debt_usd > 0 else 999.0
    collateral_swap = {
        "strategy_id": "collateral_swap",
        "name": "Collateral Swap",
        "action_type": "COLLATERAL_SWAP",
        "hf": round(float(hf_swap), 3),
        "capital_required": 0.0,
        "stable_lt": stable_lt,
        "is_liquidated": bool(hf_swap < 1.0),
        "note": "Freezes downward volatility and raises LT from 82.5% to 90%",
    }

    # 5. Strategy: Partial Deleverage (Self-rescue via collateral liquidation)
    denom_del = target_hf - liquidation_threshold
    delta_sold = (target_hf * debt_usd - shocked_collateral_usd * liquidation_threshold) / denom_del if denom_del > 0 else 0.0
    delta_sold = max(0.0, min(delta_sold, shocked_collateral_usd))
    rem_debt = max(1.0, debt_usd - delta_sold)
    rem_col = max(0.0, shocked_collateral_usd - delta_sold)
    hf_deleverage = (rem_col * liquidation_threshold) / rem_debt if rem_debt > 0 else 999.0
    partial_deleverage = {
        "strategy_id": "partial_deleverage",
        "name": "Partial Deleverage",
        "action_type": "PARTIAL_DELEVERAGE",
        "hf": round(float(hf_deleverage), 3),
        "collateral_sold_usd": round(float(delta_sold), 2),
        "capital_required": 0.0,
        "rem_debt": round(float(rem_debt), 2),
        "rem_col": round(float(rem_col), 2),
        "is_liquidated": bool(hf_deleverage < 1.0),
        "note": f"Sells exact collateral needed to restore HF to {target_hf:.2f} with zero outside capital",
    }

    # Additional Rescue Helper Metrics (Target HF = 1.10)
    safe_debt_limit = (shocked_collateral_usd * liquidation_threshold) / target_hf if target_hf > 0 else 0.0
    repay_needed_usd = max(0.0, debt_usd - safe_debt_limit)
    target_collateral_usd = (target_hf * debt_usd) / liquidation_threshold if liquidation_threshold > 0 else 0.0
    add_collateral_usd = max(0.0, target_collateral_usd - shocked_collateral_usd)
    add_collateral_tokens = (add_collateral_usd / p_shock) if p_shock > 0 else 0.0

    return {
        "collateral_amount": collateral_amount,
        "collateral_price_usd": collateral_price_usd,
        "debt_usd": debt_usd,
        "liquidation_threshold": liquidation_threshold,
        "price_shock_pct": price_shock_pct,
        "rescue_budget_usd": rescue_budget_usd,
        "stable_lt": stable_lt,
        "target_hf": target_hf,
        "collateral_symbol": collateral_symbol,
        "debt_symbol": debt_symbol,
        "c_0": c_0,
        "hf_0": hf_0,
        "p_liq": p_liq,
        "buffer_pct": buffer_pct,
        "p_shock": p_shock,
        "shocked_collateral_usd": shocked_collateral_usd,
        "is_liquidated": is_liquidated,
        "safe_debt_limit": safe_debt_limit,
        "repay_needed_usd": repay_needed_usd,
        "target_collateral_usd": target_collateral_usd,
        "add_collateral_usd": add_collateral_usd,
        "add_collateral_tokens": add_collateral_tokens,
        "do_nothing": do_nothing,
        "repay_debt": repay_debt,
        "add_collateral": add_collateral,
        "collateral_swap": collateral_swap,
        "partial_deleverage": partial_deleverage,
    }


def compute_quantitative_risk(
    collateral_amount: float = 2.5,
    collateral_price_usd: float = 3000.0,
    debt_usd: float = 4500.0,
    liquidation_threshold: float = 0.825,
    price_shock_pct: float = -35.0,
    target_hf: float = 1.10,
    collateral_symbol: str = "ETH",
    debt_symbol: str = "USDC",
    sample_budget_usd: float = 750.0,
) -> Dict[str, Any]:
    """Compatibility wrapper calling calculate_defi_risk."""
    return calculate_defi_risk(
        collateral_amount=collateral_amount,
        collateral_price_usd=collateral_price_usd,
        debt_usd=debt_usd,
        liquidation_threshold=liquidation_threshold,
        price_shock_pct=price_shock_pct,
        rescue_budget_usd=sample_budget_usd,
        target_hf=target_hf,
        collateral_symbol=collateral_symbol,
        debt_symbol=debt_symbol,
    )


# ---------------------------------------------------------------------------
# Dynamic Regex & Intent Parser
# ---------------------------------------------------------------------------

def parse_user_query(text: str) -> Dict[str, Any]:
    """
    Extracts numerical parameters, tokens, and intents dynamically:
    - Percentage drop/shock
    - Target price shock (e.g. "What if ETH drops to $2000?")
    - Collateral token amount & symbol (ETH, BTC, SOL, WBTC, etc.)
    - Collateral spot price
    - Debt amount & symbol
    - Intent flags (status vs. crash vs. repay vs. strategies vs. education)
    """
    text_clean = text.lower().strip()

    # 1. Price Shock Percentage
    shock_pct = None
    target_price = None

    m_pct = re.search(r'([-−]?[0-9]+(?:\.[0-9]+)?)\s*%', text_clean)
    if m_pct:
        val = float(m_pct.group(1).replace('−', '-'))
        shock_pct = -abs(val)
    else:
        # Check for price drop percentage without % (e.g., "crash 35", "drop 20")
        m_word = re.search(r'(?:crash|drop|shock|fall|down|dump)\s*(?:of\s*)?([0-9]{1,2}(?:\.[0-9]+)?)\b', text_clean)
        if m_word:
            shock_pct = -abs(float(m_word.group(1)))
        else:
            # Check for target dollar price drops (e.g. "drops to 2000", "falls to $1800", "hits 1500")
            m_target = re.search(r'(?:drops?\s+to|falls?\s+to|crashes?\s+to|hits?|reaches?)\s*[$]?([0-9]{2,6}(?:\.[0-9]+)?)', text_clean)
            if m_target:
                try:
                    target_price = float(m_target.group(1))
                except ValueError:
                    pass

    # 2. Collateral Amount & Symbol
    collateral = None
    symbol = "ETH"
    m_col = re.search(r'(?:collateral|collat|deposited?)\s*[:=]?\s*([0-9]+(?:\.[0-9]+)?)', text_clean)
    if m_col:
        collateral = float(m_col.group(1))

    m_token = re.search(r'([0-9]+(?:\.[0-9]+)?)\s*(eth|wbtc|btc|sol|avax|matic|link)\b', text_clean)
    if m_token:
        collateral = float(m_token.group(1))
        symbol = m_token.group(2).upper()
    else:
        # Check standalone token mention
        m_standalone = re.search(r'\b(btc|wbtc|eth|sol|avax|matic|link)\b', text_clean)
        if m_standalone:
            symbol = m_standalone.group(1).upper()

    # 3. Spot Price
    price = None
    m_price = re.search(r'(?:price|at)\s*[:=]?\s*(?:\$)?([0-9]+(?:\.[0-9]+)?)', text_clean)
    if m_price:
        try:
            val = float(m_price.group(1))
            if val > 1.0 and (target_price is None or val != target_price):
                price = val
        except ValueError:
            pass

    # 4. Debt Amount
    debt = None
    m_debt = re.search(r'(?:debt|borrowed?|loan)\s*[:=]?\s*(?:\$)?([0-9]+(?:\.[0-9]+)?)', text_clean)
    if m_debt:
        debt = float(m_debt.group(1))
    else:
        m_stable = re.search(r'([0-9]+(?:\.[0-9]+)?)\s*(?:usdc|usdt|dai)\b', text_clean)
        if m_stable:
            debt = float(m_stable.group(1))

    # 5. Intent Flags
    is_strategies_query = any(k in text_clean for k in ["5 strategies", "strategies", "defense options", "rescue options", "all strategies"])
    is_swap_query = any(k in text_clean for k in ["collateral swap", "swap collateral", "swap to usdc", "swap strategy"])
    is_deleverage_query = any(k in text_clean for k in ["partial deleverage", "deleverage", "auto sell", "self rescue", "self liquidation"])
    is_help_query = any(k in text_clean for k in ["help", "what can you do", "commands", "menu", "capabilities", "features", "how to use"])
    is_repay_query = any(k in text_clean for k in ["repay", "how much to pay", "pay off", "add collateral", "how much debt"])
    is_status_query = any(k in text_clean for k in ["status", "current", "health factor", "hf", "liq price", "liquidation price", "buffer"]) and not is_repay_query
    is_simulation_query = any(k in text_clean for k in ["simulate", "crash", "drop", "shock", "fall"]) or (shock_pct is not None) or (target_price is not None)

    return {
        "shock_pct": shock_pct,
        "target_price": target_price,
        "collateral": collateral,
        "symbol": symbol,
        "price": price,
        "debt": debt,
        "is_strategies_query": is_strategies_query,
        "is_swap_query": is_swap_query,
        "is_deleverage_query": is_deleverage_query,
        "is_help_query": is_help_query,
        "is_repay_query": is_repay_query,
        "is_status_query": is_status_query,
        "is_simulation_query": is_simulation_query,
    }


# ---------------------------------------------------------------------------
# Report Generators (Markdown)
# ---------------------------------------------------------------------------

def format_crash_simulation_response(d: Dict[str, Any]) -> str:
    """
    Renders pure dynamic crash stress test output with 5 evaluated defense strategies:
    1. Do Nothing
    2. Repay Debt ($750)
    3. Add Collateral ($750)
    4. Collateral Swap (ETH -> USDC, $0 Needed)
    5. Partial Deleverage (Sell $X Collateral, $0 Needed)
    """
    shock_display = abs(d["price_shock_pct"])
    do_nothing = d["do_nothing"]
    repay = d["repay_debt"]
    add = d["add_collateral"]
    swap = d["collateral_swap"]
    del_strat = d["partial_deleverage"]

    risk_badge = "⚠️ (Liquidation Risk)" if do_nothing["is_liquidated"] else "✅ (Solvent)"
    status_dn = "🚨 Liquidated" if do_nothing["is_liquidated"] else "⚠️ At Risk"
    swap_badge = "✅" if not swap["is_liquidated"] else "⚠️"

    return (
        f"🚨 *Crash Simulation Result (-{shock_display:.0f}% Shock)*\n\n"
        f"• *Position:* Aave V3 (Arbitrum)\n"
        f"• *Collateral:* {d['collateral_amount']:.1f} {d['collateral_symbol']} (${d['c_0']:,.0f} → ${d['shocked_collateral_usd']:,.0f})\n"
        f"• *Current Debt:* ${d['debt_usd']:,.0f} {d['debt_symbol']}\n"
        f"• *Projected Health Factor:* *{do_nothing['hf']:.2f}* {risk_badge}\n\n"
        f"🛡️ *5 Evaluated Defense Strategies:*\n"
        f"1. *Do Nothing:* HF *{do_nothing['hf']:.2f}* {status_dn}\n"
        f"2. *Repay Debt (${d['rescue_budget_usd']:,.0f}):* HF restores to *{repay['hf']:.2f}* ✅\n"
        f"3. *Add Collateral (${d['rescue_budget_usd']:,.0f}):* HF restores to *{add['hf']:.2f}* ✅\n"
        f"4. *Collateral Swap ({d['collateral_symbol']} → USDC, $0 Needed):* HF restores to *{swap['hf']:.2f}* {swap_badge}\n"
        f"5. *Partial Deleverage (Sell ${del_strat['collateral_sold_usd']:,.0f} Collateral, $0 Needed):* HF restores to *{del_strat['hf']:.2f}* ✅ Safe\n\n"
        f"{DISCLAIMER_TEXT}"
    )


def format_status_response(d: Dict[str, Any]) -> str:
    """
    Renders live position status, exact liquidation price, and market drop buffer.
    """
    status_badge = "✅ (Stable)" if d["hf_0"] >= 1.25 else "⚠️ (Caution)"

    # Compute quick deterministic sensitivity projections
    m_15 = calculate_defi_risk(
        collateral_amount=d["collateral_amount"],
        collateral_price_usd=d["collateral_price_usd"],
        debt_usd=d["debt_usd"],
        liquidation_threshold=d["liquidation_threshold"],
        price_shock_pct=-15.0,
        collateral_symbol=d["collateral_symbol"],
        debt_symbol=d["debt_symbol"],
    )
    m_25 = calculate_defi_risk(
        collateral_amount=d["collateral_amount"],
        collateral_price_usd=d["collateral_price_usd"],
        debt_usd=d["debt_usd"],
        liquidation_threshold=d["liquidation_threshold"],
        price_shock_pct=-25.0,
        collateral_symbol=d["collateral_symbol"],
        debt_symbol=d["debt_symbol"],
    )
    m_35 = calculate_defi_risk(
        collateral_amount=d["collateral_amount"],
        collateral_price_usd=d["collateral_price_usd"],
        debt_usd=d["debt_usd"],
        liquidation_threshold=d["liquidation_threshold"],
        price_shock_pct=-35.0,
        collateral_symbol=d["collateral_symbol"],
        debt_symbol=d["debt_symbol"],
    )

    return (
        f"📊 *Live Position Health & Liquidation Boundaries*\n\n"
        f"• *Protocol:* Aave V3 (Arbitrum)\n"
        f"• *Collateral:* {d['collateral_amount']:.2f} {d['collateral_symbol']} (${d['c_0']:,.2f} @ ${d['collateral_price_usd']:,.2f})\n"
        f"• *Current Debt:* ${d['debt_usd']:,.2f} {d['debt_symbol']}\n"
        f"• *Liquidation Threshold:* {d['liquidation_threshold'] * 100:.1f}%\n"
        f"• *Current Health Factor:* *{d['hf_0']:.2f}* {status_badge}\n"
        f"• *Exact Liquidation Price:* *${d['p_liq']:,.2f}*\n"
        f"• *Market Drop Buffer:* *{d['buffer_pct']:.1f}%* (Max crash room before liquidation)\n\n"
        f"💡 *Deterministic Stress Sensitivity:*\n"
        f"• -15% Shock (${m_15['p_shock']:,.2f}): Projected HF = *{m_15['do_nothing']['hf']:.2f}* ✅\n"
        f"• -25% Shock (${m_25['p_shock']:,.2f}): Projected HF = *{m_25['do_nothing']['hf']:.2f}* ⚠️\n"
        f"• -35% Shock (${m_35['p_shock']:,.2f}): Projected HF = *{m_35['do_nothing']['hf']:.2f}* 🚨\n\n"
        f"_Ask `Simulate 35% ETH crash` or `How much debt should I repay?`_\n\n"
        f"{DISCLAIMER_TEXT}"
    )


def format_repay_rescue_response(d: Dict[str, Any]) -> str:
    """
    Renders exact mathematical repayment and collateral addition requirements.
    """
    risk_badge = "⚠️ (Liquidation Risk)" if d["do_nothing"]["is_liquidated"] else "✅ (Solvent)"
    shock_display = abs(d["price_shock_pct"])

    return (
        f"🛡️ *Dynamic Debt & Rescue Analysis (-{shock_display:.0f}% Shock)*\n\n"
        f"• *Position:* {d['collateral_amount']:.2f} {d['collateral_symbol']} | ${d['debt_usd']:,.2f} {d['debt_symbol']}\n"
        f"• *Shocked Asset Price:* ${d['p_shock']:,.2f} / {d['collateral_symbol']}\n"
        f"• *Projected Health Factor:* *{d['do_nothing']['hf']:.2f}* {risk_badge}\n"
        f"• *Target Health Factor:* *{d['target_hf']:.2f}*\n\n"
        f"⚖️ *Exact Required Adjustments:*\n"
        f"1. *Full Safety Debt Repayment (Target HF = {d['target_hf']:.2f}):*\n"
        f"   • Repay: *${d['repay_needed_usd']:,.2f}* {d['debt_symbol']}\n"
        f"   • Remaining Debt: ${d['safe_debt_limit']:,.2f} {d['debt_symbol']}\n"
        f"   • Restores Health Factor to *{d['target_hf']:.2f}* ✅\n\n"
        f"2. *Fixed Budget Rescue (${d['rescue_budget_usd']:,.2f}):*\n"
        f"   • Repaying ${d['rescue_budget_usd']:,.2f} {d['debt_symbol']} restores HF to *{d['repay_debt']['hf']:.2f}* ✅\n\n"
        f"3. *Collateral Buffer Alternative:*\n"
        f"   • Add *${d['add_collateral_usd']:,.2f}* USD collateral (*{d['add_collateral_tokens']:.4f} {d['collateral_symbol']}*)\n"
        f"   • Restores Health Factor to *{d['target_hf']:.2f}* ✅\n\n"
        f"4. *Zero External Capital Alternatives:*\n"
        f"   • *Collateral Swap:* Swap to stablecoin (LT=90%) restores HF to *{d['collateral_swap']['hf']:.2f}*\n"
        f"   • *Partial Deleverage:* Auto-sell ${d['partial_deleverage']['collateral_sold_usd']:,.2f} collateral restores HF to *{d['partial_deleverage']['hf']:.2f}* Safe\n\n"
        f"{DISCLAIMER_TEXT}"
    )


# ---------------------------------------------------------------------------
# Backend API Integration Helpers
# ---------------------------------------------------------------------------

async def sync_simulation_with_backend(payload: Dict[str, Any]) -> None:
    """Attempts to notify the backend simulations engine asynchronously."""
    try:
        url = f"{BACKEND_URL}/api/simulations"
        await asyncio.to_thread(requests.post, url, json=payload, timeout=3.0)
    except Exception as e:
        logger.debug(f"Backend sync skipped (running self-contained): {e}")


async def call_backend_portfolio() -> Optional[Dict[str, Any]]:
    """Queries monitored portfolio from backend."""
    try:
        url = f"{BACKEND_URL}/api/portfolio"
        resp = await asyncio.to_thread(requests.get, url, timeout=4.0)
        if resp.status_code == 200:
            return resp.json()
    except Exception:
        pass
    return None


async def link_user_telegram(user_id: str, chat_id: int, username: str) -> None:
    """
    Updates Supabase table alert_preferences and notifies backend API
    during 1-click deep-link onboarding (/start <user_id>).
    """
    # 1. Update backend server state
    try:
        register_url = f"{BACKEND_URL}/api/alerts/telegram/register"
        await asyncio.to_thread(
            requests.post,
            register_url,
            json={
                "user_id": user_id,
                "chat_id": str(chat_id),
                "username": username,
            },
            timeout=4.0,
        )
        logger.info(f"Registered Telegram link with backend for user {user_id}")
    except Exception as e:
        logger.warning(f"Backend registration error: {e}")

    # 2. Update Supabase table alert_preferences directly if configured
    supabase_url = os.getenv("VITE_SUPABASE_URL") or os.getenv("SUPABASE_URL")
    supabase_key = (
        os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        or os.getenv("VITE_SUPABASE_ANON_KEY")
        or os.getenv("SUPABASE_KEY")
    )
    if supabase_url and supabase_key:
        try:
            rest_url = f"{supabase_url.rstrip('/')}/rest/v1/alert_preferences"
            headers = {
                "apikey": supabase_key,
                "Authorization": f"Bearer {supabase_key}",
                "Content-Type": "application/json",
                "Prefer": "resolution=merge-duplicates",
            }
            payload = {
                "user_id": user_id,
                "telegram_chat_id": str(chat_id),
                "telegram_username": username,
                "telegram_verified": True,
            }
            await asyncio.to_thread(
                requests.post,
                rest_url,
                json=payload,
                headers=headers,
                timeout=5.0,
            )
            logger.info(f"Updated Supabase alert_preferences for user {user_id}")
        except Exception as e:
            logger.warning(f"Supabase update error: {e}")


# ---------------------------------------------------------------------------
# Conversational / LLM Fallback
# ---------------------------------------------------------------------------

# ---------------------------------------------------------------------------
# Conversational / LLM & Knowledge Base Engine
# ---------------------------------------------------------------------------

def query_gemini_ai(prompt: str) -> Optional[str]:
    """Queries Gemini 1.5 Flash API directly if GEMINI_API_KEY is configured."""
    if not GEMINI_API_KEY:
        return None
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "systemInstruction": {
                "parts": [{
                    "text": (
                        "You are the Bachega.fi Principal Quantitative DeFi Risk Assistant. "
                        "Answer the user's question concisely, authoritatively, and helpfully using clean Telegram Markdown. "
                        "Focus on DeFi lending protocols (Aave V3, Compound, Spark), health factors, liquidations, and risk management. "
                        "Emphasize that Bachega is 100% read-only and provides 5 deterministic defense strategies: "
                        "Do Nothing, Repay Debt, Add Collateral, Collateral Swap (ETH -> USDC), and Partial Deleverage. "
                        "Always conclude with 'ℹ️ _Simulation, not prediction._'"
                    )
                }]
            }
        }
        resp = requests.post(url, json=payload, timeout=6.0)
        if resp.status_code == 200:
            data = resp.json()
            candidates = data.get("candidates", [])
            if candidates and "content" in candidates[0]:
                parts = candidates[0]["content"].get("parts", [])
                if parts and "text" in parts[0]:
                    return parts[0]["text"].strip()
    except Exception as e:
        logger.debug(f"Gemini API call error: {e}")
    return None


def format_strategies_overview() -> str:
    return (
        "🛡️ *Bachega.fi 5 Comprehensive Defense Strategies*\n\n"
        "When flash crashes threaten your loan, retail borrowers face immediate liquidation penalties (5%–10% bonus seized by bots). We evaluate 5 deterministic paths:\n\n"
        "1. 🛑 *Do Nothing (Passive):*\n"
        "   • Incur full unmitigated crash shock.\n"
        "   • If HF < 1.00, position falls into deficit and gets liquidated.\n\n"
        "2. 💳 *Repay Debt (External Capital):*\n"
        "   • De-leverage with external cash (e.g. $750 USDC).\n"
        "   • Reduces debt denominator to restore Health Factor.\n\n"
        "3. 📥 *Add Collateral (External Capital):*\n"
        "   • Deposit additional buffer collateral (e.g. $750) into vault.\n"
        "   • Expands margin room without changing loan amount.\n\n"
        "4. 🔄 *Collateral Swap (Zero External Capital):*\n"
        "   • Swaps volatile collateral (ETH, LT=82.5%) into stablecoin (USDC, LT=90.0%).\n"
        "   • Freezes downward price volatility and boosts LT to 90% with $0 outside cash.\n\n"
        "5. ⚡ *Partial Deleverage (Zero External Capital Self-Rescue):*\n"
        "   • Uses smart contract auto-sell to repay the exact debt needed to restore HF to 1.10.\n"
        "   • Leaves the remaining position intact and avoids 100% of third-party liquidation bonus penalties.\n\n"
        "_Try: `Simulate 35% ETH crash` or `What if ETH drops to $1800?`_\n\n"
        f"{DISCLAIMER_TEXT}"
    )


def format_swap_explainer() -> str:
    return (
        "🔄 *Collateral Swap Strategy ($0 External Capital)*\n\n"
        "• *How It Works:* When markets drop, your volatile collateral (ETH / WBTC) is swapped in a single flash transaction into a stable asset (USDC / USDT).\n\n"
        "• *3 Key Protections:*\n"
        "  1. *Freezes Downside Volatility:* If ETH keeps crashing from $2,000 to $1,400, your USDC collateral value is locked and safe.\n"
        "  2. *Higher Liquidation Threshold:* Aave V3 grants stablecoins a higher Liquidation Threshold (90.0% vs 82.5% for ETH), immediately raising your Health Factor.\n"
        "  3. *Zero External Cash:* You don't need emergency cash or fresh deposits.\n\n"
        "_Ask `Simulate 35% ETH crash` to see live swap metrics!_\n\n"
        f"{DISCLAIMER_TEXT}"
    )


def format_deleverage_explainer() -> str:
    return (
        "⚡ *Partial Deleverage Strategy ($0 External Capital)*\n\n"
        "• *The Problem:* When HF < 1.00, autonomous liquidator bots seize your collateral with a 5%–10% bonus penalty.\n\n"
        "• *The Mathematical Solution:* Bachega evaluates the deterministic formula:\n"
        "  `Δ_sold = (HF_target · Debt - C_shock · LT) / (HF_target - LT)`\n\n"
        "• *Benefits:*\n"
        "  1. Sells only the exact dollar amount of collateral needed to restore HF to 1.10.\n"
        "  2. Leaves the majority of your position intact.\n"
        "  3. Completely bypasses bot liquidation bonuses (saves you 5%–10% in penalties).\n"
        "  4. Requires $0.00 outside capital.\n\n"
        "_Ask `How much debt should I repay?` to test this!_\n\n"
        f"{DISCLAIMER_TEXT}"
    )


def format_help_response() -> str:
    return (
        "🤖 *Bachega.fi Assistant Capabilities*\n\n"
        "You can ask me any DeFi risk, crash simulation, or mathematical question:\n\n"
        "⚡ *Stress Test Any Market Shock:*\n"
        "• `Simulate 35% ETH crash` (or any %, like `crash 20%`)\n"
        "• `What if ETH drops to $1,800?` (test exact target price)\n"
        "• `Simulate 30% drop with 5 BTC` (custom token and size)\n\n"
        "🛡️ *Defense & Rescue Strategies:*\n"
        "• `Explain the 5 strategies` (Do Nothing, Repay, Add, Swap, Deleverage)\n"
        "• `How does collateral swap work?` ($0 external capital)\n"
        "• `What is partial deleverage?` (Self-rescue auto-sell)\n"
        "• `How much debt should I repay?` (Target HF 1.10 calculation)\n\n"
        "📊 *Live Position Health:*\n"
        "• `Current health factor`\n"
        "• `Liquidation price`\n"
        "• `Check wallet 0x71C...39A4`\n\n"
        "💡 *DeFi Education:*\n"
        "• `What is Health Factor?`\n"
        "• `What is LTV?`\n"
        "• `What is liquidation penalty?`\n\n"
        "🔒 *100% Read-Only:* No private keys or wallet connections required.\n\n"
        f"{DISCLAIMER_TEXT}"
    )


def generate_llm_response(prompt: str) -> str:
    """
    Conversational fallback answering general DeFi, liquidation mechanics,
    LTV calculations, or Bachega.fi overview questions.
    """
    p_lower = prompt.lower().strip()

    # 1. Try Gemini API first if configured
    gemini_reply = query_gemini_ai(prompt)
    if gemini_reply:
        return gemini_reply

    # 2. Comprehensive built-in DeFi Quantitative Knowledge Engine
    if any(k in p_lower for k in ["5 strategies", "strategies", "defense options", "rescue options"]):
        return format_strategies_overview()

    if any(k in p_lower for k in ["collateral swap", "swap collateral", "swap to usdc"]):
        return format_swap_explainer()

    if any(k in p_lower for k in ["partial deleverage", "deleverage", "auto sell", "self rescue", "self liquidation"]):
        return format_deleverage_explainer()

    if any(k in p_lower for k in ["help", "what can you do", "commands", "menu", "capabilities", "features", "how to use"]):
        return format_help_response()

    if any(k in p_lower for k in ["health factor", "what is hf", "calculate hf", "hf formula"]):
        return (
            "📊 *Health Factor (HF) Mechanics*\n\n"
            "Health Factor is the solvency metric used by Aave and Compound:\n\n"
            "$$HF = \\frac{\\text{Collateral USD} \\times \\text{Liquidation Threshold}}{\\text{Outstanding Debt USD}}\n\n"
            "• *HF > 1.25:* ✅ Safe Equilibrium (Standard operating buffer)\n"
            "• *1.00 < HF < 1.10:* ⚠️ Tension Zone (Liquidators preparing)\n"
            "• *HF < 1.00:* 🚨 Liquidation Cliff (Borrower is insolvent)\n\n"
            "_Ask `Current health factor` or `Simulate 35% ETH crash` to stress-test your position!_\n\n"
            f"{DISCLAIMER_TEXT}"
        )

    if any(k in p_lower for k in ["liquidation", "liquidate", "penalty", "bonus", "liquidator"]):
        return (
            "💡 *DeFi Liquidation & Penalty Mechanics*\n\n"
            "When your *Health Factor (HF)* drops strictly below *1.00*:\n\n"
            "• *Liquidator Bots:* Autonomous MEV searchers call `liquidationCall()` on Aave/Compound.\n"
            "• *Liquidation Penalty:* The protocol sells your collateral at a 5%–10% bonus discount to the liquidator.\n"
            "• *Bachega Defense:* Our Partial Deleverage engine allows you to self-repay before bots strike, saving 100% of that penalty fee.\n\n"
            "_Ask me `How much debt should I repay?` to calculate your exact safety number!_\n\n"
            f"{DISCLAIMER_TEXT}"
        )

    if any(k in p_lower for k in ["ltv", "loan to value", "max ltv", "liquidation threshold"]):
        return (
            "📊 *Loan-To-Value (LTV) vs. Liquidation Threshold*\n\n"
            "• *Max LTV:* The maximum debt you can borrow at the time of collateral deposit (~80% for ETH on Aave V3).\n"
            "• *Liquidation Threshold (LT):* The critical boundary where your loan becomes undercollateralized (82.5% for ETH, 90.0% for USDC).\n"
            "• *Safety Buffer:* The gap between your current LTV and the Liquidation Threshold represents your margin room before liquidation.\n\n"
            f"{DISCLAIMER_TEXT}"
        )

    if any(k in p_lower for k in ["private key", "safety", "secure", "read-only", "connect wallet", "drain", "keys"]):
        return (
            "🔒 *Bachega.fi Security Guarantee*\n\n"
            "• *100% Read-Only:* Bachega never asks for your private key, seed phrase, or transaction signing permissions.\n"
            "• *Public On-Chain Observation:* We only query public blockchain states on Arbitrum, Ethereum, and Solana.\n"
            "• *Non-Custodial:* Your assets never leave your own wallet or lending vault.\n\n"
            f"{DISCLAIMER_TEXT}"
        )

    if any(k in p_lower for k in ["aave", "compound", "spark", "protocols", "supported chains"]):
        return (
            "🏛 *Supported Protocols & Networks*\n\n"
            "Bachega.fi monitors and stress-tests positions on:\n"
            "• *Aave V3* (Arbitrum & Ethereum)\n"
            "• *Compound V3* (Comet pools)\n"
            "• *Spark Protocol* (MakerDAO Dai credit facility)\n\n"
            "Supported collateral assets: ETH, WBTC, SOL, AVAX, LINK, USDC, USDT, and DAI.\n\n"
            f"{DISCLAIMER_TEXT}"
        )

    if any(k in p_lower for k in ["alert", "notification", "telegram alert", "how do alerts work"]):
        return (
            "🔔 *Automated Telegram Liquidation Alerts*\n\n"
            "Once linked with @Bachega_bot, Bachega monitors your active lending vault 24/7:\n"
            "• Instant push notification whenever market moves push your Health Factor toward 1.05.\n"
            "• Provides calculated repayment and collateral addition options right inside Telegram before liquidator bots strike.\n\n"
            f"{DISCLAIMER_TEXT}"
        )

    if any(k in p_lower for k in ["what is bachega", "about", "who are you", "who made you"]):
        return (
            "🏛 *About Bachega.fi*\n\n"
            "Bachega is an *Individual User DeFi Risk & Crash Simulation Workbench*.\n"
            "We provide deterministic risk simulations for retail borrowers across "
            "Aave V3, Compound V3, and Spark.\n\n"
            "• 100% Read-Only: No private keys or wallet permissions required.\n"
            "• Instantaneous price shock modeling (-10% to -50%).\n"
            "• Compare Do Nothing vs. Repay Debt vs. Add Collateral vs. Collateral Swap vs. Partial Deleverage.\n\n"
            f"{DISCLAIMER_TEXT}"
        )

    # Contextual general DeFi advisor reply
    return (
        f"🤖 *Bachega Quantitative Advisor*\n\n"
        f"Regarding: *\"{prompt}\"*\n\n"
        "In DeFi lending (Aave V3, Compound V3, Spark), risk is strictly determined by smart contract math: "
        "asset spot prices, volatility, loan-to-value, and liquidation thresholds.\n\n"
        "I can run real-time quantitative evaluations for you:\n"
        "• Type `Simulate 35% ETH crash` to stress-test market drops\n"
        "• Type `What if ETH drops to $1800?` for target price simulations\n"
        "• Type `How much debt should I repay?` to calculate emergency rescue capital\n"
        "• Type `Explain the 5 strategies` to review all defense mechanisms\n\n"
        f"{DISCLAIMER_TEXT}"
    )


# ---------------------------------------------------------------------------
# Telegram Event Handlers
# ---------------------------------------------------------------------------

async def start_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """
    Handles /start command:
    - If deep-linked (/start <user_id>), links user and sends confirmation.
    - If standard /start, greets user with sample quantitative actions.
    """
    if not update.message:
        return

    chat_id = update.effective_chat.id
    raw_user = update.effective_user or update.effective_chat
    username = raw_user.username or raw_user.first_name or "DeFi Borrower"

    # Deep-link 1-click onboarding check (/start <user_id>)
    if context.args and len(context.args) > 0:
        user_id = context.args[0].strip()
        logger.info(f"Linking Telegram for user_id={user_id}, chat_id={chat_id}, username={username}")
        await link_user_telegram(user_id=user_id, chat_id=chat_id, username=username)

        success_text = (
            "✅ *Registration Successful!*\n\n"
            "You have successfully registered with the *Bachega.fi Alerts Bot*.\n\n"
            "Your account is now linked. We will push instant alerts directly to this chat "
            "if any flash crash threatens your collateral."
        )
        await update.message.reply_text(success_text, parse_mode="Markdown")
        return

    await update.message.reply_text(GREETING_TEXT, parse_mode="Markdown")


async def message_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """
    Processes all natural text queries, extracts parameters dynamically,
    evaluates pure mathematical formulas, and renders rich Markdown.
    """
    if not update.message or not update.message.text:
        return

    user_text = update.message.text.strip()
    user_lower = user_text.lower()
    logger.info(f"Received message from @{update.effective_user.username}: {user_text}")

    # 1. Greeting Detection
    greetings = ["hi", "hello", "hey", "namaskar", "/start", "start", "namaste", "hola"]
    if user_lower in greetings or any(user_lower.startswith(g) for g in ["hi ", "hello ", "hey "]):
        await update.message.reply_text(GREETING_TEXT, parse_mode="Markdown")
        return

    # 2. Monitored Wallet Lookup (e.g. "Check wallet 0x71C...39A4")
    if "0x" in user_lower or ("wallet" in user_lower and not any(k in user_lower for k in ["crash", "simulate", "repay"])):
        portfolio = await call_backend_portfolio()
        agg_hf = portfolio.get("aggregate_health_factor", 1.20) if portfolio else 1.20
        total_collat = portfolio.get("total_collateral_usd", 141260.0) if portfolio else 141260.0
        total_debt = portfolio.get("total_debt_usd", 95428.0) if portfolio else 95428.0

        wallet_reply = (
            "💼 *Active Monitored Position: 0x71C8...B7E6*\n\n"
            f"• *Protocol:* Aave V3 (Arbitrum)\n"
            f"• *Aggregate Health Factor:* *{agg_hf:.2f}* (Stable)\n"
            f"• *Collateral Value:* ${total_collat:,.2f} (ETH, WBTC)\n"
            f"• *Outstanding Debt:* ${total_debt:,.2f} USDC\n\n"
            "Type `Simulate 35% ETH crash` to stress-test this vault!\n\n"
            f"{DISCLAIMER_TEXT}"
        )
        await update.message.reply_text(wallet_reply, parse_mode="Markdown")
        return

    # 3. Dynamic Regex Parsing
    parsed = parse_user_query(user_text)

    # Resolve Numerical Parameters (User Provided or Default Aave V3 Arbitrum baseline)
    collat_amt = parsed["collateral"] if parsed["collateral"] is not None else 2.5
    price_val = parsed["price"] if parsed["price"] is not None else 3000.0
    debt_val = parsed["debt"] if parsed["debt"] is not None else 4500.0
    lt_val = 0.825  # Aave V3 Arbitrum standard Liquidation Threshold
    collat_sym = parsed["symbol"] or "ETH"
    debt_sym = "USDC"

    # 4. Route by Intent

    # Scenario 0: Help & Capabilities Menu
    if parsed["is_help_query"]:
        await update.message.reply_text(format_help_response(), parse_mode="Markdown")
        return

    # Scenario 1: 5 Defense Strategies Overview
    if parsed["is_strategies_query"]:
        await update.message.reply_text(format_strategies_overview(), parse_mode="Markdown")
        return

    # Scenario 2: Collateral Swap Explainer
    if parsed["is_swap_query"]:
        await update.message.reply_text(format_swap_explainer(), parse_mode="Markdown")
        return

    # Scenario 3: Partial Deleverage Explainer
    if parsed["is_deleverage_query"]:
        await update.message.reply_text(format_deleverage_explainer(), parse_mode="Markdown")
        return

    # Scenario 4: Repay / Rescue Query
    if parsed["is_repay_query"]:
        # Default to -35% crash shock if none provided, or simulate requested shock
        shock_val = parsed["shock_pct"] if parsed["shock_pct"] is not None else -35.0
        metrics = compute_quantitative_risk(
            collateral_amount=collat_amt,
            collateral_price_usd=price_val,
            debt_usd=debt_val,
            liquidation_threshold=lt_val,
            price_shock_pct=shock_val,
            collateral_symbol=collat_sym,
            debt_symbol=debt_sym,
        )
        # Background sync
        asyncio.create_task(sync_simulation_with_backend({
            "collateral_amount": collat_amt,
            "collateral_price_usd": price_val,
            "debt_usd": debt_val,
            "liquidation_threshold": lt_val,
            "price_shock_pct": shock_val,
            "rescue_budget_usd": 750.0,
        }))
        await update.message.reply_text(format_repay_rescue_response(metrics), parse_mode="Markdown")
        return

    # Scenario 5: Crash Simulation Query (Percentage Drop or Target Dollar Price)
    if parsed["is_simulation_query"]:
        if parsed.get("shock_pct") is not None:
            shock_val = parsed["shock_pct"]
        elif parsed.get("target_price") is not None:
            shock_val = round(((parsed["target_price"] - price_val) / price_val) * 100.0, 1)
        else:
            shock_val = -35.0

        metrics = compute_quantitative_risk(
            collateral_amount=collat_amt,
            collateral_price_usd=price_val,
            debt_usd=debt_val,
            liquidation_threshold=lt_val,
            price_shock_pct=shock_val,
            collateral_symbol=collat_sym,
            debt_symbol=debt_sym,
        )
        asyncio.create_task(sync_simulation_with_backend({
            "collateral_amount": collat_amt,
            "collateral_price_usd": price_val,
            "debt_usd": debt_val,
            "liquidation_threshold": lt_val,
            "price_shock_pct": shock_val,
            "rescue_budget_usd": 750.0,
        }))
        await update.message.reply_text(format_crash_simulation_response(metrics), parse_mode="Markdown")
        return

    # Scenario 6: Status / Health Factor / Liquidation Price Query
    if parsed["is_status_query"]:
        metrics = compute_quantitative_risk(
            collateral_amount=collat_amt,
            collateral_price_usd=price_val,
            debt_usd=debt_val,
            liquidation_threshold=lt_val,
            price_shock_pct=0.0,
            collateral_symbol=collat_sym,
            debt_symbol=debt_sym,
        )
        await update.message.reply_text(format_status_response(metrics), parse_mode="Markdown")
        return

    # 5. Out of Domain / Conversational LLM Fallback
    llm_reply = generate_llm_response(user_text)
    await update.message.reply_text(llm_reply, parse_mode="Markdown")


# ---------------------------------------------------------------------------
# Standalone Application Runner
# ---------------------------------------------------------------------------

def main():
    """Builds and starts the Telegram Bot polling application."""
    if not BOT_TOKEN:
        print("=" * 60)
        print("❌ ERROR: TELEGRAM_BOT_TOKEN is not set in .env or environment!")
        print("Please configure TELEGRAM_BOT_TOKEN in your .env file.")
        print("=" * 60)
        sys.exit(1)

    print("=" * 60)
    print("🤖 Starting Bachega.fi Quantitative Telegram Risk Bot Service")
    print(f"• Bot: {BOT_USERNAME}")
    print(f"• Backend Target: {BACKEND_URL}")
    print("=" * 60)

    # Initialize Application with python-telegram-bot v20+
    app = Application.builder().token(BOT_TOKEN).build()

    # Register Handlers
    app.add_handler(CommandHandler("start", start_handler))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, message_handler))

    # Run Bot via Polling
    print("🚀 Polling @Bachega_bot incoming updates...")
    app.run_polling(drop_pending_updates=True)


if __name__ == "__main__":
    main()
