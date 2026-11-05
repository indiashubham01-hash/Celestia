
"""
Bachega - Comprehensive API & Engine Verification Suite
Tests all required endpoints, math models, validations, and edge cases.
"""

import asyncio
import httpx
from main import app


async def run_tests():
    print("🚀 Starting Bachega backend verification...")
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:

        # 1. Root & Health
        print("\n--- Testing Root & Health ---")
        res = await client.get("/")
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        data = res.json()
        assert "disclaimer" in data
        assert data["disclaimer"] == "Simulation, not prediction."
        print("✅ GET /: OK - Disclaimer present")

        res = await client.get("/api/health")
        assert res.status_code == 200
        print("✅ GET /api/health: OK")

        # 2. User & Onboarding
        print("\n--- Testing /api/me & /api/auth ---")
        res = await client.get("/api/me")
        assert res.status_code == 200
        user = res.json()
        assert user["onboarding_status"] == "COMPLETED"
        assert "wallets_count" in user
        print(f"✅ GET /api/me: OK - User: {user['handle']}, Wallets: {user['wallets_count']}")

        # Test Send OTP
        res = await client.post("/api/auth/send-otp", json={"email": "tester@example.com"})
        assert res.status_code == 200
        otp_data = res.json()
        assert otp_data["success"] is True
        assert "dev_code" in otp_data
        dev_code = otp_data["dev_code"]
        print(f"✅ POST /api/auth/send-otp: OK - Generated dev_code {dev_code}")

        # Test Verify OTP
        res = await client.post("/api/auth/verify-otp", json={"email": "tester@example.com", "code": dev_code})
        assert res.status_code == 200
        auth_data = res.json()
        assert auth_data["success"] is True
        assert auth_data["user"]["email"] == "tester@example.com"
        print(f"✅ POST /api/auth/verify-otp: OK - Authenticated {auth_data['user']['email']}")

        # Test Google Auth
        res = await client.post("/api/auth/google", json={"email": "google.user@gmail.com", "name": "Google Tester"})
        assert res.status_code == 200
        g_data = res.json()
        assert g_data["success"] is True
        assert g_data["user"]["email"] == "google.user@gmail.com"
        print(f"✅ POST /api/auth/google: OK - Authenticated {g_data['user']['email']}")

        # 3. Wallets Management
        print("\n--- Testing /api/wallets ---")
        # List wallets
        res = await client.get("/api/wallets")
        assert res.status_code == 200
        wallets = res.json()
        initial_count = len(wallets)
        print(f"✅ GET /api/wallets: OK - {initial_count} wallets tracked")

        # Add valid EVM wallet
        new_wallet_payload = {
            "chain": "ethereum",
            "address": "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed",
            "label": "Trezor Staking Reserve",
            "is_primary": False,
        }
        res = await client.post("/api/wallets", json=new_wallet_payload)
        assert res.status_code == 201
        created_wallet = res.json()
        assert created_wallet["address"] == new_wallet_payload["address"]
        print(f"✅ POST /api/wallets: Created wallet {created_wallet['id']}")

        # Test invalid address rejection
        res_invalid = await client.post(
            "/api/wallets",
            json={"chain": "ethereum", "address": "0xinvalid123", "label": "Bad"},
        )
        assert res_invalid.status_code == 422
        print("✅ POST /api/wallets validation: Rejected invalid EVM address")

        # Delete wallet
        res_del = await client.delete(f"/api/wallets/{created_wallet['id']}")
        assert res_del.status_code == 200
        assert res_del.json()["success"] is True
        print(f"✅ DELETE /api/wallets/{{id}}: Deleted wallet {created_wallet['id']}")

        # 4. Portfolio
        print("\n--- Testing /api/portfolio ---")
        res = await client.get("/api/portfolio")
        assert res.status_code == 200
        portfolio = res.json()
        assert "total_collateral_usd" in portfolio
        assert "total_debt_usd" in portfolio
        assert "lending_summaries" in portfolio
        assert len(portfolio["lending_summaries"]) > 0
        print(
            f"✅ GET /api/portfolio: OK - Total Collateral: ${portfolio['total_collateral_usd']:,.2f}, "
            f"Total Debt: ${portfolio['total_debt_usd']:,.2f}, Aggregate HF: {portfolio['aggregate_health_factor']}"
        )

        # 5. Position Details
        print("\n--- Testing /api/positions/{id} ---")
        res_list = await client.get("/api/positions")
        assert res_list.status_code == 200
        positions = res_list.json()
        assert len(positions) > 0

        target_id = positions[0]["position_id"]
        res_pos = await client.get(f"/api/positions/{target_id}")
        assert res_pos.status_code == 200
        pos_data = res_pos.json()
        assert pos_data["health_factor"] > 0
        assert "liquidation_price_usd" in pos_data
        assert "liquidation_proximity_pct" in pos_data
        print(
            f"✅ GET /api/positions/{target_id}: Protocol: {pos_data['protocol']}, "
            f"HF: {pos_data['health_factor']}, Liq Price: ${pos_data['liquidation_price_usd']:,.2f}, "
            f"Proximity: {pos_data['liquidation_proximity_pct']}%"
        )

        # 6. Stress Test Simulation
        print("\n--- Testing POST /api/simulations ---")
        sim_payload = {
            "position_id": target_id,
            "custom_shocks": [-0.10, -0.20, -0.30, -0.40, -0.50],
            "repay_amounts_usd": [2500.0, 5000.0, 10000.0],
            "add_collateral_amounts_usd": [2000.0, 5000.0, 10000.0],
        }
        res_sim = await client.post("/api/simulations", json=sim_payload)
        assert res_sim.status_code == 200
        sim_data = res_sim.json()
        assert sim_data["disclaimer"] == "Simulation, not prediction."
        assert len(sim_data["results"]) == 5
        assert len(sim_data["assumptions"]) > 0

        step_50 = sim_data["results"][-1]
        print(f"✅ POST /api/simulations: Simulation ID: {sim_data['simulation_id']}")
        print(f"   - Disclaimer: \"{sim_data['disclaimer']}\"")
        print(f"   - Under {step_50['shock_percentage']}% crash:")
        print(f"     * Do Nothing HF: {step_50['do_nothing']['simulated_health_factor']} (Liquidated: {step_50['do_nothing']['is_liquidated']})")
        print(f"     * Repay $10,000 HF: {step_50['repay_debt_scenarios'][-1]['simulated_health_factor']}")
        print(f"     * Add $10,000 Collateral HF: {step_50['add_collateral_scenarios'][-1]['simulated_health_factor']}")

        # 6b. Direct Simulation Payload (from Telegram bot)
        direct_payload = {
            "collateral_amount": 2.5,
            "collateral_price_usd": 3000.0,
            "debt_usd": 4500.0,
            "liquidation_threshold": 0.825,
            "price_shock_pct": -35.0,
            "rescue_budget_usd": 750.0,
        }
        res_direct = await client.post("/api/simulations", json=direct_payload)
        assert res_direct.status_code == 200
        direct_data = res_direct.json()
        assert len(direct_data["results"]) == 1
        print("✅ POST /api/simulations (Direct Bot Payload): OK - Calculated -35% crash scenario")
        print("\n--- Testing /api/alerts ---")
        res_pref = await client.get("/api/alerts/preferences")
        assert res_pref.status_code == 200
        prefs = res_pref.json()
        print(f"✅ GET /api/alerts/preferences: Warning HF: {prefs['hf_warning_threshold']}")

        # Update preferences
        update_payload = prefs.copy()
        update_payload["hf_warning_threshold"] = 1.35
        update_payload["telegram_enabled"] = True
        res_put = await client.put("/api/alerts/preferences", json=update_payload)
        assert res_put.status_code == 200
        assert res_put.json()["hf_warning_threshold"] == 1.35
        print("✅ PUT /api/alerts/preferences: Updated warning threshold to 1.35")

        # Link channel (Telegram)
        link_payload = {
            "channel_type": "telegram",
            "identifier": "@crypto_investor_99",
        }
        res_link = await client.post("/api/alerts/link-channel", json=link_payload)
        assert res_link.status_code == 201
        channel_data = res_link.json()
        assert channel_data["verification_status"] == "PENDING_VERIFICATION"
        assert "verification_code" in channel_data
        print(f"✅ POST /api/alerts/link-channel: Verification Code {channel_data['verification_code']}")

        # 8. Telegram Bot Endpoints
        print("\n--- Testing /api/alerts/telegram ---")
        res_tg_verify = await client.post("/api/alerts/telegram/verify")
        assert res_tg_verify.status_code == 200
        tg_data = res_tg_verify.json()
        assert "success" in tg_data
        print(f"✅ POST /api/alerts/telegram/verify: OK (success={tg_data['success']})")

        # Test Status before registration
        res_status_before = await client.get("/api/alerts/telegram/status?user_id=new_user_99")
        assert res_status_before.status_code == 200
        assert res_status_before.json()["verified"] is False
        print("✅ GET /api/alerts/telegram/status (unregistered): OK - returned verified=False")

        # Test Register from /start deep link
        res_register = await client.post(
            "/api/alerts/telegram/register",
            json={"user_id": "usr_pitch_demo", "chat_id": "987654321", "username": "defi_whale"},
        )
        assert res_register.status_code == 200
        assert res_register.json()["success"] is True
        print("✅ POST /api/alerts/telegram/register: OK - registered usr_pitch_demo with chat 987654321")

        # Test Status after registration
        res_status_after = await client.get("/api/alerts/telegram/status?user_id=usr_pitch_demo")
        assert res_status_after.status_code == 200
        status_after_data = res_status_after.json()
        assert status_after_data["verified"] is True
        assert status_after_data["telegram_username"] == "defi_whale"
        print(f"✅ GET /api/alerts/telegram/status (registered): OK - verified=True, username={status_after_data['telegram_username']}")

        res_tg_alert = await client.post(
            "/api/alerts/telegram/send-alert",
            json={"chat_id": "test_chat_id", "health_factor": 1.045, "shock_pct": 30.0},
        )
        assert res_tg_alert.status_code == 200
        alert_data = res_tg_alert.json()
        assert "success" in alert_data
        print(f"✅ POST /api/alerts/telegram/send-alert: OK (chat_id={alert_data.get('chat_id')})")

        print("\n🎉 ALL BACKEND ENDPOINTS AND TESTS PASSED SUCCESSFULLY!")


if __name__ == "__main__":
    asyncio.run(run_tests())

