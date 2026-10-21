import urllib.request
import re

routes = ["/", "/menu", "/staff", "/profile", "/cart", "/my-orders", "/login", "/admin"]
all_ok = True

for r in routes:
    url = f"http://localhost:3000{r}"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    res = urllib.request.urlopen(req)
    html = res.read().decode("utf-8")
    
    matches = re.findall(r'(?:href|src)=["\'](/_next/[^"\']+)["\']', html)
    failed = 0
    for asset in matches:
        asset_url = f"http://localhost:3000{asset}"
        try:
            a_res = urllib.request.urlopen(urllib.request.Request(asset_url))
            if a_res.status != 200:
                print(f"FAILED {a_res.status}: {asset}")
                failed += 1
                all_ok = False
        except Exception as e:
            print(f"ERROR: {asset} -> {e}")
            failed += 1
            all_ok = False
            
    print(f"Route {r:15}: {res.status} OK | {len(matches)} static assets checked | {failed} failed")

if all_ok:
    print("ALL STATIC ASSETS LOADED WITH HTTP 200 OK! Zero 404s!")
else:
    print("WARNING: Some assets failed to load.")

