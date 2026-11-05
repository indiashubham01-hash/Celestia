"""
Bachega - Pydantic Request & Response Schemas
Provides strict validation, deterministic data types, and field constraints.
"""

from typing import List, Optional, Dict, Any, Literal
from datetime import datetime
from enum import Enum
import re
from pydantic import BaseModel, Field, field_validator


class OnboardingStatus(str, Enum):
    COMPLETED = "COMPLETED"
    IN_PROGRESS = "IN_PROGRESS"
    PENDING_WALLET = "PENDING_WALLET"


class SupportedChain(str, Enum):
    ETHEREUM = "ethereum"
    ARBITRUM = "arbitrum"
    OPTIMISM = "optimism"
    POLYGON = "polygon"
    BASE = "base"
    SOLANA = "solana"


class RiskLevel(str, Enum):
    SAFE = "SAFE"                 # HF >= 1.50
    MODERATE = "MODERATE"         # 1.25 <= HF < 1.50
    ELEVATED = "ELEVATED"         # 1.10 <= HF < 1.25
    CRITICAL = "CRITICAL"         # 1.00 <= HF < 1.10
    LIQUIDATABLE = "LIQUIDATABLE" # HF < 1.00


# ---------------------------------------------------------------------------
# User Profile Schemas
# ---------------------------------------------------------------------------

class UserProfile(BaseModel):
    id: str = Field(..., description="Unique user identifier")
    email: str = Field(..., description="User notification email")
    handle: str = Field(..., description="User screen handle")
    onboarding_status: OnboardingStatus = Field(
        default=OnboardingStatus.COMPLETED,
        description="Current user onboarding progress"
    )
    onboarding_step: str = Field(
        default="dashboard_ready",
        description="Step in onboarding workflow"
    )
    default_currency: str = Field(default="USD", description="Base reporting currency")
    wallets_count: int = Field(default=0, description="Total active monitored wallets")
    active_alerts_count: int = Field(default=0, description="Total configured threshold alerts")
    created_at: datetime = Field(..., description="Account creation timestamp")


# ---------------------------------------------------------------------------
# Wallet Management Schemas
# ---------------------------------------------------------------------------

class WalletCreateRequest(BaseModel):
    chain: SupportedChain = Field(
        default=SupportedChain.ETHEREUM,
        description="Target blockchain network"
    )
    address: str = Field(
        ...,
        description="Public address (read-only monitoring, EVM 0x... or Solana Base58)"
    )
    label: str = Field(
        default="Primary Ledger",
        min_length=1,
        max_length=64,
        description="Friendly user label for the address"
    )
    is_primary: bool = Field(
        default=False,
        description="Mark this address as the default active wallet"
    )

    @field_validator("address")
    @classmethod
    def validate_wallet_address(cls, v: str, info) -> str:
        clean_address = v.strip()
        chain = info.data.get("chain", SupportedChain.ETHEREUM)

        if chain == SupportedChain.SOLANA:
            # Solana public keys are base58 strings of 32 to 44 characters
            if not re.match(r"^[1-9A-HJ-NP-za-km-z]{32,44}$", clean_address):
                raise ValueError("Invalid Solana public key format (32-44 base58 characters)")
        else:
            # EVM address validation: 0x followed by 40 hex characters
            if not re.match(r"^0x[a-fA-F0-9]{40}$", clean_address):
                raise ValueError(
                    f"Invalid {chain.value} public address. Must be a valid 42-character 0x-prefixed hex string."
                )

        return clean_address


class WalletResponse(BaseModel):
    id: str = Field(..., description="Internal tracking ID")
    chain: SupportedChain = Field(..., description="Blockchain chain")
    address: str = Field(..., description="Public address monitored")
    label: str = Field(..., description="User label")
    is_primary: bool = Field(..., description="Primary wallet flag")
    created_at: datetime = Field(..., description="Tracking start timestamp")
    last_synced_at: Optional[datetime] = Field(None, description="Last successful block sync")
    status: str = Field(default="ACTIVE", description="Tracking state: ACTIVE, SYNCING, ERROR")


class WalletDeleteResponse(BaseModel):
    success: bool
    message: str
    wallet_id: str


# ---------------------------------------------------------------------------
# Portfolio & Asset Schemas
# ---------------------------------------------------------------------------

class AssetBalance(BaseModel):
    symbol: str
    name: str
    token_address: Optional[str] = None
    chain: str
    amount: float
    usd_price: float
    usd_value: float
    price_24h_change_pct: float
    is_collateral: bool = False


class LendingProtocolSummary(BaseModel):
    protocol: str = Field(..., example="Aave v3")
    chain: str = Field(..., example="ethereum")
    collateral_usd: float
    debt_usd: float
    net_borrow_capacity_usd: float
    health_factor: float
    status: RiskLevel


class PortfolioResponse(BaseModel):
    user_id: str
    total_wallet_balance_usd: float
    total_collateral_usd: float
    total_debt_usd: float
    net_worth_usd: float
    aggregate_health_factor: float
    wallet_assets: List[AssetBalance]
    lending_summaries: List[LendingProtocolSummary]
    last_refreshed: datetime
    price_source: str = Field(
        default="CoinGecko API + On-chain Oracle",
        description="Source of current asset pricing"
    )


# ---------------------------------------------------------------------------
# Position Detail Schemas
# ---------------------------------------------------------------------------

class CollateralItem(BaseModel):
    symbol: str
    amount: float
    spot_price_usd: float
    usd_value: float
    liquidation_threshold_pct: float = Field(
        ...,
        description="e.g. 82.5 means liquidation triggers if borrow reaches 82.5% of collateral"
    )
    max_ltv_pct: float = Field(
        ...,
        description="Maximum loan to value ratio permitted for borrowing"
    )
    is_volatile: bool = Field(
        default=True,
        description="True for volatile assets (ETH, WBTC), False for pegged stablecoins (USDC, DAI)"
    )


class DebtItem(BaseModel):
    symbol: str
    amount: float
    spot_price_usd: float
    usd_value: float
    borrow_apy_pct: float
    borrow_type: str = "VARIABLE"


class PositionDetailResponse(BaseModel):
    position_id: str
    protocol: str
    chain: str
    wallet_address: str
    health_factor: float
    current_ltv_pct: float
    max_ltv_pct: float
    liquidation_threshold_pct: float
    liquidation_price_usd: float = Field(
        ...,
        description="Price of volatile collateral asset where Health Factor equals exactly 1.0"
    )
    liquidation_proximity_pct: float = Field(
        ...,
        description="Drop in collateral price required to reach liquidation threshold (e.g. -42.8%)"
    )
    risk_level: RiskLevel
    total_collateral_usd: float
    total_debt_usd: float
    net_value_usd: float
    collaterals: List[CollateralItem]
    debts: List[DebtItem]
    updated_at: datetime


# ---------------------------------------------------------------------------
# Simulation Schemas
# ---------------------------------------------------------------------------

class SimulationRequest(BaseModel):
    position_id: Optional[str] = Field(
        default="pos_aave_v3_eth",
        description="Target personal position ID to stress test"
    )
    custom_shocks: Optional[List[float]] = Field(
        default=None,
        description="Optional list of percentage shocks between -0.05 and -0.70"
    )
    repay_amounts_usd: Optional[List[float]] = Field(
        default=None,
        description="Specific debt repayment amounts in USD to simulate across shock scenarios"
    )
    add_collateral_amounts_usd: Optional[List[float]] = Field(
        default=None,
        description="Specific additional collateral values in USD to simulate depositing"
    )
    # Direct simulation parameters (e.g. from Telegram bot or external clients)
    collateral_amount: Optional[float] = None
    collateral_price_usd: Optional[float] = None
    debt_usd: Optional[float] = None
    liquidation_threshold: Optional[float] = None
    price_shock_pct: Optional[float] = None
    rescue_budget_usd: Optional[float] = None

    @field_validator("custom_shocks")
    @classmethod
    def validate_shocks(cls, v: Optional[List[float]]) -> Optional[List[float]]:
        if v is not None:
            for s in v:
                if s > 0.0 or s < -0.90:
                    raise ValueError(f"Shock {s} must be negative between -0.01 and -0.90 (e.g. -0.25 for -25%)")
        return v


class ScenarioOutcome(BaseModel):
    action_type: Literal["DO_NOTHING", "REPAY_DEBT", "ADD_COLLATERAL"]
    action_description: str
    simulated_health_factor: float
    simulated_ltv_pct: float
    simulated_collateral_usd: float
    simulated_debt_usd: float
    is_liquidated: bool
    liquidation_shortfall_usd: float = Field(
        ...,
        description="Capital required to restore HF to 1.0 if liquidated, otherwise 0.0"
    )
    buffer_to_liquidation_usd: float = Field(
        ...,
        description="USD collateral buffer before liquidation threshold is breached"
    )
    risk_level: RiskLevel


class ShockStepResult(BaseModel):
    shock_percentage: float = Field(..., description="e.g. -10.0, -20.0, -30.0, -40.0, -50.0")
    shock_factor: float = Field(..., description="Multiplier e.g. 0.90, 0.80, 0.70...")
    simulated_volatile_asset_price: float
    do_nothing: ScenarioOutcome
    repay_debt_scenarios: List[ScenarioOutcome]
    add_collateral_scenarios: List[ScenarioOutcome]


class SimulationResponse(BaseModel):
    simulation_id: str
    position_id: str
    timestamp: datetime
    disclaimer: str = Field(
        default="Simulation, not prediction.",
        description="Mandatory compliance disclaimer for all hypothetical risk projections"
    )
    assumptions: List[str]
    base_metrics: Dict[str, Any]
    results: List[ShockStepResult]


# ---------------------------------------------------------------------------
# Alerts & Channel Linking Schemas
# ---------------------------------------------------------------------------

class AlertPreferences(BaseModel):
    hf_warning_threshold: float = Field(
        default=1.30,
        ge=1.01,
        le=3.0,
        description="Health factor warning trigger level"
    )
    hf_critical_threshold: float = Field(
        default=1.10,
        ge=1.00,
        le=2.0,
        description="Health factor emergency trigger level"
    )
    price_drop_warning_pct: float = Field(
        default=-15.0,
        le=-1.0,
        ge=-60.0,
        description="24-hour collateral drop percentage trigger"
    )
    liquidation_distance_warning_pct: float = Field(
        default=20.0,
        ge=1.0,
        le=50.0,
        description="Alert when collateral price is within this % of liquidation price"
    )
    email_enabled: bool = True
    telegram_enabled: bool = False
    whatsapp_enabled: bool = False
    frequency: Literal["IMMEDIATE", "HOURLY_DIGEST", "DAILY_DIGEST"] = "IMMEDIATE"


class LinkChannelRequest(BaseModel):
    channel_type: Literal["telegram", "whatsapp"] = Field(
        ...,
        description="Notification channel to verify"
    )
    identifier: str = Field(
        ...,
        min_length=3,
        max_length=64,
        description="E.g., phone number in E.164 (+1...) for WhatsApp or @handle/chat_id for Telegram"
    )


class LinkChannelResponse(BaseModel):
    channel_type: str
    identifier: str
    verification_code: str
    verification_status: Literal["PENDING_VERIFICATION", "VERIFIED"]
    verification_instructions: str
    deep_link: Optional[str]
    expires_at: datetime


# ---------------------------------------------------------------------------
# Authentication Schemas (OTP & Google Sign-In)
# ---------------------------------------------------------------------------

class SendOtpRequest(BaseModel):
    email: str = Field(..., description="Recipient email address for OTP delivery")


class SendOtpResponse(BaseModel):
    success: bool
    message: str
    email: str
    dev_code: Optional[str] = Field(
        None,
        description="Auto-generated verification code provided in dev/evaluator mode"
    )


class VerifyOtpRequest(BaseModel):
    email: str = Field(..., description="Email address being verified")
    code: str = Field(..., min_length=4, max_length=8, description="Verification code received")


class GoogleAuthRequest(BaseModel):
    email: str = Field(..., description="Google account email")
    name: Optional[str] = Field(None, description="Google profile name")
    picture: Optional[str] = Field(None, description="Google avatar image URL")
    credential: Optional[str] = Field(None, description="Google OAuth credential or JWT if provided")


class AuthResponse(BaseModel):
    success: bool
    user: UserProfile
    token: str
    message: str


# ---------------------------------------------------------------------------
# Telegram Bot Integration Schemas
# ---------------------------------------------------------------------------

class TelegramVerifyResponse(BaseModel):
    success: bool
    chat_id: Optional[str] = None
    username: Optional[str] = None
    message: Optional[str] = None


class TelegramAlertRequest(BaseModel):
    chat_id: str = Field(..., description="Target Telegram chat ID")
    health_factor: float = Field(default=1.04, description="Simulated or active Health Factor")
    shock_pct: float = Field(default=25.0, description="Market drop percentage to report")


class TelegramAlertResponse(BaseModel):
    success: bool
    message: Optional[str] = None
    chat_id: Optional[str] = None


class TelegramStatusResponse(BaseModel):
    verified: bool
    telegram_username: str = ""


class TelegramRegisterRequest(BaseModel):
    user_id: str
    chat_id: str
    username: str




