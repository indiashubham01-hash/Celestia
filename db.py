"""
Bachega - In-Memory Mock Database
Stores mock state for retail DeFi borrowers: profiles, monitored wallets,
lending positions across protocols, and alert configurations.
"""

from typing import Dict, List, Optional, Any
from datetime import datetime, timezone, timedelta
import uuid

# In-memory storage structures
USER_STORE: Dict[str, Any] = {
    "user_01": {
        "id": "usr_9981aef1b",
        "email": "investor@bachega.app",
        "handle": "defi_individual_01",
        "onboarding_status": "COMPLETED",
        "onboarding_step": "dashboard_ready",
        "default_currency": "USD",
        "created_at": datetime.now(timezone.utc) - timedelta(days=45),
    }
}

WALLET_STORE: Dict[str, Dict[str, Any]] = {
    "w_1": {
        "id": "w_1",
        "chain": "ethereum",
        "address": "0x71C8401344445853782977E2A91D61b9a957B7E6",
        "label": "Cold Storage Vault",
        "is_primary": True,
        "created_at": datetime.now(timezone.utc) - timedelta(days=30),
        "last_synced_at": datetime.now(timezone.utc) - timedelta(minutes=4),
        "status": "ACTIVE",
    },
    "w_2": {
        "id": "w_2",
        "chain": "arbitrum",
        "address": "0x4838B106FCe9647Bdf1E7877BF73cE8B0BAD5f97",
        "label": "Active DeFi Hot Wallet",
        "is_primary": False,
        "created_at": datetime.now(timezone.utc) - timedelta(days=12),
        "last_synced_at": datetime.now(timezone.utc) - timedelta(minutes=8),
        "status": "ACTIVE",
    },
}

# Retail Lending Positions (Aave v3, Compound v3, Spark)
POSITION_STORE: Dict[str, Dict[str, Any]] = {
    "pos_aave_v3_eth": {
        "position_id": "pos_aave_v3_eth",
        "protocol": "Aave v3",
        "chain": "ethereum",
        "wallet_address": "0x71C8401344445853782977E2A91D61b9a957B7E6",
        "collaterals": [
            {
                "symbol": "ETH",
                "amount": 12.50,
                "spot_price_usd": 3250.00,
                "liquidation_threshold_pct": 82.5,
                "max_ltv_pct": 80.0,
                "is_volatile": True,
            }
        ],
        "debts": [
            {
                "symbol": "USDC",
                "amount": 22000.00,
                "spot_price_usd": 1.00,
                "borrow_apy_pct": 5.4,
                "borrow_type": "VARIABLE",
            }
        ],
    },
    "pos_comp_v3_arb": {
        "position_id": "pos_comp_v3_arb",
        "protocol": "Compound v3",
        "chain": "arbitrum",
        "wallet_address": "0x4838B106FCe9647Bdf1E7877BF73cE8B0BAD5f97",
        "collaterals": [
            {
                "symbol": "WBTC",
                "amount": 1.10,
                "spot_price_usd": 88400.00,
                "liquidation_threshold_pct": 77.0,
                "max_ltv_pct": 70.0,
                "is_volatile": True,
            },
            {
                "symbol": "USDC",
                "amount": 8000.00,
                "spot_price_usd": 1.00,
                "liquidation_threshold_pct": 88.0,
                "max_ltv_pct": 85.0,
                "is_volatile": False,
            },
        ],
        "debts": [
            {
                "symbol": "USDT",
                "amount": 54000.00,
                "spot_price_usd": 1.00,
                "borrow_apy_pct": 6.8,
                "borrow_type": "VARIABLE",
            }
        ],
    },
    "pos_spark_eth": {
        "position_id": "pos_spark_eth",
        "protocol": "Spark Protocol",
        "chain": "ethereum",
        "wallet_address": "0x71C8401344445853782977E2A91D61b9a957B7E6",
        "collaterals": [
            {
                "symbol": "WSTETH",
                "amount": 8.00,
                "spot_price_usd": 3820.00,
                "liquidation_threshold_pct": 84.0,
                "max_ltv_pct": 80.0,
                "is_volatile": True,
            }
        ],
        "debts": [
            {
                "symbol": "DAI",
                "amount": 19500.00,
                "spot_price_usd": 1.00,
                "borrow_apy_pct": 7.1,
                "borrow_type": "VARIABLE",
            }
        ],
    },
}

ALERT_PREFERENCES_STORE: Dict[str, Any] = {
    "hf_warning_threshold": 1.30,
    "hf_critical_threshold": 1.10,
    "price_drop_warning_pct": -15.0,
    "liquidation_distance_warning_pct": 20.0,
    "email_enabled": True,
    "telegram_enabled": False,
    "whatsapp_enabled": False,
    "frequency": "IMMEDIATE",
}

CHANNEL_LINKS_STORE: Dict[str, Dict[str, Any]] = {}


# Database Access Functions

def get_current_user_profile() -> Dict[str, Any]:
    user = USER_STORE["user_01"].copy()
    user["wallets_count"] = len(WALLET_STORE)
    user["active_alerts_count"] = sum(
        1 for k, v in ALERT_PREFERENCES_STORE.items() if k.endswith("_enabled") and v is True
    )
    return user


def get_wallets() -> List[Dict[str, Any]]:
    return list(WALLET_STORE.values())


def add_wallet(chain: str, address: str, label: str, is_primary: bool) -> Dict[str, Any]:
    wallet_id = f"w_{uuid.uuid4().hex[:8]}"
    if is_primary:
        # Demote any current primary wallet
        for w in WALLET_STORE.values():
            w["is_primary"] = False

    new_wallet = {
        "id": wallet_id,
        "chain": chain,
        "address": address,
        "label": label,
        "is_primary": is_primary or (len(WALLET_STORE) == 0),
        "created_at": datetime.now(timezone.utc),
        "last_synced_at": datetime.now(timezone.utc),
        "status": "ACTIVE",
    }
    WALLET_STORE[wallet_id] = new_wallet
    return new_wallet


def delete_wallet_by_id(wallet_id: str) -> bool:
    if wallet_id in WALLET_STORE:
        del WALLET_STORE[wallet_id]
        return True
    return False


def delete_wallet_by_address(address: str) -> Optional[str]:
    clean_target = address.strip().lower()
    for wid, w in list(WALLET_STORE.items()):
        if w["address"].lower() == clean_target:
            del WALLET_STORE[wid]
            return wid
    return None


def get_positions() -> List[Dict[str, Any]]:
    return list(POSITION_STORE.values())


def get_position_by_id(position_id: str) -> Optional[Dict[str, Any]]:
    return POSITION_STORE.get(position_id)


def get_alert_preferences() -> Dict[str, Any]:
    return ALERT_PREFERENCES_STORE.copy()


def update_alert_preferences(new_prefs: Dict[str, Any]) -> Dict[str, Any]:
    ALERT_PREFERENCES_STORE.update(new_prefs)
    return ALERT_PREFERENCES_STORE.copy()


def create_channel_link(channel_type: str, identifier: str) -> Dict[str, Any]:
    link_id = f"chl_{uuid.uuid4().hex[:8]}"
    code = f"BAC-{uuid.uuid4().hex[:6].upper()}"
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)

    if channel_type == "telegram":
        instructions = (
            f"Open Telegram, start our notification bot @BachegaRiskBot, "
            f"and send this verification code: /verify {code}"
        )
        deep_link = f"https://t.me/BachegaRiskBot?start={code}"
    else:
        instructions = (
            f"Send a WhatsApp message to +1 (555) 019-2834 with the text: "
            f"VERIFY {code} to confirm alert subscription."
        )
        deep_link = f"https://wa.me/15550192834?text=VERIFY%20{code}"

    link_record = {
        "channel_type": channel_type,
        "identifier": identifier,
        "verification_code": code,
        "verification_status": "PENDING_VERIFICATION",
        "verification_instructions": instructions,
        "deep_link": deep_link,
        "expires_at": expires_at,
        "created_at": datetime.now(timezone.utc),
    }
    CHANNEL_LINKS_STORE[link_id] = link_record
    return link_record

