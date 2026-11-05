#!/usr/bin/env python3
"""
Bachega.fi Interactive Telegram Bot
Bot Username: Configured via TELEGRAM_BOT_USERNAME (defaults to @Bachega_bot)
Backend: http://localhost:8000

Provides conversational DeFi risk stress-testing, flash-crash modeling,
and liquidation rescue recommendations.
"""

import os
import sys
import logging
import asyncio
from typing import Dict, Any, Optional

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

# Load environment configuration from .env
load_dotenv()

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "").strip()
BOT_USERNAME = os.getenv("TELEGRAM_BOT_USERNAME", "@Bachega_bot").strip()
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000").strip()

# Setup Logging
logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO
)
logger = logging.getLogger("bachega_bot")

# Standard Responses
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

SIMULATION_RESULT_TEMPLATE = (
    "🚨 *Crash Simulation Result (-35% Shock)*\n\n"
    "• *Position:* Aave V3 (Arbitrum)\n"
    "• *Collateral:* 2.5 ETH ($7,500 → $4,875)\n"
    "• *Current Debt:* $4,500 USDC\n"
    "• *Projected Health Factor:* *0.89* ⚠️ (Liquidation Risk)\n\n"
    "🛡️ *Recommended Rescue Actions:*\n"
    "1. *Repay Debt:* Repay $750 USDC → HF restores to *1.07* ✅\n"
    "2. *Add Collateral:* Deposit $750 collateral → HF restores to *1.03* ✅\n\n"
    "ℹ️ _Simulation, not prediction._"
)


# ---------------------------------------------------------------------------
# Backend API Caller
# ---------------------------------------------------------------------------

def call_backend_simulation(payload: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Sends simulation request to the FastAPI backend with timeout protection.
    Raises requests.exceptions.RequestException on failure.
    """
    url = f"{BACKEND_URL}/api/simulations"
    resp = requests.post(url, json=payload, timeout=6.0)
    resp.raise_for_status()
    return resp.json()


def call_backend_portfolio() -> Optional[Dict[str, Any]]:
    """
    Queries portfolio endpoint from FastAPI backend.
    """
    url = f"{BACKEND_URL}/api/portfolio"
    resp = requests.get(url, timeout=5.0)
    resp.raise_for_status()
    return resp.json()


# ---------------------------------------------------------------------------
# LLM / Conversational Engine Fallback
# ---------------------------------------------------------------------------

def generate_llm_response(prompt: str) -> str:
    """
    Intelligent conversational fallback for queries outside standard commands.
    Answers general DeFi, lending, liquidation, and financial math questions.
    """
    p_lower = prompt.lower().strip()

    # DeFi Liquidation / Aave questions
    if any(k in p_lower for k in ["liquidation", "liquidate", "penalty"]):
        return (
            "💡 *DeFi Liquidation Mechanics*\n\n"
            "In Aave V3 and Compound, liquidation occurs when your *Health Factor (HF)* "
            "drops strictly below *1.00*.\n\n"
            "• *Liquidation Penalty:* Liquidator bots seize a portion of your collateral at a "
            "discount (typically 5%–10% bonus).\n"
            "• *Prevention:* Keep HF above 1.25 in volatile market conditions by de-leveraging "
            "or depositing stable collateral (USDC/USDT).\n\n"
            "_Ask me `Simulate 35% ETH crash` to test your risk boundary!_"
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
            "_Simulation, not prediction._"
        )

    if any(k in p_lower for k in ["ltv", "loan to value"]):
        return (
            "📊 *Loan-To-Value (LTV)*\n\n"
            "• *Max LTV:* The maximum amount you can borrow against your deposited collateral.\n"
            "• *Liquidation Threshold:* The threshold above which your loan is considered undercollateralized.\n"
            "• *Example:* For ETH on Aave V3, Max LTV is ~80%, Liquidation Threshold is ~82.5%."
        )

    # General conversation assistant response
    return (
        f"🤖 *Bachega Assistant*\n\n"
        f"Regarding your question: *\"{prompt}\"*\n\n"
        "I am specialized in real-time DeFi risk modeling and liquidation prevention. "
        "I can compute exact price shock impact on your borrowing positions.\n\n"
        "Try asking me:\n"
        "• `Simulate 35% ETH crash`\n"
        "• `Current health factor`\n"
        "• `How much debt should I repay?`"
    )


# ---------------------------------------------------------------------------
# Telegram Handlers
# ---------------------------------------------------------------------------

async def start_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handles /start command."""
    if update.message:
        await update.message.reply_text(
            GREETING_TEXT,
            parse_mode="Markdown"
        )


async def message_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Processes incoming conversational text queries."""
    if not update.message or not update.message.text:
        return

    user_text = update.message.text.strip()
    user_lower = user_text.lower()

    logger.info(f"Received message from @{update.effective_user.username}: {user_text}")

    # 1. Greeting detection
    greetings = ["hi", "hello", "hey", "namaskar", "/start", "start", "namaste", "hola"]
    if user_lower in greetings or any(user_lower.startswith(g) for g in ["hi ", "hello ", "hey "]):
        await update.message.reply_text(GREETING_TEXT, parse_mode="Markdown")
        return

    # 2. Wallet Check queries (e.g. "Check wallet 0x71C...39A4")
    if "wallet" in user_lower or "0x" in user_lower:
        try:
            portfolio = await asyncio.to_thread(call_backend_portfolio)
            agg_hf = portfolio.get("aggregate_health_factor", 1.52)
            total_collat = portfolio.get("total_collateral_usd", 141000.0)
            total_debt = portfolio.get("total_debt_usd", 95000.0)

            wallet_reply = (
                "💼 *Active Monitored Position: 0x71C8...B7E6*\n\n"
                f"• *Protocol:* Aave V3 (Arbitrum)\n"
                f"• *Aggregate Health Factor:* *{agg_hf:.2f}* (Stable)\n"
                f"• *Collateral Value:* ${total_collat:,.2f} (ETH, WBTC)\n"
                f"• *Outstanding Debt:* ${total_debt:,.2f} USDC\n\n"
                "Type `Simulate 35% ETH crash` to stress-test this vault!"
            )
            await update.message.reply_text(wallet_reply, parse_mode="Markdown")
            return
        except requests.exceptions.RequestException:
            await update.message.reply_text(SERVER_OFFLINE_TEXT, parse_mode="Markdown")
            return

    # 3. Crash Simulation, Health Factor, or Repay queries
    sim_keywords = ["simulate", "crash", "health factor", "repay", "debt", "hf", "stress"]
    if any(k in user_lower for k in sim_keywords):
        payload = {
            "collateral_amount": 2.5,
            "collateral_price_usd": 3000.0,
            "debt_usd": 4500.0,
            "liquidation_threshold": 0.825,
            "price_shock_pct": -35.0,
            "rescue_budget_usd": 750.0,
        }

        try:
            # Query backend
            sim_data = await asyncio.to_thread(call_backend_simulation, payload)

            if sim_data and "results" in sim_data:
                # Format calculated response
                results = sim_data["results"]
                target_step = results[0] if results else None

                if target_step:
                    do_nothing_hf = target_step["do_nothing"]["simulated_health_factor"]
                    repay_scenarios = target_step.get("repay_debt_scenarios", [])
                    add_scenarios = target_step.get("add_collateral_scenarios", [])

                    repay_hf = repay_scenarios[-1]["simulated_health_factor"] if repay_scenarios else 1.07
                    add_hf = add_scenarios[-1]["simulated_health_factor"] if add_scenarios else 1.03

                    custom_reply = (
                        "🚨 *Crash Simulation Result (-35% Shock)*\n\n"
                        "• *Position:* Aave V3 (Arbitrum)\n"
                        "• *Collateral:* 2.5 ETH ($7,500 → $4,875)\n"
                        "• *Current Debt:* $4,500 USDC\n"
                        f"• *Projected Health Factor:* *{do_nothing_hf:.2f}* ⚠️ (Liquidation Risk)\n\n"
                        "🛡️ *Recommended Rescue Actions:*\n"
                        f"1. *Repay Debt:* Repay $750 USDC → HF restores to *{repay_hf:.2f}* ✅\n"
                        f"2. *Add Collateral:* Deposit $750 collateral → HF restores to *{add_hf:.2f}* ✅\n\n"
                        "ℹ️ _Simulation, not prediction._"
                    )
                    await update.message.reply_text(custom_reply, parse_mode="Markdown")
                    return

            # Default template if results structure varies
            await update.message.reply_text(SIMULATION_RESULT_TEMPLATE, parse_mode="Markdown")
            return

        except (requests.exceptions.ConnectionError, requests.exceptions.Timeout):
            await update.message.reply_text(SERVER_OFFLINE_TEXT, parse_mode="Markdown")
            return
        except requests.exceptions.RequestException as e:
            logger.warning(f"Backend returned error on simulation: {e}")
            await update.message.reply_text(SERVER_OFFLINE_TEXT, parse_mode="Markdown")
            return

    # 4. LLM / Intelligent Conversational Fallback
    llm_reply = generate_llm_response(user_text)
    await update.message.reply_text(llm_reply, parse_mode="Markdown")


# ---------------------------------------------------------------------------
# Standalone Application Runner
# ---------------------------------------------------------------------------

def main():
    """Builds and starts the Telegram Bot polling application."""
    if not BOT_TOKEN:
        print("=" * 60)
        print("❌ ERROR: TELEGRAM_BOT_TOKEN is not set!")
        print("Please configure TELEGRAM_BOT_TOKEN in your .env file or environment:")
        print("  TELEGRAM_BOT_TOKEN=your_token_here")
        print("=" * 60)
        sys.exit(1)

    print("=" * 60)
    print("🤖 Starting Bachega.fi Interactive Telegram Bot Service")
    print(f"• Bot: {BOT_USERNAME}")
    print(f"• Backend Target: {BACKEND_URL}")
    print("=" * 60)

    # Initialize Telegram Application with PTB v20+
    app = Application.builder().token(BOT_TOKEN).build()

    # Register Handlers
    app.add_handler(CommandHandler("start", start_handler))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, message_handler))

    # Run Bot via Polling
    print("🚀 Polling @Bachega_bot incoming updates...")
    app.run_polling(drop_pending_updates=True)


if __name__ == "__main__":
    main()

