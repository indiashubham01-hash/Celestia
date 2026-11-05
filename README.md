# Bachega - Individual User DeFi Risk & Crash Simulation Workbench

**Bachega** is a read-only monitoring and deterministic risk stress-testing workbench built specifically for individual retail DeFi borrowers.

> ⚠️ **Disclaimer**: All stress tests and liquidation scenarios carry the explicit label **"Simulation, not prediction."** This backend contains no vault-operator controls and initiates no automatic on-chain transactions or executions.

---

## 🛠️ Architecture & Core Components

The backend is built with Python 3.11, FastAPI, Pydantic v2, and NumPy:

- **`main.py`**: Production-ready FastAPI application with CORS middleware enabled for seamless React / Vite frontend connections, routing, and error handling.
- **`engine.py`**: Vectorized deterministic risk & crash simulation engine powered by NumPy. Computes Health Factors (HF), dynamic liquidation thresholds, proximity percentages, and evaluates crash steps (-10% to -50%) against **"Do Nothing"**, **"Repay Debt"**, and **"Add Collateral"** scenarios.
- **`schemas.py`**: Strict Pydantic models with field validators (chain validation, EVM `0x[a-fA-F0-9]{40}` checksum/format checks, Solana Base58 checks, shock constraints, and alert ranges).
- **`services.py`**: Integration layer for **CoinGecko API** (spot prices with 60s TTL caching) and **Alchemy API** (wallet balances), with zero-latency resilient fallbacks for offline development.
- **`db.py`**: Thread-safe in-memory mock database pre-seeded with retail lending positions across **Aave v3**, **Compound v3**, and **Spark Protocol**.
- **`config.py`**: Centralized runtime settings loaded from `.env`.

---

## 🚀 Quickstart & Setup

### 1. Activate Environment & Install Dependencies

```bash
# Windows
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt

# Linux / macOS
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 2. Configure Environment Variables (Optional)

Copy `.env.example` to `.env`:

```env
COINGECKO_API_KEY=your_coingecko_api_key_here
ALCHEMY_API_KEY=your_alchemy_api_key_here
PORT=8000
```
*(If keys are omitted, the application uses high-fidelity cached prices and on-chain references out of the box).*

### 3. Run the Backend API Server

```bash
uvicorn main:app --reload --port 8000
```

- **Interactive Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc Documentation**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **Bundled React Dashboard**: [http://localhost:8000/app](http://localhost:8000/app)

### 4. Run the React Frontend (Vite Dev Server)

```bash
cd frontend
npm run dev
```

- **Vite Local URL**: [http://localhost:5173](http://localhost:5173)

### 5. Run Backend Verification Test Suite

```bash
python test_app.py
```

---

## 📡 API Endpoints Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | API status, version, and disclaimer banner |
| `GET` | `/api/health` | Liveness health check |
| `GET` | `/api/me` | User profile, notification handle, and onboarding status |
| `GET` | `/api/wallets` | List all monitored public wallet addresses |
| `POST` | `/api/wallets` | Add a monitored address (validates chain + EVM/Solana format) |
| `DELETE` | `/api/wallets/{wallet_id}` | Remove wallet from monitoring list |
| `GET` | `/api/portfolio` | Aggregated wallet balances and multi-protocol lending summaries |
| `GET` | `/api/positions` | List available lending position IDs |
| `GET` | `/api/positions/{id}` | Granular risk metrics: Health Factor, LTV, Liquidation Price, Proximity % |
| `POST` | `/api/simulations` | Execute hypothetical collateral shock simulation (-10% to -50%) |
| `GET` | `/api/alerts/preferences` | Retrieve alert thresholds and delivery channels |
| `PUT` | `/api/alerts/preferences` | Update alert thresholds (HF warning, critical, 24h price drop) |
| `POST` | `/api/alerts/link-channel` | Start authenticated Telegram / WhatsApp opt-in verification |

---

## 🧮 Mathematical Modeling (`engine.py`)

### 1. Health Factor (HF)
$$\text{Health Factor} = \frac{\sum (\text{Collateral Amount}_i \times \text{Spot Price}_i \times \text{Liquidation Threshold}_i)}{\text{Total Debt USD}}$$

- **HF $\ge 1.50$**: `SAFE`
- **$1.25 \le \text{HF} < 1.50$**: `MODERATE`
- **$1.10 \le \text{HF} < 1.25$**: `ELEVATED`
- **$1.00 \le \text{HF} < 1.10$**: `CRITICAL`
- **$\text{HF} < 1.00$**: `LIQUIDATABLE`

### 2. Liquidation Price & Proximity
$$P_{\text{liq}} = \frac{\text{Total Debt} - \text{Stable Liquidation Capacity}}{\text{Volatile Collateral Amount} \times \text{LT}_{\text{volatile}}}$$
$$\text{Proximity \%} = \frac{P_{\text{liq}} - P_{\text{spot}}}{P_{\text{spot}}} \times 100\%$$

### 3. Simulation Scenarios
Under each shock level $\Delta \in [-0.10, -0.20, -0.30, -0.40, -0.50]$:
1. **Do Nothing**: Tracks erosion of collateral value, buffer depletion, and liquidation shortfall.
2. **Repay Debt**: Evaluates de-leveraging to restore safe Health Factors.
3. **Add Collateral**: Evaluates stable buffer injection to stave off liquidation.

