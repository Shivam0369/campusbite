import time
import pytest
from decimal import Decimal
from httpx import AsyncClient, ASGITransport
from sqlalchemy import select
from app.main import app
from app.models.entities import Order, OrderItem, User, MenuItem

@pytest.mark.asyncio
async def test_order_checkout_atomic_and_immutable_snapshot():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Login as customer rahul
        login_res = await client.post("/api/auth/login", json={
            "identifier": "rahul",
            "password": "Demo@123"
        })
        assert login_res.status_code == 200
        token = login_res.json()["data"]["token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Add Masala Dosa (id=4, price ₹90)
        cart_res = await client.post("/api/cart", json={
            "action": "add",
            "menu_item_id": 4,
            "quantity": 2
        })
        assert cart_res.status_code == 200
        cart_cookie = cart_res.cookies.get("campusbite_cart")

        # 3. Checkout
        checkout_res = await client.post(
            "/api/orders/checkout",
            json={
                "customer_name": "Rahul Sharma",
                "customer_phone": "9876543212",
                "notes": "Extra crispy, no onion please",
                "payment_method": "cash"
            },
            headers=headers,
            cookies={"campusbite_cart": cart_cookie}
        )
        assert checkout_res.status_code == 200
        order_data = checkout_res.json()["data"]
        order_id = order_data["order_id"]
        order_number = order_data["order_number"]

        # Subtotal: 2 * 90 = 180, Tax 5% = 9, Total = 189
        assert order_data["total_amount"] == 189.0
        assert order_number.startswith("CB")

        # 4. Invariant Verification: Immutable Snapshot
        order_details_res = await client.get(f"/api/orders/{order_id}", headers=headers)
        assert order_details_res.status_code == 200
        details = order_details_res.json()["data"]["order"]
        assert len(details["items"]) == 1
        assert details["items"][0]["item_name_snapshot"] == "Masala Dosa"
        assert float(details["items"][0]["unit_price"]) == 90.0
        assert details["order_status"] == "placed"

@pytest.mark.asyncio
async def test_live_account_deactivation_immediate_invalidation():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Register a temporary student
        uname = f"tmp_{int(time.time()*1000)}"
        reg_res = await client.post("/api/auth/register", json={
            "full_name": "Temp Student",
            "username": uname,
            "email": f"{uname}@college.edu",
            "phone": "9123456789",
            "password": "Password@123",
            "confirm_password": "Password@123"
        })
        assert reg_res.status_code == 200
        student_token = reg_res.json()["data"]["token"]
        student_headers = {"Authorization": f"Bearer {student_token}"}
        student_id = reg_res.json()["data"]["user"]["id"]

        # Verify active me works
        me_res = await client.get("/api/auth/me", headers=student_headers)
        assert me_res.status_code == 200

        # 2. Login as admin and deactivate student
        admin_login = await client.post("/api/auth/login", json={
            "identifier": "admin",
            "password": "Admin@123"
        })
        admin_token = admin_login.json()["data"]["token"]
        admin_headers = {"Authorization": f"Bearer {admin_token}"}

        toggle_res = await client.patch(f"/api/admin/users/{student_id}/toggle-active", headers=admin_headers)
        assert toggle_res.status_code == 200
        assert toggle_res.json()["data"]["is_active"] == 0

        # 3. Invariant Verification: Immediate invalidation on next click!
        me_after_deact = await client.get("/api/auth/me", headers=student_headers)
        assert me_after_deact.status_code == 401

@pytest.mark.asyncio
async def test_last_administrator_protection():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        admin_login = await client.post("/api/auth/login", json={
            "identifier": "admin",
            "password": "Admin@123"
        })
        admin_id = admin_login.json()["data"]["user"]["id"]
        admin_headers = {"Authorization": f"Bearer {admin_login.json()['data']['token']}"}

        # Attempt to deactivate the only active admin
        toggle_res = await client.patch(f"/api/admin/users/{admin_id}/toggle-active", headers=admin_headers)
        assert toggle_res.status_code == 400
        assert "Security Lock: Cannot deactivate the last active administrator" in toggle_res.json()["detail"]

@pytest.mark.asyncio
async def test_kitchen_state_machine_rigid_progression():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        staff_login = await client.post("/api/auth/login", json={
            "identifier": "staff",
            "password": "Staff@123"
        })
        staff_headers = {"Authorization": f"Bearer {staff_login.json()['data']['token']}"}

        # Check kitchen feed
        feed_res = await client.get("/api/kitchen/feed", headers=staff_headers)
        assert feed_res.status_code == 200
        orders = feed_res.json()["orders"]
        if orders:
            target_order = orders[0]
            oid = target_order["id"]

            # If order is placed, staff can accept it
            if target_order["order_status"] == "placed":
                t1 = await client.post("/api/kitchen/transition", json={
                    "order_id": oid,
                    "new_status": "accepted"
                }, headers=staff_headers)
                assert t1.status_code == 200
                assert t1.json()["data"]["new_status"] == "accepted"

                # Cannot jump directly to collected (must follow state machine)
                invalid_jump = await client.post("/api/kitchen/transition", json={
                    "order_id": oid,
                    "new_status": "collected"
                }, headers=staff_headers)
                assert invalid_jump.status_code == 400

@pytest.mark.asyncio
async def test_ai_insights_query():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        admin_login = await client.post("/api/auth/login", json={
            "identifier": "admin",
            "password": "Admin@123"
        })
        admin_headers = {"Authorization": f"Bearer {admin_login.json()['data']['token']}"}

        ai_res = await client.post("/api/ai/query", json={
            "query": "Summarize operational performance and menu health",
            "date_range": "7days"
        }, headers=admin_headers)
        assert ai_res.status_code == 200
        data = ai_res.json()["data"]["insights"]
        assert "summary" in data
        assert len(data["key_observations"]) > 0
        assert "sales_summary" in data["supporting_metrics"]
        assert "catalog_status" in data["supporting_metrics"]
