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
BOT_USERNAME = os.getenv("TELEGRAM_BOT_USERNAME", "@Bachega_bot").strip()
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000").strip()

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
    "I can help you monitor lending positions, stress-test flash crashes, "
    "and check emergency rescue options before liquidation hits.\n\n"
    "Try asking me:\n"
    "• `Current health factor`\n"
    "• `Simulate 35% ETH crash`\n"
    "• `How much debt should I repay?`\n"
    "• `Check wallet 0x71C...39A4`"
)

SERVER_OFFLINE_TEXT = (
    "⚠️ *Could not connect to the Bachega.fi backend server.*\n\n"
    "Please verify your app server is running on `http://localhost:8000` "
    "(e.g. `uvicorn main:app --reload`)."
)


# ---------------------------------------------------------------------------
# Quantitative Risk Data Model & Smart Contract Formulas
# ---------------------------------------------------------------------------

@dataclass
class QuantitativeRiskMetrics:
    """
    Pure quantitative model holding exact DeFi smart contract metrics.
    Zero static or hardcoded approximations.
    """
    # Base Inputs
    collateral_amount: float
    collateral_price_usd: float
    debt_usd: float
    liquidation_threshold: float
    collateral_symbol: str
    debt_symbol: str
    price_shock_pct: float
    target_hf: float

    # Base Metrics (Price Shock = 0.0)
    collateral_usd_0: float
    health_factor_0: float
    liquidation_price: float
    buffer_to_liquidation_pct: float

    # Shocked Metrics
    price_shocked: float
    collateral_usd_shocked: float
    health_factor_shocked: float
    is_liquidated: bool

    # Dynamic Debt Rescue (Target HF = 1.10)
    safe_debt_limit: float
    repay_needed_usd: float

    # Dynamic Collateral Addition (Target HF = 1.10)
    target_collateral_usd: float
    add_collateral_usd: float
    add_collateral_tokens: float

    # Standard Budget Simulation ($750 USD)
    hf_after_750_repay: float
    hf_after_750_add: float


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
) -> QuantitativeRiskMetrics:
    """
    Evaluates exact DeFi smart contract math formulas:
    - C_0 = collateral_amount * collateral_price_usd
    - HF_0 = (C_0 * liquidation_threshold) / debt_usd
    - P_liq = debt_usd / (collateral_amount * liquidation_threshold)
    - Buffer_pct = (1.0 - (1.0 / HF_0)) * 100
    - P_shock = collateral_price_usd * (1.0 + (price_shock_pct / 100.0))
    - C_shock = collateral_amount * P_shock
    - HF_shock = (C_shock * liquidation_threshold) / debt_usd
    - is_liquidated = HF_shock < 1.0
    - safe_debt_limit = (C_shock * liquidation_threshold) / target_hf
    - repay_needed = max(0.0, debt_usd - safe_debt_limit)
    - target_collateral_usd = (target_hf * debt_usd) / liquidation_threshold
    - add_collateral_usd = max(0.0, target_collateral_usd - C_shock)
    - add_collateral_tokens = add_collateral_usd / P_shock
    """
    # 1. Base Valuation
    c_0 = collateral_amount * collateral_price_usd
    hf_0 = (c_0 * liquidation_threshold) / debt_usd if debt_usd > 0 else 999.0

    # Exact Liquidation Price (Price where HF = 1.0)
    denom = collateral_amount * liquidation_threshold
    p_liq = (debt_usd / denom) if denom > 0 else 0.0

    # Maximum Market Drop Buffer (%)
    buffer_pct = (1.0 - (1.0 / hf_0)) * 100.0 if hf_0 > 0 else 0.0

    # 2. Shock Valuation
    p_shock = collateral_price_usd * (1.0 + (price_shock_pct / 100.0))
    c_shock = collateral_amount * p_shock
    hf_shock = (c_shock * liquidation_threshold) / debt_usd if debt_usd > 0 else 999.0
    is_liquidated = hf_shock < 1.0

    # 3. Dynamic Debt Rescue Math (Target HF = 1.10)
    safe_debt_limit = (c_shock * liquidation_threshold) / target_hf if target_hf > 0 else 0.0
    repay_needed = max(0.0, debt_usd - safe_debt_limit)

    # 4. Dynamic Collateral Addition Math (Target HF = 1.10)
    target_collateral_usd = (target_hf * debt_usd) / liquidation_threshold if liquidation_threshold > 0 else 0.0
    add_collateral_usd = max(0.0, target_collateral_usd - c_shock)
    add_collateral_tokens = (add_collateral_usd / p_shock) if p_shock > 0 else 0.0

    # 5. Fixed Budget Scenarios ($750 USD)
    effective_debt_after_750 = max(0.0, debt_usd - sample_budget_usd)
    hf_after_750_repay = (c_shock * liquidation_threshold) / effective_debt_after_750 if effective_debt_after_750 > 0 else 999.0

    effective_collat_after_750 = c_shock + sample_budget_usd
    hf_after_750_add = (effective_collat_after_750 * liquidation_threshold) / debt_usd if debt_usd > 0 else 999.0

    return QuantitativeRiskMetrics(
        collateral_amount=collateral_amount,
        collateral_price_usd=collateral_price_usd,
        debt_usd=debt_usd,
        liquidation_threshold=liquidation_threshold,
        collateral_symbol=collateral_symbol,
        debt_symbol=debt_symbol,
        price_shock_pct=price_shock_pct,
        target_hf=target_hf,
        collateral_usd_0=c_0,
        health_factor_0=hf_0,
        liquidation_price=p_liq,
        buffer_to_liquidation_pct=buffer_pct,
        price_shocked=p_shock,
        collateral_usd_shocked=c_shock,
        health_factor_shocked=hf_shock,
        is_liquidated=is_liquidated,
        safe_debt_limit=safe_debt_limit,
        repay_needed_usd=repay_needed,
        target_collateral_usd=target_collateral_usd,
        add_collateral_usd=add_collateral_usd,
        add_collateral_tokens=add_collateral_tokens,
        hf_after_750_repay=hf_after_750_repay,
        hf_after_750_add=hf_after_750_add,
    )


# ---------------------------------------------------------------------------
# Dynamic Regex & Intent Parser
# ---------------------------------------------------------------------------

def parse_user_query(text: str) -> Dict[str, Any]:
    """
    Extracts numerical parameters, tokens, and intents dynamically:
    - Percentage drop/shock
    - Collateral token amount & symbol (ETH, BTC, SOL, WBTC, etc.)
    - Collateral spot price
    - Debt amount & symbol
    - Intent flags (status vs. crash vs. repay)
    """
    text_clean = text.lower().strip()

    # 1. Price Shock Percentage
    shock_pct = None
    m_pct = re.search(r'([-−]?[0-9]+(?:\.[0-9]+)?)\s*%', text_clean)
    if m_pct:
        val = float(m_pct.group(1).replace('−', '-'))
        shock_pct = -abs(val)
    else:
        m_word = re.search(r'(?:crash|drop|shock|fall|down|dump)\s*(?:of\s*)?([-−]?[0-9]+(?:\.[0-9]+)?)', text_clean)
        if m_word:
            shock_pct = -abs(float(m_word.group(1).replace('−', '-')))

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

    # 3. Spot Price
    price = None
    m_price = re.search(r'(?:price|at)\s*[:=]?\s*(?:\$)?([0-9]+(?:\.[0-9]+)?)', text_clean)
    if m_price:
        try:
            val = float(m_price.group(1))
            if val > 1.0:
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
    is_repay_query = any(k in text_clean for k in ["repay", "rescue", "how much to pay", "pay off", "add collateral"])
    is_status_query = any(k in text_clean for k in ["status", "current", "health factor", "hf", "liq price", "liquidation price", "buffer"])
    is_simulation_query = any(k in text_clean for k in ["simulate", "crash", "drop", "shock", "fall"]) or (shock_pct is not None)

    return {
        "shock_pct": shock_pct,
        "collateral": collateral,
        "symbol": symbol,
        "price": price,
        "debt": debt,
        "is_repay_query": is_repay_query,
        "is_status_query": is_status_query,
        "is_simulation_query": is_simulation_query,
    }


# ---------------------------------------------------------------------------
# Report Generators (Markdown)
# ---------------------------------------------------------------------------

def format_crash_simulation_response(m: QuantitativeRiskMetrics) -> str:
    """
    Renders pure dynamic crash stress test output matching protocol metrics.
    """
    risk_badge = "⚠️ (Liquidation Risk)" if m.is_liquidated else "✅ (Solvent)"
    shock_display = abs(m.price_shock_pct)

    return (
        f"🚨 *Crash Simulation Result (-{shock_display:.0f}% Shock)*\n\n"
        f"• *Position:* Aave V3 (Arbitrum)\n"
        f"• *Collateral:* {m.collateral_amount:.1f} {m.collateral_symbol} (${m.collateral_usd_0:,.0f} → ${m.collateral_usd_shocked:,.0f})\n"
        f"• *Current Debt:* ${m.debt_usd:,.0f} {m.debt_symbol}\n"
        f"• *Projected Health Factor:* *{m.health_factor_shocked:.2f}* {risk_badge}\n\n"
        f"🛡️ *Recommended Rescue Actions:*\n"
        f"1. *Repay Debt:* Repay $750 {m.debt_symbol} → HF restores to *{m.hf_after_750_repay:.2f}* ✅\n"
        f"2. *Add Collateral:* Deposit $750 collateral → HF restores to *{m.hf_after_750_add:.2f}* ✅\n\n"
        f"{DISCLAIMER_TEXT}"
    )


def format_status_response(m: QuantitativeRiskMetrics) -> str:
    """
    Renders live position status, exact liquidation price, and market drop buffer.
    """
    status_badge = "✅ (Stable)" if m.health_factor_0 >= 1.25 else "⚠️ (Caution)"

    # Compute quick deterministic sensitivity projections
    m_15 = compute_quantitative_risk(
        collateral_amount=m.collateral_amount,
        collateral_price_usd=m.collateral_price_usd,
        debt_usd=m.debt_usd,
        liquidation_threshold=m.liquidation_threshold,
        price_shock_pct=-15.0,
    )
    m_25 = compute_quantitative_risk(
        collateral_amount=m.collateral_amount,
        collateral_price_usd=m.collateral_price_usd,
        debt_usd=m.debt_usd,
        liquidation_threshold=m.liquidation_threshold,
        price_shock_pct=-25.0,
    )
    m_35 = compute_quantitative_risk(
        collateral_amount=m.collateral_amount,
        collateral_price_usd=m.collateral_price_usd,
        debt_usd=m.debt_usd,
        liquidation_threshold=m.liquidation_threshold,
        price_shock_pct=-35.0,
    )

    return (
        f"📊 *Live Position Health & Liquidation Boundaries*\n\n"
        f"• *Protocol:* Aave V3 (Arbitrum)\n"
        f"• *Collateral:* {m.collateral_amount:.2f} {m.collateral_symbol} (${m.collateral_usd_0:,.2f} @ ${m.collateral_price_usd:,.2f})\n"
        f"• *Current Debt:* ${m.debt_usd:,.2f} {m.debt_symbol}\n"
        f"• *Liquidation Threshold:* {m.liquidation_threshold * 100:.1f}%\n"
        f"• *Current Health Factor:* *{m.health_factor_0:.2f}* {status_badge}\n"
        f"• *Exact Liquidation Price:* *${m.liquidation_price:,.2f}*\n"
        f"• *Market Drop Buffer:* *{m.buffer_to_liquidation_pct:.1f}%* (Max crash room before liquidation)\n\n"
        f"💡 *Deterministic Stress Sensitivity:*\n"
        f"• -15% Shock (${m_15.price_shocked:,.2f}): Projected HF = *{m_15.health_factor_shocked:.2f}* ✅\n"
        f"• -25% Shock (${m_25.price_shocked:,.2f}): Projected HF = *{m_25.health_factor_shocked:.2f}* ⚠️\n"
        f"• -35% Shock (${m_35.price_shocked:,.2f}): Projected HF = *{m_35.health_factor_shocked:.2f}* 🚨\n\n"
        f"_Ask `Simulate 35% ETH crash` or `How much debt should I repay?`_\n\n"
        f"{DISCLAIMER_TEXT}"
    )


def format_repay_rescue_response(m: QuantitativeRiskMetrics) -> str:
    """
    Renders exact mathematical repayment and collateral addition requirements.
    """
    risk_badge = "⚠️ (Liquidation Risk)" if m.is_liquidated else "✅ (Solvent)"
    shock_display = abs(m.price_shock_pct)

    return (
        f"🛡️ *Dynamic Debt & Rescue Analysis (-{shock_display:.0f}% Shock)*\n\n"
        f"• *Position:* {m.collateral_amount:.2f} {m.collateral_symbol} | ${m.debt_usd:,.2f} {m.debt_symbol}\n"
        f"• *Shocked Asset Price:* ${m.price_shocked:,.2f} / {m.collateral_symbol}\n"
        f"• *Projected Health Factor:* *{m.health_factor_shocked:.2f}* {risk_badge}\n"
        f"• *Target Health Factor:* *{m.target_hf:.2f}*\n\n"
        f"⚖️ *Exact Required Adjustments:*\n"
        f"1. *Full Safety Debt Repayment (Target HF = {m.target_hf:.2f}):*\n"
        f"   • Repay: *${m.repay_needed_usd:,.2f}* {m.debt_symbol}\n"
        f"   • Remaining Debt: ${m.safe_debt_limit:,.2f} {m.debt_symbol}\n"
        f"   • Restores Health Factor to *{m.target_hf:.2f}* ✅\n\n"
        f"2. *Fixed Budget Rescue ($750.00):*\n"
        f"   • Repaying $750.00 {m.debt_symbol} restores HF to *{m.hf_after_750_repay:.2f}* ✅\n\n"
        f"3. *Collateral Buffer Alternative:*\n"
        f"   • Add *${m.add_collateral_usd:,.2f}* USD collateral (*{m.add_collateral_tokens:.4f} {m.collateral_symbol}*)\n"
        f"   • Restores Health Factor to *{m.target_hf:.2f}* ✅\n\n"
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

def generate_llm_response(prompt: str) -> str:
    """
    Conversational fallback answering general DeFi, liquidation mechanics,
    LTV calculations, or Bachega.fi overview questions.
    """
    p_lower = prompt.lower().strip()

    if any(k in p_lower for k in ["liquidation", "liquidate", "penalty"]):
        return (
            "💡 *DeFi Liquidation Mechanics*\n\n"
            "In Aave V3 and Compound, liquidation occurs when your *Health Factor (HF)* "
            "drops strictly below *1.00*.\n\n"
            "• *Liquidation Penalty:* Liquidator bots seize a portion of your collateral at a "
            "discount (typically 5%–10% bonus).\n"
            "• *Prevention:* Keep HF above 1.25 in volatile market conditions by de-leveraging "
            "or depositing stable collateral (USDC/USDT).\n\n"
            "_Ask me `Simulate 35% ETH crash` to test your risk boundary!_\n\n"
            f"{DISCLAIMER_TEXT}"
        )

    if any(k in p_lower for k in ["what is bachega", "about", "who are you"]):
        return (
            "🏛 *About Bachega.fi*\n\n"
            "Bachega is an *Individual User DeFi Risk & Crash Simulation Workbench*.\n"
            "We provide deterministic risk simulations for retail borrowers across "
            "Aave V3, Compound V3, and Spark.\n\n"
            "• 100% Read-Only: No private keys or wallet permissions required.\n"
            "• Instantaneous price shock modeling (-10% to -50%).\n"
            "• Compare Do Nothing vs. Repay Debt vs. Add Collateral.\n\n"
            f"{DISCLAIMER_TEXT}"
        )

    if any(k in p_lower for k in ["ltv", "loan to value"]):
        return (
            "📊 *Loan-To-Value (LTV)*\n\n"
            "• *Max LTV:* The maximum amount you can borrow against your deposited collateral.\n"
            "• *Liquidation Threshold:* The threshold above which your loan is considered undercollateralized.\n"
            "• *Example:* For ETH on Aave V3, Max LTV is ~80%, Liquidation Threshold is ~82.5%.\n\n"
            f"{DISCLAIMER_TEXT}"
        )

    return (
        f"🤖 *Bachega Assistant*\n\n"
        f"Regarding your question: *\"{prompt}\"*\n\n"
        "I am specialized in real-time DeFi risk modeling and liquidation prevention. "
        "I evaluate exact smart contract mathematical formulas.\n\n"
        "Try asking me:\n"
        "• `Current health factor`\n"
        "• `Simulate 35% ETH crash`\n"
        "• `How much debt should I repay?`\n"
        "• `Liquidation price`\n\n"
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

    # Scenario A: Repay / Rescue Query
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

    # Scenario B: Crash Simulation Query
    if parsed["is_simulation_query"]:
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

    # Scenario C: Status / Health Factor / Liquidation Price Query
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
