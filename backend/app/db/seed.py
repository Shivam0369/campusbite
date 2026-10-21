import asyncio
from decimal import Decimal
from datetime import datetime
from sqlalchemy import select
from app.core.security import get_password_hash
from app.db.session import AsyncSessionLocal
from app.models.entities import User, UserRole, Category, MenuItem, FoodType, Setting

DEFAULT_SETTINGS = [
    ("site_name", "CampusBite"),
    ("tax_percent", "5"),
    ("currency_symbol", "₹"),
    ("order_prefix", "CB"),
    ("allow_cancel_before", "accepted"),
    ("upi_id", "campusbite@upi"),
    ("upi_qr_placeholder", "1"),
]

DEMO_USERS = [
    {
        "full_name": "Admin User",
        "username": "admin",
        "email": "admin@campusbite.com",
        "phone": "9876543210",
        "password": "Admin@123",
        "role": UserRole.ADMIN.value,
        "is_active": 1,
    },
    {
        "full_name": "Kitchen Staff",
        "username": "staff",
        "email": "staff@campusbite.com",
        "phone": "9876543211",
        "password": "Staff@123",
        "role": UserRole.STAFF.value,
        "is_active": 1,
    },
    {
        "full_name": "Rahul Sharma",
        "username": "rahul",
        "email": "rahul@college.edu",
        "phone": "9876543212",
        "password": "Demo@123",
        "role": UserRole.CUSTOMER.value,
        "is_active": 1,
    },
]

CATEGORIES = [
    {
        "name": "Indian",
        "slug": "indian",
        "description": "Traditional Indian thalis, curries, parathas and rice dishes",
        "icon": "fa-bowl-food",
        "sort_order": 1,
        "is_active": 1,
    },
    {
        "name": "Chinese",
        "slug": "chinese",
        "description": "Indo-Chinese noodles, fried rice, momos and Manchurian",
        "icon": "fa-fire-burner",
        "sort_order": 2,
        "is_active": 1,
    },
    {
        "name": "Fast Food",
        "slug": "fast-food",
        "description": "Burgers, pizza, sandwiches and fries",
        "icon": "fa-burger",
        "sort_order": 3,
        "is_active": 1,
    },
    {
        "name": "Snacks",
        "slug": "snacks",
        "description": "Quick bites, chaats and light snacks",
        "icon": "fa-cookie-bite",
        "sort_order": 4,
        "is_active": 1,
    },
    {
        "name": "Beverages",
        "slug": "beverages",
        "description": "Cold coffee, shakes, juices and hot beverages",
        "icon": "fa-mug-hot",
        "sort_order": 5,
        "is_active": 1,
    },
    {
        "name": "Desserts",
        "slug": "desserts",
        "description": "Sweet treats, ice cream and traditional Indian desserts",
        "icon": "fa-ice-cream",
        "sort_order": 6,
        "is_active": 1,
    },
]

MENU_ITEMS = [
    # Indian
    ("indian", "Veg Thali", "Complete meal with dal, sabzi, roti, rice, salad and papad", Decimal("120.00"), FoodType.VEG.value, "food/veg-thali.svg", 1, 20),
    ("indian", "Paneer Butter Masala", "Rich and creamy paneer in tomato-butter gravy, served with 2 naan", Decimal("160.00"), FoodType.VEG.value, "food/paneer-butter-masala.svg", 1, 18),
    ("indian", "Chole Bhature", "Spicy chickpea curry with deep-fried fluffy bhature", Decimal("100.00"), FoodType.VEG.value, "food/chole-bhature.svg", 1, 15),
    ("indian", "Masala Dosa", "Crispy South Indian dosa filled with spiced potato filling", Decimal("90.00"), FoodType.VEG.value, "food/masala-dosa.svg", 1, 12),
    ("indian", "Rajma Chawal", "Punjabi kidney bean curry served with steamed basmati rice", Decimal("110.00"), FoodType.VEG.value, "food/rajma-chawal.svg", 1, 18),
    ("indian", "Chicken Biryani", "Aromatic basmati rice layered with spiced chicken, served with raita", Decimal("180.00"), FoodType.NON_VEG.value, "food/chicken-biryani.svg", 1, 25),
    ("indian", "Butter Chicken", "Tender chicken pieces in creamy tomato-butter sauce with naan", Decimal("190.00"), FoodType.NON_VEG.value, "food/butter-chicken.svg", 1, 20),

    # Chinese
    ("chinese", "Veg Fried Rice", "Wok-tossed rice with mixed vegetables and soy sauce", Decimal("100.00"), FoodType.VEG.value, "food/veg-fried-rice.svg", 1, 12),
    ("chinese", "Hakka Noodles", "Stir-fried noodles with vegetables in Indo-Chinese style", Decimal("90.00"), FoodType.VEG.value, "food/hakka-noodles.svg", 1, 12),
    ("chinese", "Veg Manchurian", "Crispy vegetable balls in tangy Manchurian sauce", Decimal("110.00"), FoodType.VEG.value, "food/veg-manchurian.svg", 1, 15),
    ("chinese", "Veg Momos", "Steamed dumplings stuffed with spiced vegetables, served with chutney", Decimal("80.00"), FoodType.VEG.value, "food/veg-momos.svg", 1, 15),
    ("chinese", "Chicken Fried Rice", "Wok-tossed rice with tender chicken pieces and vegetables", Decimal("130.00"), FoodType.NON_VEG.value, "food/chicken-fried-rice.svg", 1, 12),
    ("chinese", "Chicken Noodles", "Stir-fried noodles with chicken and vegetables in soy sauce", Decimal("120.00"), FoodType.NON_VEG.value, "food/chicken-noodles.svg", 1, 12),
    ("chinese", "Chicken Momos", "Steamed dumplings with spiced chicken filling, served with chutney", Decimal("100.00"), FoodType.NON_VEG.value, "food/chicken-momos.svg", 1, 15),

    # Fast Food
    ("fast-food", "Aloo Tikki Burger", "Crispy potato patty burger with lettuce, tomato and special sauce", Decimal("70.00"), FoodType.VEG.value, "food/aloo-tikki-burger.svg", 1, 10),
    ("fast-food", "Cheese Sandwich", "Grilled sandwich with melted cheese, tomato and herbs", Decimal("60.00"), FoodType.VEG.value, "food/cheese-sandwich.svg", 1, 8),
    ("fast-food", "French Fries", "Golden crispy potato fries with ketchup and seasoning", Decimal("50.00"), FoodType.VEG.value, "food/french-fries.svg", 1, 8),
    ("fast-food", "Veg Pizza", "Thin-crust pizza loaded with vegetables and mozzarella cheese", Decimal("150.00"), FoodType.VEG.value, "food/veg-pizza.svg", 1, 15),
    ("fast-food", "Chicken Burger", "Juicy chicken patty burger with cheese, lettuce and mayo", Decimal("120.00"), FoodType.NON_VEG.value, "food/chicken-burger.svg", 1, 10),

    # Snacks
    ("snacks", "Samosa (2 pcs)", "Crispy pastry filled with spiced potatoes and peas", Decimal("30.00"), FoodType.VEG.value, "food/samosa.svg", 1, 5),
    ("snacks", "Pav Bhaji", "Spiced mashed vegetables served with buttered bread rolls", Decimal("80.00"), FoodType.VEG.value, "food/pav-bhaji.svg", 1, 12),
    ("snacks", "Spring Rolls", "Crispy rolls stuffed with mixed vegetables", Decimal("70.00"), FoodType.VEG.value, "food/spring-rolls.svg", 1, 10),
    ("snacks", "Chicken Tikka", "Marinated chicken pieces grilled to perfection", Decimal("140.00"), FoodType.NON_VEG.value, "food/chicken-tikka.svg", 1, 15),

    # Beverages
    ("beverages", "Cold Coffee", "Chilled coffee blended with ice cream and milk", Decimal("60.00"), FoodType.VEG.value, "food/cold-coffee.svg", 1, 5),
    ("beverages", "Mango Shake", "Fresh mango milkshake made with seasonal mangoes", Decimal("70.00"), FoodType.VEG.value, "food/mango-shake.svg", 1, 5),
    ("beverages", "Fresh Lime Soda", "Refreshing lemon soda — sweet, salty or mixed", Decimal("40.00"), FoodType.VEG.value, "food/lime-soda.svg", 1, 3),
    ("beverages", "Masala Chai", "Hot Indian spiced tea made with fresh spices", Decimal("20.00"), FoodType.VEG.value, "food/masala-chai.svg", 1, 5),

    # Desserts
    ("desserts", "Gulab Jamun (2 pcs)", "Soft deep-fried milk dumplings soaked in sugar syrup", Decimal("50.00"), FoodType.VEG.value, "food/gulab-jamun.svg", 1, 3),
    ("desserts", "Ice Cream", "Creamy ice cream — vanilla, chocolate or butterscotch", Decimal("40.00"), FoodType.VEG.value, "food/ice-cream.svg", 1, 2),
    ("desserts", "Rasmalai", "Soft cottage cheese patties in sweetened saffron milk", Decimal("60.00"), FoodType.VEG.value, "food/rasmalai.svg", 1, 3),
    ("desserts", "Brownie with Ice Cream", "Warm chocolate brownie topped with vanilla ice cream", Decimal("90.00"), FoodType.VEG.value, "food/brownie-icecream.svg", 1, 5),
]

async def seed_database():
    print("🌱 Seeding CampusBite Database...")
    async with AsyncSessionLocal() as session:
        # 1. Settings
        for key, val in DEFAULT_SETTINGS:
            stmt = select(Setting).where(Setting.setting_key == key)
            res = await session.execute(stmt)
            if not res.scalar_one_or_none():
                session.add(Setting(setting_key=key, setting_value=val))
        await session.commit()
        print("✓ Settings seeded")

        # 2. Demo Users
        for u in DEMO_USERS:
            stmt = select(User).where(User.username == u["username"])
            res = await session.execute(stmt)
            if not res.scalar_one_or_none():
                user = User(
                    full_name=u["full_name"],
                    username=u["username"],
                    email=u["email"],
                    phone=u["phone"],
                    password_hash=get_password_hash(u["password"]),
                    role=u["role"],
                    is_active=u["is_active"],
                )
                session.add(user)
        await session.commit()
        print("✓ Demo users seeded (admin, staff, rahul)")

        # 3. Categories
        cat_map = {}
        for c in CATEGORIES:
            stmt = select(Category).where(Category.slug == c["slug"])
            res = await session.execute(stmt)
            cat = res.scalar_one_or_none()
            if not cat:
                cat = Category(
                    name=c["name"],
                    slug=c["slug"],
                    description=c["description"],
                    icon=c["icon"],
                    sort_order=c["sort_order"],
                    is_active=c["is_active"],
                )
                session.add(cat)
                await session.flush()
            cat_map[c["slug"]] = cat.id
        await session.commit()
        print("✓ Categories seeded")

        # 4. Menu Items
        for cat_slug, name, desc, price, ftype, img, is_avail, prep in MENU_ITEMS:
            cat_id = cat_map.get(cat_slug)
            if not cat_id:
                continue
            stmt = select(MenuItem).where(MenuItem.name == name)
            res = await session.execute(stmt)
            if not res.scalar_one_or_none():
                dish = MenuItem(
                    category_id=cat_id,
                    name=name,
                    description=desc,
                    price=price,
                    food_type=ftype,
                    image_path=img,
                    is_available=is_avail,
                    is_active=1,
                    preparation_time_minutes=prep,
                )
                session.add(dish)
        await session.commit()
        print("✓ Menu items seeded")

    print("🎉 Database seeding completed successfully!")

if __name__ == "__main__":
    asyncio.run(seed_database())
