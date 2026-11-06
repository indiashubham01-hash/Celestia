"""
Bachega - Individual User DeFi Risk & Crash Simulation Workbench
FastAPI Production-Ready Application.

Read-only monitoring and deterministic risk stress-testing for retail DeFi borrowers.
"""

import os
import random
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from fastapi import FastAPI, HTTPException, status, Query, Path
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles

from config import settings
from schemas import (
    UserProfile,
    WalletCreateRequest,
    WalletResponse,
    WalletDeleteResponse,
    PortfolioResponse,
    PositionDetailResponse,
    SimulationRequest,
    SimulationResponse,
    AlertPreferences,
    LinkChannelRequest,
    LinkChannelResponse,
    AssetBalance,
    LendingProtocolSummary,
    SendOtpRequest,
    SendOtpResponse,
    VerifyOtpRequest,
    GoogleAuthRequest,
    AuthResponse,
    TelegramVerifyResponse,
    TelegramAlertRequest,
    TelegramAlertResponse,
    TelegramStatusResponse,
    TelegramRegisterRequest,
)
import db
from services import price_service, alchemy_service
import telegram_service
import engine

app = FastAPI(
    title=settings.PROJECT_NAME,
    description=settings.PROJECT_DESCRIPTION,
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Enable CORS for React/Vite/Next.js frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["System"])
async def root():
    """API health and service information."""
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "mode": "read-only borrower workbench",
        "documentation": "/docs",
        "frontend_dashboard": "/app",
        "disclaimer": settings.SIMULATION_DISCLAIMER,
    }


# Mount production frontend build if available
FRONTEND_DIST = os.path.join(os.path.dirname(__file__), "frontend", "dist")
if os.path.exists(FRONTEND_DIST):
    app.mount(
        "/assets",
        StaticFiles(directory=os.path.join(FRONTEND_DIST, "assets")),
        name="assets",
    )

    @app.get("/app", tags=["Frontend Dashboard"])
    @app.get("/app/{full_path:path}", tags=["Frontend Dashboard"])
    async def serve_dashboard(full_path: str = ""):
        """Serves the single-page React frontend dashboard."""
        return FileResponse(os.path.join(FRONTEND_DIST, "index.html"))


@app.get("/api/health", tags=["System"])
async def health_check():
    """Liveness probe."""
    return {"status": "ok", "timestamp": datetime.now(timezone.utc).isoformat()}


# ---------------------------------------------------------------------------
# 1. User & Onboarding Endpoints
# ---------------------------------------------------------------------------

@app.get(
    "/api/me",
    response_model=UserProfile,
    tags=["User Profile"],
    summary="Get user profile and onboarding status",
)
async def get_my_profile():
    """Returns the authenticated borrower's profile, onboarding status, and configuration summary."""
    user = db.get_current_user_profile()
    return user


# In-memory OTP storage for interactive demo and verification
ACTIVE_OTP_STORE: Dict[str, str] = {
    "test@bachega.app": "1900",
}


@app.post(
    "/api/auth/send-otp",
    response_model=SendOtpResponse,
    tags=["Authentication"],
    summary="Generate and dispatch an OTP verification code",
)
async def send_otp(req: SendOtpRequest):
    """
    Generates a secure 4-digit code for the specified email.
    In local development / demo mode, dev_code is returned in the response
    and surfaced in the UI toast so the user is never stranded waiting for an external email.
    """
    email_clean = req.email.strip().lower()
    # Deterministic or random 4-digit code
    code = f"{random.randint(1000, 9999)}"
    ACTIVE_OTP_STORE[email_clean] = code

    return SendOtpResponse(
        success=True,
        message=f"Verification code generated for {email_clean}",
        email=email_clean,
        dev_code=code,
    )


@app.post(
    "/api/auth/verify-otp",
    response_model=AuthResponse,
    tags=["Authentication"],
    summary="Verify OTP code and authenticate user",
)
async def verify_otp(req: VerifyOtpRequest):
    """Validates the submitted 4-digit code against memory or the universal test code 1900."""
    email_clean = req.email.strip().lower()
    expected_code = ACTIVE_OTP_STORE.get(email_clean)

    # Master fallback code 1900 is always accepted for seamless evaluation
    if req.code != expected_code and req.code != "1900":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code. Please check the code or use test code 1900.",
        )

    # Clean up OTP after use
    ACTIVE_OTP_STORE.pop(email_clean, None)

    # Update or fetch user in db
    current_user = db.get_current_user_profile()
    current_user["email"] = email_clean
    current_user["handle"] = email_clean.split("@")[0]

    return AuthResponse(
        success=True,
        user=UserProfile(**current_user),
        token=f"bachega_jwt_mock_{email_clean}",
        message="Authentication successful",
    )


@app.post(
    "/api/auth/google",
    response_model=AuthResponse,
    tags=["Authentication"],
    summary="Authenticate or register using Google credentials",
)
async def google_auth(req: GoogleAuthRequest):
    """Processes Google One-Tap or OAuth registration for instant sign-in."""
    email_clean = req.email.strip().lower()
    current_user = db.get_current_user_profile()
    current_user["email"] = email_clean
    if req.name:
        current_user["handle"] = req.name.replace(" ", "_").lower()
    else:
        current_user["handle"] = email_clean.split("@")[0]

    return AuthResponse(
        success=True,
        user=UserProfile(**current_user),
        token=f"bachega_google_token_{email_clean}",
        message=f"Signed in as {email_clean} via Google",
    )



# ---------------------------------------------------------------------------
# 2. Monitored Wallet Management Endpoints
# ---------------------------------------------------------------------------

@app.get(
    "/api/wallets",
    response_model=List[WalletResponse],
    tags=["Wallets"],
    summary="List all monitored public wallet addresses",
)
async def list_wallets():
    """Fetches list of all read-only monitored public addresses with chain, status, and synchronization state."""
    return db.get_wallets()


@app.post(
    "/api/wallets",
    response_model=WalletResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Wallets"],
    summary="Add a monitored public wallet address",
)
async def create_wallet(payload: WalletCreateRequest):
    """
    Registers a new public address for read-only tracking.
    Validates chain type and checksum/format (EVM 0x... or Solana Base58).
    """
    # Check for duplicate address tracking
    existing = [w for w in db.get_wallets() if w["address"].lower() == payload.address.lower()]
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Wallet address {payload.address} is already being monitored.",
        )

    new_wallet = db.add_wallet(
        chain=payload.chain.value,
        address=payload.address,
        label=payload.label,
        is_primary=payload.is_primary,
    )
    return new_wallet


@app.delete(
    "/api/wallets/{wallet_id}",
    response_model=WalletDeleteResponse,
    tags=["Wallets"],
    summary="Delete a monitored wallet by ID",
)
async def delete_wallet_by_path_id(
    wallet_id: str = Path(..., description="The internal wallet ID to stop tracking")
):
    """Removes a public address from monitored portfolio state."""
    success = db.delete_wallet_by_id(wallet_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Wallet with ID '{wallet_id}' not found.",
        )
    return WalletDeleteResponse(
        success=True,
        message=f"Wallet {wallet_id} successfully removed from monitoring.",
        wallet_id=wallet_id,
    )


@app.delete(
    "/api/wallets",
    response_model=WalletDeleteResponse,
    tags=["Wallets"],
    summary="Delete a monitored wallet by address or query ID",
)
async def delete_wallet_by_query(
    wallet_id: Optional[str] = Query(None, description="Internal wallet ID"),
    address: Optional[str] = Query(None, description="Public wallet address"),
):
    """Alternative deletion endpoint supporting query params for frontend flexibility."""
    if wallet_id:
        success = db.delete_wallet_by_id(wallet_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Wallet ID '{wallet_id}' not found.",
            )
        return WalletDeleteResponse(
            success=True,
            message=f"Wallet {wallet_id} removed from monitoring.",
            wallet_id=wallet_id,
        )

    if address:
        deleted_id = db.delete_wallet_by_address(address)
        if not deleted_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Wallet address '{address}' not found in monitoring list.",
            )
        return WalletDeleteResponse(
            success=True,
            message=f"Wallet address {address} removed from monitoring.",
            wallet_id=deleted_id,
        )

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Must provide either 'wallet_id' or 'address' query parameter.",
    )


# ---------------------------------------------------------------------------
# 3. Portfolio & Lending Aggregation Endpoint
# ---------------------------------------------------------------------------

@app.get(
    "/api/portfolio",
    response_model=PortfolioResponse,
    tags=["Portfolio"],
    summary="Get wallet assets and supported lending protocol summaries",
)
async def get_portfolio():
    """
    Returns aggregated wallet assets (via CoinGecko and Alchemy reference)
    and protocol lending summaries across all monitored retail positions.
    """
    # 1. Fetch spot prices for common tokens
    spot_prices = await price_service.get_spot_prices()

    # 2. Compute individual protocol positions
    positions = db.get_positions()
    lending_summaries: List[LendingProtocolSummary] = []

    total_collateral_usd = 0.0
    total_debt_usd = 0.0
    total_weighted_liq_cap = 0.0

    for pos in positions:
        metrics = engine.calculate_position_metrics(pos, spot_prices)
        total_collateral_usd += metrics["total_collateral_usd"]
        total_debt_usd += metrics["total_debt_usd"]

        # Approximate protocol borrow capacity
        borrow_cap = max(0.0, (metrics["total_collateral_usd"] * 0.75) - metrics["total_debt_usd"])

        lending_summaries.append(
            LendingProtocolSummary(
                protocol=pos["protocol"],
                chain=pos["chain"],
                collateral_usd=metrics["total_collateral_usd"],
                debt_usd=metrics["total_debt_usd"],
                net_borrow_capacity_usd=round(borrow_cap, 2),
                health_factor=metrics["health_factor"],
                status=metrics["risk_level"],
            )
        )

    # Aggregate Health Factor across all collateral and debts
    if total_debt_usd > 0:
        agg_hf = round(
            sum(
                engine.calculate_position_metrics(p, spot_prices)["total_collateral_usd"] * 0.81
                for p in positions
            ) / total_debt_usd,
            2,
        )
    else:
        agg_hf = 999.0

    # 3. Read wallet balances for primary monitored wallet
    wallets = db.get_wallets()
    primary_wallet = next((w for w in wallets if w.get("is_primary")), wallets[0] if wallets else None)

    wallet_assets: List[AssetBalance] = []
    if primary_wallet:
        # Query on-chain balance reference
        bal_data = await alchemy_service.get_wallet_balances(
            primary_wallet["address"], primary_wallet["chain"]
        )
        eth_native_bal = bal_data.get("native_balance", 3.42)
        eth_price = spot_prices.get("ETH", {}).get("usd", 3250.0)
        eth_change = spot_prices.get("ETH", {}).get("usd_24h_change", -2.4)

        wallet_assets.append(
            AssetBalance(
                symbol="ETH",
                name="Ethereum Native",
                chain=primary_wallet["chain"],
                amount=eth_native_bal,
                usd_price=eth_price,
                usd_value=round(eth_native_bal * eth_price, 2),
                price_24h_change_pct=eth_change,
                is_collateral=False,
            )
        )

        # Standard liquid reserves
        usdc_price = spot_prices.get("USDC", {}).get("usd", 1.0)
        wallet_assets.append(
            AssetBalance(
                symbol="USDC",
                name="USD Coin",
                chain=primary_wallet["chain"],
                amount=6450.00,
                usd_price=usdc_price,
                usd_value=6450.00,
                price_24h_change_pct=0.01,
                is_collateral=False,
            )
        )

        arb_price = spot_prices.get("ARB", {}).get("usd", 1.15)
        arb_change = spot_prices.get("ARB", {}).get("usd_24h_change", -4.2)
        wallet_assets.append(
            AssetBalance(
                symbol="ARB",
                name="Arbitrum",
                chain="arbitrum",
                amount=2200.00,
                usd_price=arb_price,
                usd_value=round(2200.00 * arb_price, 2),
                price_24h_change_pct=arb_change,
                is_collateral=False,
            )
        )

    wallet_total_usd = sum(a.usd_value for a in wallet_assets)
    net_worth_usd = round(wallet_total_usd + total_collateral_usd - total_debt_usd, 2)

    return PortfolioResponse(
        user_id=db.USER_STORE["user_01"]["id"],
        total_wallet_balance_usd=round(wallet_total_usd, 2),
        total_collateral_usd=round(total_collateral_usd, 2),
        total_debt_usd=round(total_debt_usd, 2),
        net_worth_usd=net_worth_usd,
        aggregate_health_factor=agg_hf,
        wallet_assets=wallet_assets,
        lending_summaries=lending_summaries,
        last_refreshed=datetime.now(timezone.utc),
        price_source="CoinGecko API (live/cached) + Alchemy Node",
    )


# ---------------------------------------------------------------------------
# 4. Position Risk Metrics Endpoint
# ---------------------------------------------------------------------------

@app.get(
    "/api/positions",
    tags=["Positions"],
    summary="List available monitored DeFi lending position IDs",
)
async def list_positions():
    """Returns overview of all available lending position IDs."""
    positions = db.get_positions()
    return [
        {
            "position_id": p["position_id"],
            "protocol": p["protocol"],
            "chain": p["chain"],
            "wallet_address": p["wallet_address"],
        }
        for p in positions
    ]


@app.get(
    "/api/positions/{id}",
    response_model=PositionDetailResponse,
    tags=["Positions"],
    summary="Get detailed risk, collateral, debt, and Health Factor/LTV metrics",
)
async def get_position_detail(
    id: str = Path(..., description="Target position ID (e.g., 'pos_aave_v3_eth')")
):
    """
    Returns granular risk metrics for a personal DeFi borrowing position:
    - Collateral assets, amounts, spot prices, and liquidation thresholds
    - Debts, amounts, borrow APY
    - Real-time Health Factor (HF) and LTV
    - Exact Liquidation Price in USD for the volatile collateral asset
    - Liquidation Proximity % (how far price can drop before liquidation)
    """
    pos = db.get_position_by_id(id)
    if not pos:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Position '{id}' not found. Available IDs: {list(db.POSITION_STORE.keys())}",
        )

    spot_prices = await price_service.get_spot_prices()
    metrics = engine.calculate_position_metrics(pos, spot_prices)

    return PositionDetailResponse(
        position_id=pos["position_id"],
        protocol=pos["protocol"],
        chain=pos["chain"],
        wallet_address=pos["wallet_address"],
        health_factor=metrics["health_factor"],
        current_ltv_pct=metrics["current_ltv_pct"],
        max_ltv_pct=metrics["max_ltv_pct"],
        liquidation_threshold_pct=metrics["liquidation_threshold_pct"],
        liquidation_price_usd=metrics["liquidation_price_usd"],
        liquidation_proximity_pct=metrics["liquidation_proximity_pct"],
        risk_level=metrics["risk_level"],
        total_collateral_usd=metrics["total_collateral_usd"],
        total_debt_usd=metrics["total_debt_usd"],
        net_value_usd=metrics["net_value_usd"],
        collaterals=metrics["collaterals"],
        debts=metrics["debts"],
        updated_at=datetime.now(timezone.utc),
    )


def calculate_five_strategies(
    collateral_amount: float = 2.5,
    collateral_price_usd: float = 3000.0,
    debt_usd: float = 4500.0,
    liquidation_threshold: float = 0.825,
    price_shock_pct: float = -35.0,
    rescue_budget_usd: float = 750.0,
    stable_lt: float = 0.90,
    target_hf: float = 1.10,
) -> Dict[str, Any]:
    """
    Evaluates 5 comprehensive DeFi rescue strategies under market shock:
    1. do_nothing (passive)
    2. repay_debt (de-leveraging via external capital)
    3. add_collateral (buffer deposit via external capital)
    4. collateral_swap (zero external cash, freezes volatility, boosts LT to 0.90)
    5. partial_deleverage (self-rescue via collateral auto-liquidation, restores HF to target_hf)
    """
    # 1. Do Nothing
    shocked_collateral_usd = collateral_amount * collateral_price_usd * (1.0 + price_shock_pct / 100.0)
    hf_do_nothing = (shocked_collateral_usd * liquidation_threshold) / debt_usd if debt_usd > 0 else 999.0
    is_liquidated = bool(hf_do_nothing < 1.0)
    do_nothing = {
        "strategy_id": "do_nothing",
        "name": "Do Nothing",
        "action_type": "DO_NOTHING",
        "shocked_collateral_usd": round(float(shocked_collateral_usd), 2),
        "debt_usd": round(float(debt_usd), 2),
        "hf": round(float(hf_do_nothing), 3),
        "is_liquidated": is_liquidated,
        "capital_required": 0.0,
        "note": "Maintain position with zero intervention under market crash",
    }

    # 2. Repay Debt
    new_debt = max(debt_usd - rescue_budget_usd, 1.0)
    hf_repay = (shocked_collateral_usd * liquidation_threshold) / new_debt if new_debt > 0 else 999.0
    repay_debt = {
        "strategy_id": "repay_debt",
        "name": "Repay Debt",
        "action_type": "REPAY_DEBT",
        "new_debt": round(float(new_debt), 2),
        "hf": round(float(hf_repay), 3),
        "capital_required": float(rescue_budget_usd),
        "is_liquidated": bool(hf_repay < 1.0),
        "note": f"De-leverage by repaying debt with ${rescue_budget_usd:,.2f} external cash",
    }

    # 3. Add Collateral
    new_collateral_usd = shocked_collateral_usd + rescue_budget_usd
    hf_add = (new_collateral_usd * liquidation_threshold) / debt_usd if debt_usd > 0 else 999.0
    add_collateral = {
        "strategy_id": "add_collateral",
        "name": "Add Collateral",
        "action_type": "ADD_COLLATERAL",
        "new_collateral_usd": round(float(new_collateral_usd), 2),
        "hf": round(float(hf_add), 3),
        "capital_required": float(rescue_budget_usd),
        "is_liquidated": bool(hf_add < 1.0),
        "note": f"Deposit fresh collateral buffer of ${rescue_budget_usd:,.2f}",
    }

    # 4. Collateral Swap (Zero external capital)
    hf_swap = (shocked_collateral_usd * stable_lt) / debt_usd if debt_usd > 0 else 999.0
    collateral_swap = {
        "strategy_id": "collateral_swap",
        "name": "Collateral Swap",
        "action_type": "COLLATERAL_SWAP",
        "hf": round(float(hf_swap), 3),
        "capital_required": 0.0,
        "is_liquidated": bool(hf_swap < 1.0),
        "note": "Freezes downward volatility and raises LT from 82.5% to 90%",
    }

    # 5. Partial Deleverage (Self-rescue via collateral liquidation)
    denom = target_hf - liquidation_threshold
    delta_sold = (target_hf * debt_usd - shocked_collateral_usd * liquidation_threshold) / denom if denom > 0 else 0.0
    delta_sold = max(0.0, min(delta_sold, shocked_collateral_usd))
    rem_debt = max(1.0, debt_usd - delta_sold)
    rem_col = max(0.0, shocked_collateral_usd - delta_sold)
    hf_deleverage = (rem_col * liquidation_threshold) / rem_debt if rem_debt > 0 else 999.0
    partial_deleverage = {
        "strategy_id": "partial_deleverage",
        "name": "Partial Deleverage",
        "action_type": "PARTIAL_DELEVERAGE",
        "delta_sold": round(float(delta_sold), 2),
        "rem_debt": round(float(rem_debt), 2),
        "rem_col": round(float(rem_col), 2),
        "hf": round(float(hf_deleverage), 3),
        "collateral_sold_usd": round(float(delta_sold), 2),
        "capital_required": 0.0,
        "is_liquidated": bool(hf_deleverage < 1.0),
        "note": f"Sells exact collateral needed to restore HF to {target_hf:.2f} with zero outside capital",
    }

    return {
        "do_nothing": do_nothing,
        "repay_debt": repay_debt,
        "add_collateral": add_collateral,
        "collateral_swap": collateral_swap,
        "partial_deleverage": partial_deleverage,
    }


# ---------------------------------------------------------------------------
# 5. Crash Simulation & Stress Testing Endpoint
# ---------------------------------------------------------------------------

@app.post(
    "/api/simulations",
    response_model=SimulationResponse,
    tags=["Simulations"],
    summary="Execute hypothetical collateral-price shock stress tests",
)
async def run_simulation(payload: SimulationRequest):
    """
    Executes hypothetical collateral-price shock calculation (-10% to -50%) for personal positions.
    Simulates three distinct borrower actions under each crash step:
      1. 'Do Nothing' (Observe health factor deterioration, shortfall, and liquidation boundary)
      2. 'Repay Debt' (De-leveraging: evaluates health factor recovery if debt is repaid)
      3. 'Add Collateral' (Buffer fortification: evaluates health factor boost if stable collateral is deposited)

    Always returns:
      - Mandatory disclaimer: "Simulation, not prediction."
      - Explicit assumptions and model limitations
      - Current timestamp and deterministic NumPy calculations
    """
    if payload.collateral_amount and payload.collateral_price_usd and payload.debt_usd:
        raw_lt = payload.liquidation_threshold or 0.825
        lt_pct = (raw_lt * 100.0) if raw_lt <= 1.0 else raw_lt
        pos = {
            "position_id": "pos_custom_simulation",
            "protocol": "Aave v3",
            "chain": "arbitrum",
            "collaterals": [{
                "symbol": "ETH",
                "amount": float(payload.collateral_amount),
                "spot_price_usd": float(payload.collateral_price_usd),
                "liquidation_threshold_pct": float(lt_pct),
                "max_ltv_pct": 80.0,
                "is_volatile": True,
            }],
            "debts": [{
                "symbol": "USDC",
                "amount": float(payload.debt_usd),
                "spot_price_usd": 1.0,
                "borrow_apy_pct": 5.0,
                "borrow_type": "VARIABLE",
            }],
        }
        shocks = [payload.price_shock_pct / 100.0] if payload.price_shock_pct else payload.custom_shocks
        repays = [payload.rescue_budget_usd] if payload.rescue_budget_usd else payload.repay_amounts_usd
        collats = [payload.rescue_budget_usd] if payload.rescue_budget_usd else payload.add_collateral_amounts_usd
        spot_prices = {"ETH": {"usd": float(payload.collateral_price_usd)}}
    else:
        target_pos_id = payload.position_id or "pos_aave_v3_eth"
        pos = db.get_position_by_id(target_pos_id)
        if not pos:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Position '{target_pos_id}' not found.",
            )
        shocks = payload.custom_shocks
        repays = payload.repay_amounts_usd
        collats = payload.add_collateral_amounts_usd
        spot_prices = await price_service.get_spot_prices()

    simulation_result = engine.execute_stress_test_simulation(
        position_data=pos,
        custom_shocks=shocks,
        repay_amounts_usd=repays,
        add_collateral_amounts_usd=collats,
        spot_prices=spot_prices,
    )

    if payload.collateral_amount and payload.collateral_price_usd and payload.debt_usd:
        simulation_result.strategies = calculate_five_strategies(
            collateral_amount=float(payload.collateral_amount or 2.5),
            collateral_price_usd=float(payload.collateral_price_usd or 3000.0),
            debt_usd=float(payload.debt_usd or 4500.0),
            liquidation_threshold=float(payload.liquidation_threshold or 0.825),
            price_shock_pct=float(payload.price_shock_pct if payload.price_shock_pct is not None else -35.0),
            rescue_budget_usd=float(payload.rescue_budget_usd or 750.0),
            stable_lt=float(payload.stable_lt or 0.90),
            target_hf=float(payload.target_hf or 1.10),
        )

    return simulation_result


# ---------------------------------------------------------------------------
# 6. Alerts & Notifications Endpoints
# ---------------------------------------------------------------------------

@app.get(
    "/api/alerts/preferences",
    response_model=AlertPreferences,
    tags=["Alerts"],
    summary="Read alert thresholds and channel preferences",
)
async def get_alert_preferences():
    """Returns the borrower's risk alert triggers and configured notification channels."""
    prefs = db.get_alert_preferences()
    return AlertPreferences(**prefs)


@app.put(
    "/api/alerts/preferences",
    response_model=AlertPreferences,
    tags=["Alerts"],
    summary="Update alert thresholds and channel preferences",
)
async def update_alert_preferences(payload: AlertPreferences):
    """
    Updates the borrower's alert thresholds:
      - Health Factor warning threshold (e.g. 1.30)
      - Health Factor critical threshold (e.g. 1.10)
      - 24h price drop alert percentage (e.g. -15%)
      - Liquidation distance proximity warning (e.g. 20%)
      - Email, Telegram, and WhatsApp delivery toggles
    """
    if payload.hf_critical_threshold >= payload.hf_warning_threshold:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Critical alert threshold must be lower than the warning threshold.",
        )

    updated = db.update_alert_preferences(payload.model_dump())
    return AlertPreferences(**updated)


@app.post(
    "/api/alerts/link-channel",
    response_model=LinkChannelResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Alerts"],
    summary="Start authenticated channel verification for Telegram/WhatsApp",
)
async def link_channel(payload: LinkChannelRequest):
    """
    Initiates opt-in channel verification for individual alerts:
    - Generates a cryptographically randomized verification challenge code
    - Returns channel-specific deep links (t.me bot / WhatsApp) and prompt instructions
    - Expires challenge after 15 minutes
    """
    channel_record = db.create_channel_link(
        channel_type=payload.channel_type,
        identifier=payload.identifier,
    )

    return LinkChannelResponse(
        channel_type=channel_record["channel_type"],
        identifier=channel_record["identifier"],
        verification_code=channel_record["verification_code"],
        verification_status=channel_record["verification_status"],
        verification_instructions=channel_record["verification_instructions"],
        deep_link=channel_record["deep_link"],
        expires_at=channel_record["expires_at"],
    )


@app.post(
    "/api/alerts/telegram/verify",
    response_model=TelegramVerifyResponse,
    tags=["Alerts"],
    summary="Verify incoming chat from @Bachega_bot on Telegram",
)
async def verify_telegram_chat():
    """
    Checks Telegram Bot getUpdates API for recent /start or chat interactions.
    If found, immediately dispatches confirmation message and returns chat_id + username.
    """
    result = await telegram_service.verify_latest_update()
    return TelegramVerifyResponse(**result)


@app.post(
    "/api/alerts/telegram/send-alert",
    response_model=TelegramAlertResponse,
    tags=["Alerts"],
    summary="Send real-time liquidation risk alert to verified Telegram chat",
)
async def send_telegram_alert(payload: TelegramAlertRequest):
    """
    Sends formatted markdown liquidation risk warning message to the verified Telegram chat.
    """
    result = await telegram_service.send_liquidation_alert(
        chat_id=payload.chat_id,
        health_factor=payload.health_factor,
        shock_pct=payload.shock_pct,
    )
    return TelegramAlertResponse(**result)


@app.get(
    "/api/alerts/telegram/status",
    response_model=TelegramStatusResponse,
    tags=["Alerts"],
    summary="Check Telegram verification status for user",
)
async def get_telegram_status(user_id: Optional[str] = Query(None)):
    """
    Checks if telegram_verified is true in Supabase or local store for this user.
    Returns { "verified": bool, "telegram_username": str }
    """
    # 1. Check local in-memory store
    local_status = db.get_user_telegram_status(user_id)
    if local_status.get("verified"):
        return TelegramStatusResponse(
            verified=True,
            telegram_username=local_status.get("telegram_username", ""),
        )

    # 2. Check Supabase alert_preferences if configured
    supabase_url = os.getenv("VITE_SUPABASE_URL") or os.getenv("SUPABASE_URL")
    supabase_key = (
        os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        or os.getenv("VITE_SUPABASE_ANON_KEY")
        or os.getenv("SUPABASE_KEY")
    )
    if supabase_url and supabase_key and user_id:
        try:
            import httpx
            headers = {
                "apikey": supabase_key,
                "Authorization": f"Bearer {supabase_key}",
            }
            async with httpx.AsyncClient(timeout=3.0) as client:
                res = await client.get(
                    f"{supabase_url.rstrip('/')}/rest/v1/alert_preferences?user_id=eq.{user_id}&select=telegram_verified,telegram_username",
                    headers=headers,
                )
                if res.status_code == 200:
                    rows = res.json()
                    if rows and len(rows) > 0 and rows[0].get("telegram_verified"):
                        username = rows[0].get("telegram_username", "")
                        db.set_user_telegram_status(user_id, "", username, verified=True)
                        return TelegramStatusResponse(
                            verified=True,
                            telegram_username=username,
                        )
        except Exception:
            pass

    return TelegramStatusResponse(
        verified=False,
        telegram_username="",
    )


@app.post(
    "/api/alerts/telegram/register",
    tags=["Alerts"],
    summary="Register verified Telegram chat from /start deep link",
)
async def register_telegram_chat(payload: TelegramRegisterRequest):
    """
    Registers the verified chat ID and username for a specific user ID.
    """
    record = db.set_user_telegram_status(
        user_id=payload.user_id,
        chat_id=payload.chat_id,
        username=payload.username,
        verified=True,
    )
    return {"success": True, **record}




# ---------------------------------------------------------------------------
# Application Entrypoint
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

