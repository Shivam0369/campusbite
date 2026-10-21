import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_health_check():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["app"] == "CampusBite"

@pytest.mark.asyncio
async def test_catalog_categories_and_items():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Categories
        res = await client.get("/api/catalog/categories")
        assert res.status_code == 200
        cats = res.json()["data"]["categories"]
        assert len(cats) >= 6

        # 2. Menu items
        res_items = await client.get("/api/catalog/items")
        assert res_items.status_code == 200
        items = res_items.json()["data"]["items"]
        assert len(items) >= 30

@pytest.mark.asyncio
async def test_auth_login_demo_customer():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Customer login
        login_res = await client.post("/api/auth/login", json={
            "identifier": "rahul",
            "password": "Demo@123"
        })
        assert login_res.status_code == 200
        body = login_res.json()
        assert body["success"] is True
        assert body["data"]["user"]["username"] == "rahul"
        assert body["data"]["user"]["role"] == "customer"

@pytest.mark.asyncio
async def test_auth_login_admin_and_staff():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Admin login
        admin_res = await client.post("/api/auth/login", json={
            "identifier": "admin",
            "password": "Admin@123"
        })
        assert admin_res.status_code == 200
        assert admin_res.json()["data"]["user"]["role"] == "admin"

        # Staff login
        staff_res = await client.post("/api/auth/login", json={
            "identifier": "staff",
            "password": "Staff@123"
        })
        assert staff_res.status_code == 200
        assert staff_res.json()["data"]["user"]["role"] == "staff"

@pytest.mark.asyncio
async def test_cart_tax_and_pricing_calculation():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Add item 1 (Veg Thali, ₹120.00)
        res = await client.post("/api/cart", json={
            "action": "add",
            "menu_item_id": 1,
            "quantity": 2
        })
        assert res.status_code == 200
        cart = res.json()["data"]
        # Subtotal: 2 * 120 = 240
        assert float(cart["subtotal"]) == 240.0
        # Tax 5%: 12.0
        assert float(cart["tax_amount"]) == 12.0
        # Total: 252.0
        assert float(cart["total"]) == 252.0
