import os

DISHE_LIST = [
    # Indian
    ('veg-thali', 'Veg Thali', '#d97706', '#92400e', '🍽️', 'Traditional Indian Platter'),
    ('paneer-butter-masala', 'Paneer Butter Masala', '#ea580c', '#9a3412', '🍲', 'Rich Creamy Curry'),
    ('chole-bhature', 'Chole Bhature', '#ca8a04', '#854d0e', '🫓', 'Spiced Chickpeas & Bhature'),
    ('masala-dosa', 'Masala Dosa', '#d97706', '#b45309', '🥞', 'Crispy South Indian Dosa'),
    ('rajma-chawal', 'Rajma Chawal', '#dc2626', '#991b1b', '🍛', 'Punjabi Kidney Beans & Rice'),
    ('chicken-biryani', 'Chicken Biryani', '#b45309', '#78350f', '🍗', 'Aromatic Spiced Dum Biryani'),
    ('butter-chicken', 'Butter Chicken', '#c2410c', '#7c2d12', '🥘', 'Makhani Gravy & Naan'),

    # Chinese
    ('veg-fried-rice', 'Veg Fried Rice', '#059669', '#065f46', '🍚', 'Wok Tossed Fragrant Rice'),
    ('hakka-noodles', 'Hakka Noodles', '#d97706', '#b45309', '🍜', 'Stir-fried Indo-Chinese Noodles'),
    ('veg-manchurian', 'Veg Manchurian', '#b91c1c', '#7f1d1d', '🧆', 'Tangy Indo-Chinese Gravy'),
    ('veg-momos', 'Veg Momos', '#10b981', '#047857', '🥟', 'Steamed Dumplings & Chutney'),
    ('chicken-fried-rice', 'Chicken Fried Rice', '#d97706', '#92400e', '🍗', 'Wok Tossed with Chicken'),
    ('chicken-noodles', 'Chicken Noodles', '#ea580c', '#9a3412', '🍜', 'Spicy Shredded Chicken Noodles'),
    ('chicken-momos', 'Chicken Momos', '#dc2626', '#991b1b', '🥟', 'Steamed Chicken Dumplings'),

    # Fast Food
    ('aloo-tikki-burger', 'Aloo Tikki Burger', '#f59e0b', '#b45309', '🍔', 'Crispy Patty & Fresh Veggies'),
    ('cheese-sandwich', 'Cheese Sandwich', '#eab308', '#a16207', '🥪', 'Toasted Melted Cheese'),
    ('french-fries', 'French Fries', '#eab308', '#ca8a04', '🍟', 'Crispy Golden Potato Fries'),
    ('veg-pizza', 'Veg Pizza', '#ef4444', '#b91c1c', '🍕', 'Loaded Veggies & Mozzarella'),
    ('chicken-burger', 'Chicken Burger', '#d97706', '#92400e', '🍔', 'Juicy Crispy Chicken Patty'),

    # Snacks
    ('samosa', 'Samosa (2 pcs)', '#d97706', '#92400e', '🥟', 'Golden Crispy Potato Pastry'),
    ('pav-bhaji', 'Pav Bhaji', '#ea580c', '#9a3412', '🍞', 'Mashed Spiced Veggies & Butter Pav'),
    ('spring-rolls', 'Spring Rolls', '#f59e0b', '#b45309', '🥢', 'Crispy Vegetable Rolls'),
    ('chicken-tikka', 'Chicken Tikka', '#dc2626', '#991b1b', '🍢', 'Charcoal Grilled Skewers'),

    # Beverages
    ('cold-coffee', 'Cold Coffee', '#78350f', '#451a03', '🧋', 'Chilled Creamy Blend'),
    ('mango-shake', 'Mango Shake', '#f59e0b', '#d97706', '🥭', 'Fresh Seasonal Mango Blend'),
    ('lime-soda', 'Fresh Lime Soda', '#10b981', '#047857', '🍋', 'Refreshing Chilled Soda'),
    ('masala-chai', 'Masala Chai', '#b45309', '#78350f', '☕', 'Hot Spiced Indian Tea'),

    # Desserts
    ('gulab-jamun', 'Gulab Jamun (2 pcs)', '#78350f', '#451a03', '🍯', 'Warm Milk Dumplings in Syrup'),
    ('ice-cream', 'Ice Cream', '#ec4899', '#be185d', '🍨', 'Rich Creamy Scoop'),
    ('rasmalai', 'Rasmalai', '#ca8a04', '#854d0e', '🥛', 'Soft Patties in Saffron Milk'),
    ('brownie-icecream', 'Brownie with Ice Cream', '#451a03', '#1e0a02', '🍫', 'Warm Chocolate & Vanilla Scoop')
]

def generate_svg(slug, title, c1, c2, emoji, desc):
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 280" width="100%" height="100%">
  <defs>
    <linearGradient id="grad-{slug}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="{c1}"/>
      <stop offset="100%" stop-color="{c2}"/>
    </linearGradient>
    <filter id="shadow-{slug}" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-opacity="0.25"/>
    </filter>
  </defs>
  <rect width="400" height="280" fill="url(#grad-{slug})"/>
  <circle cx="200" cy="115" r="68" fill="#ffffff" opacity="0.95" filter="url(#shadow-{slug})"/>
  <circle cx="200" cy="115" r="56" fill="none" stroke="{c1}" stroke-width="2.5" stroke-dasharray="5,3"/>
  <text x="200" y="132" font-size="54" text-anchor="middle">{emoji}</text>
  <text x="200" y="218" font-family="'Outfit', sans-serif, system-ui" font-weight="700" font-size="18" fill="#ffffff" text-anchor="middle" letter-spacing="0.5">{title}</text>
  <text x="200" y="240" font-family="'Inter', sans-serif, system-ui" font-size="12" fill="rgba(255,255,255,0.85)" text-anchor="middle">{desc}</text>
</svg>"""

DEFAULT_FOOD_SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="100%" height="100%">
  <defs>
    <linearGradient id="foodGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#b45309"/>
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-opacity="0.15"/>
    </filter>
  </defs>
  <rect width="400" height="300" fill="url(#foodGrad)"/>
  <circle cx="200" cy="130" r="75" fill="#ffffff" opacity="0.95" filter="url(#shadow)"/>
  <circle cx="200" cy="130" r="62" fill="none" stroke="#d97706" stroke-width="3" stroke-dasharray="6,4"/>
  <!-- Cloche / Plate icon -->
  <path d="M 160 145 C 160 110 240 110 240 145 Z" fill="#b45309"/>
  <circle cx="200" cy="106" r="6" fill="#b45309"/>
  <rect x="150" y="148" width="100" height="6" rx="3" fill="#92400e"/>
  <text x="200" y="240" font-family="'Outfit', sans-serif, system-ui" font-weight="700" font-size="20" fill="#ffffff" text-anchor="middle" letter-spacing="1">CAMPUSBITE SPECIAL</text>
  <text x="200" y="262" font-family="'Inter', sans-serif, system-ui" font-size="12" fill="#fef3c7" text-anchor="middle">Freshly Prepared at Counter</text>
</svg>"""

def main():
    target_dirs = [
        os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "public", "assets", "images", "food"),
        os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "public", "food"),
        os.path.join(os.path.dirname(__file__), "..", "uploads", "food")
    ]

    for d in target_dirs:
        os.makedirs(d, exist_ok=True)
        # default
        with open(os.path.join(d, "default-food.svg"), "w", encoding="utf-8") as f:
            f.write(DEFAULT_FOOD_SVG)
        for slug, title, c1, c2, emoji, desc in DISHE_LIST:
            content = generate_svg(slug, title, c1, c2, emoji, desc)
            with open(os.path.join(d, f"{slug}.svg"), "w", encoding="utf-8") as f:
                f.write(content)
        print(f"Generated {len(DISHE_LIST)} dish SVGs in {d}")

if __name__ == "__main__":
    main()

