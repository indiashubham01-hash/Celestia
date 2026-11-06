# Product

<!-- impeccable:product-schema 1 -->

## Platform

web, telegram

## Users
Individual retail DeFi borrowers holding collateralized debt positions across major lending protocols (Aave v3, Compound v3, Spark Protocol). They need to monitor their liquidation distance in real time and evaluate de-leveraging options before sudden market crashes trigger liquidator penalties.

## Product Purpose
Bachega is an individual user DeFi risk & crash simulation workbench. It exists to provide retail borrowers with deterministic stress testing of hypothetical collateral price shocks (-10% to -50%) and clear comparisons across 5 survival actions: Do Nothing, Repay Debt, Add Collateral, Collateral Swap, and Partial Deleverage.

## Positioning
A pure read-only mathematical workbench built exclusively for individual borrowers. Unlike institutional vault-management platforms, bot operators, or custodial services, Bachega contains zero vault-operator controls, never handles private keys, and performs no automated on-chain execution.

## Operating Context
Active DeFi borrowers operating in high-volatility cryptocurrency markets on Ethereum and Layer-2 rollups (Arbitrum, Optimism, Base, Polygon). Users monitor positions on web dashboards ([celestia-ivory-three.vercel.app](https://celestia-ivory-three.vercel.app)) and receive automated real-time early-warning liquidation alarms via Telegram ([@Bachegafi_bot](https://t.me/Bachegafi_bot)).

## Capabilities and Constraints
- Read-only tracking of public wallet addresses (EVM 0x... and Solana Base58).
- Real-time spot price indexing via CoinGecko API and on-chain balances via Alchemy.
- Deterministic Health Factor, LTV, Liquidation Price, and Liquidation Proximity calculations.
- Multi-scenario crash stress testing across price shock steps (-10% to -50%) with 5 defense strategies.
- 4-Stage Quantitative Alarm Pipeline with multi-tier Health Factor thresholds (Equilibrium, Warning, Critical) dispatched to Telegram.
- Non-custodial constraint: Strictly informational; never executes transactions or accesses funds.

## Brand Commitments
- Name: Bachega (बचेगा)
- Core Mantra: "Markets Crash. You Don't Have To."
- Mandatory Disclaimer: "Simulation, not prediction."
- Chosen Visual Direction: Paris Fête Foraine (1900 Universal Exposition) — Linen cream, terracotta carmine, antique brass, orangerie sage, carousel counterweight scale. Zero neon.

## Evidence on Hand
- Production FastAPI backend (`main.py`, `engine.py`, `services.py`, `schemas.py`, `db.py`)
- Live Telegram Bot daemon (`backend/bot.py`) connected to `@Bachegafi_bot`
- Live CoinGecko API and Alchemy RPC integrations configured securely via environment variables (.env)
- React 18 + Vite + Tailwind CSS frontend dashboard in `frontend/` deployed on Vercel
- Architecture diagram in `assets/market_analysis_alert_pipeline.png`
- Automated test suite (`test_app.py`) verifying all endpoints and math

## Product Principles
1. Read-Only Safety: Zero custody, zero private keys, zero automated execution.
2. Transparent Math: Deterministic formulas with explicit assumptions for every simulation.
3. Proactive Decision Support: Give borrowers clear, actionable comparisons between de-leveraging and buffer fortification.
4. Truth in Risk: Always label simulations as hypothetical modeling ("Simulation, not prediction").
