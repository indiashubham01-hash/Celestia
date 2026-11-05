"""
Bachega - Configuration Module
Provides centralized runtime configuration for API keys, network URLs,
CORS policies, and simulation defaults.
"""

from typing import List
import os
from pydantic import BaseModel, Field
from dotenv import load_dotenv

load_dotenv()


class Settings(BaseModel):
    PROJECT_NAME: str = "Bachega API"
    PROJECT_DESCRIPTION: str = (
        "Individual User DeFi Risk & Crash Simulation Workbench. "
        "Read-only monitoring and deterministic stress-testing for retail DeFi borrowers."
    )
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"

    # CORS settings - permissive for local frontend development (React/Vite/Next.js)
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:4173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "*",
    ]

    # External Data Services
    COINGECKO_API_KEY: str = Field(
        default_factory=lambda: os.getenv("COINGECKO_API_KEY", "")
    )
    COINGECKO_BASE_URL: str = "https://api.coingecko.com/api/v3"

    ALCHEMY_API_KEY: str = Field(
        default_factory=lambda: os.getenv("ALCHEMY_API_KEY", "")
    )
    ALCHEMY_ETH_RPC_URL: str = Field(
        default_factory=lambda: os.getenv(
            "ALCHEMY_ETH_RPC_URL", "https://eth-mainnet.g.alchemy.com/v2"
        )
    )

    # Telegram Bot Service
    TELEGRAM_BOT_TOKEN: str = Field(
        default_factory=lambda: os.getenv("TELEGRAM_BOT_TOKEN", "")
    )
    TELEGRAM_BOT_USERNAME: str = Field(
        default_factory=lambda: os.getenv("TELEGRAM_BOT_USERNAME", "@Bachega_bot")
    )

    # Core Policy and Disclaimer
    SIMULATION_DISCLAIMER: str = "Simulation, not prediction."


settings = Settings()

