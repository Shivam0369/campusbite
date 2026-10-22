import urllib.request
import urllib.parse
import json
import http.cookiejar

cookie_jar = http.cookiejar.CookieJar()
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cookie_jar))

BASE_URL = "http://localhost:8000/api"

def api_call(path, method="GET", data=None):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"}
    body = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with opener.open(req) as resp:
            return json.loads(resp.read().decode("utf-8")), resp.status
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        try:
            return json.loads(err_body), e.code
        except:
            return {"error": err_body}, e.code

print("=== 1. TEST LOGIN AS STAFF ===")
res, status = api_call("/auth/login", method="POST", data={"identifier": "staff", "password": "Staff@123"})
assert status == 200, f"Staff login failed: {res}"
print(f"Staff login successful: role={res['data']['user']['role']}, name={res['data']['user']['full_name']}")

print("=== 2. TEST KITCHEN FEED ===")
feed, status = api_call("/kitchen/feed?status_filter=all")
assert status == 200, f"Kitchen feed failed: {feed}"
print(f"Kitchen feed successful: {feed['count']} orders found, server_time={feed['server_time']}")

print("=== 3. TEST PROFILE ME ===")
me, status = api_call("/auth/me")
assert status == 200 and me['data']['user']['username'] == 'staff'
print(f"Staff profile retrieved: {me['data']['user']['full_name']}")

print("=== 4. TEST LOGIN AS CUSTOMER (RAHUL) ===")
# Clear cookies for new login
cookie_jar.clear()
res, status = api_call("/auth/login", method="POST", data={"identifier": "rahul", "password": "Demo@123"})
assert status == 200, f"Customer login failed: {res}"
print(f"Customer login successful: role={res['data']['user']['role']}")

print("=== 5. TEST CART & CHECKOUT FLOW ===")
# Add item 1 (Masala Dosa)
cart_res, status = api_call("/cart", method="POST", data={"action": "add", "menu_item_id": 1, "quantity": 2})
assert status == 200, f"Add to cart failed: {cart_res}"
print(f"Cart updated: count={cart_res['data']['cart_count']}, total={cart_res['data']['total']}")

checkout_res, status = api_call("/orders/checkout", method="POST", data={
    "customer_name": "Rahul Sharma",
    "customer_phone": "9876543212",
    "payment_method": "upi",
    "notes": "Extra crispy dosa please!"
})
assert status == 200, f"Checkout failed: {checkout_res}"
order_id = checkout_res['data']['order_id']
order_num = checkout_res['data']['order_number']
print(f"Order placed successfully: #{order_num} (ID: {order_id})")

print("=== 6. TEST KITCHEN TRANSITION AS STAFF ===")
cookie_jar.clear()
api_call("/auth/login", method="POST", data={"identifier": "staff", "password": "Staff@123"})

for next_status in ["accepted", "preparing", "ready", "collected"]:
    t_res, status = api_call("/kitchen/transition", method="POST", data={
        "order_id": order_id,
        "new_status": next_status,
        "notes": f"Moved to {next_status} by kitchen chef",
        "mark_paid": True if next_status == "collected" else False
    })
    assert status == 200, f"Transition to {next_status} failed: {t_res}"
    print(f"  -> Successfully transitioned to: {next_status}")

print("=== 7. VERIFY ORDER TIMELINE AS CUSTOMER ===")
cookie_jar.clear()
api_call("/auth/login", method="POST", data={"identifier": "rahul", "password": "Demo@123"})
order_detail, status = api_call(f"/orders/{order_id}")
assert status == 200
history = order_detail['data']['order']['status_history']
print(f"Order #{order_num} final status: {order_detail['data']['order']['order_status']}")
print(f"Status history count: {len(history)} entries")
for h in history:
    print(f"  - [{h['created_at'][:19]}] {h['old_status']} -> {h['new_status']} (by {h['changed_by_name']})")

print("\nALL BACKEND API & BUSINESS FLOWS VERIFIED SUCCESSFULLY!")
