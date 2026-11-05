"""
Telegram Bot Integration Service for Bachega.fi
Bot Username: Configured via TELEGRAM_BOT_USERNAME environment variable
Token: Configured via TELEGRAM_BOT_TOKEN environment variable (strictly read-only from .env)
"""

import logging
import httpx
from typing import Dict, Any, Optional
from config import settings

logger = logging.getLogger("telegram_service")


def get_bot_token() -> str:
    """Retrieves the Telegram bot token securely from environment configuration."""
    return settings.TELEGRAM_BOT_TOKEN.strip()


def get_base_url() -> str:
    """Builds the Telegram API base URL using the configured environment token."""
    token = get_bot_token()
    return f"https://api.telegram.org/bot{token}"


def _get_client() -> httpx.AsyncClient:
    """Returns an httpx client forced to IPv4 (0.0.0.0) for connection reliability."""
    try:
        transport = httpx.AsyncHTTPTransport(local_address="0.0.0.0")
        return httpx.AsyncClient(transport=transport, timeout=12.0)
    except Exception:
        return httpx.AsyncClient(timeout=12.0)


async def verify_latest_update() -> Dict[str, Any]:
    """
    Queries /getUpdates to find the latest incoming message from a user.
    If no messages found, returns instructions to open @Bachega_bot and send /start.
    If found, sends immediate confirmation and returns chat_id and username.
    """
    token = get_bot_token()
    if not token:
        return {
            "success": False,
            "message": "TELEGRAM_BOT_TOKEN is not configured in .env. Please configure your bot token.",
        }

    base_url = get_base_url()

    async with _get_client() as client:
        try:
            resp = await client.get(f"{base_url}/getUpdates")
            data = resp.json()
        except Exception as e:
            return {
                "success": False,
                "message": f"Could not reach Telegram API: {str(e)}",
            }

    if not data.get("ok"):
        return {
            "success": False,
            "message": data.get("description", "Failed to retrieve Telegram updates."),
        }

    results = data.get("result", [])
    if not results:
        return {
            "success": False,
            "message": "No chat found. Please open @Bachega_bot and send /start first.",
        }

    # Search backwards for the latest message or channel/group post containing chat info
    chat_id = None
    username = None

    for update in reversed(results):
        msg = update.get("message") or update.get("my_chat_member") or update.get("channel_post")
        if msg and "chat" in msg:
            chat_obj = msg["chat"]
            chat_id = chat_obj.get("id")
            from_obj = msg.get("from") or {}
            username = from_obj.get("username") or chat_obj.get("username") or from_obj.get("first_name") or "DeFi Borrower"
            break

    if not chat_id:
        return {
            "success": False,
            "message": "No chat found. Please open @Bachega_bot and send /start first.",
        }

    # Send immediate confirmation message
    confirmation_text = (
        "✅ *Bachega.fi Alerts Connected!*\n"
        "Your account is now linked. You will receive instant notifications "
        "whenever your collateral health factor approaches liquidation."
    )

    async with _get_client() as client:
        try:
            await client.post(
                f"{base_url}/sendMessage",
                json={
                    "chat_id": chat_id,
                    "text": confirmation_text,
                    "parse_mode": "Markdown",
                },
            )
        except Exception as err:
            logger.warning(f"Telegram confirmation message send error: {err}")

    return {
        "success": True,
        "chat_id": str(chat_id),
        "username": username,
    }


async def send_liquidation_alert(
    chat_id: str,
    health_factor: float,
    shock_pct: float,
) -> Dict[str, Any]:
    """
    Sends formatted Markdown liquidation risk warning to the linked Telegram chat.
    """
    token = get_bot_token()
    if not token:
        return {
            "success": False,
            "message": "TELEGRAM_BOT_TOKEN is not configured in .env.",
            "chat_id": chat_id,
        }

    base_url = get_base_url()
    shock_display = abs(shock_pct)
    warning_text = (
        "🚨 *LIQUIDATION RISK WARNING*\n\n"
        "• Protocol: Aave V3 (Arbitrum)\n"
        f"• Market Drop: -{shock_display:.0f}%\n"
        f"• Projected Health Factor: *{health_factor:.3f}* ⚠️\n\n"
        "*Action Required:* Repay debt or deposit collateral on Bachega.fi to maintain HF > 1.05."
    )

    async with _get_client() as client:
        try:
            resp = await client.post(
                f"{base_url}/sendMessage",
                json={
                    "chat_id": chat_id,
                    "text": warning_text,
                    "parse_mode": "Markdown",
                },
            )
            data = resp.json()
            if data.get("ok"):
                return {"success": True, "chat_id": chat_id}
            else:
                return {
                    "success": False,
                    "message": data.get("description", "Telegram API rejected alert message."),
                    "chat_id": chat_id,
                }
        except Exception as e:
            return {
                "success": False,
                "message": f"Network error sending Telegram alert: {str(e)}",
                "chat_id": chat_id,
            }
