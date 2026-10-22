from typing import Optional, Dict
from decimal import Decimal, ROUND_HALF_UP
import json
from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.session import get_db
from app.models.entities import MenuItem, Setting, User
from app.api.deps import get_current_user_optional, require_customer
from app.schemas import CartActionRequest, CartResponse, CartItem, ResponseModel

router = APIRouter(prefix="/cart", tags=["Cart"])

CART_COOKIE_NAME = "campusbite_cart"

def get_raw_cart(request: Request) -> Dict[str, int]:
    cart_json = request.cookies.get(CART_COOKIE_NAME)
    if not cart_json:
        return {}
    try:
        data = json.loads(cart_json)
        if isinstance(data, dict):
            return {str(k): int(v) for k, v in data.items() if int(v) > 0}
        return {}
    except Exception:
        return {}

def set_raw_cart(response: Response, cart: Dict[str, int]):
    response.set_cookie(
        key=CART_COOKIE_NAME,
        value=json.dumps(cart),
        max_age=settings.SESSION_MAX_AGE_SECONDS,
        httponly=False,  # Accessible to frontend for fast optimistic sync
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        path="/"
    )

async def calculate_cart_details(raw_cart: Dict[str, int], db: AsyncSession) -> CartResponse:
    if not raw_cart:
        return CartResponse(
            items=[],
            cart_count=0,
            subtotal=Decimal("0.00"),
            tax_percent=Decimal(str(settings.DEFAULT_TAX_PERCENT)),
            tax_amount=Decimal("0.00"),
            total=Decimal("0.00")
        )

    item_ids = [int(k) for k in raw_cart.keys() if k.isdigit()]
    if not item_ids:
        return CartResponse(
            items=[],
            cart_count=0,
            subtotal=Decimal("0.00"),
            tax_percent=Decimal(str(settings.DEFAULT_TAX_PERCENT)),
            tax_amount=Decimal("0.00"),
            total=Decimal("0.00")
        )

    stmt = select(MenuItem).where(MenuItem.id.in_(item_ids), MenuItem.is_active == 1)
    res = await db.execute(stmt)
    db_items = {item.id: item for item in res.scalars().all()}

    # Fetch tax rate from settings
    tax_stmt = select(Setting).where(Setting.setting_key == "tax_percent")
    tax_res = (await db.execute(tax_stmt)).scalar_one_or_none()
    try:
        tax_percent = Decimal(tax_res.setting_value) if tax_res and tax_res.setting_value else Decimal(str(settings.DEFAULT_TAX_PERCENT))
    except Exception:
        tax_percent = Decimal(str(settings.DEFAULT_TAX_PERCENT))

    cart_items = []
    subtotal = Decimal("0.00")
    total_qty = 0

    for item_id_str, qty in raw_cart.items():
        if not item_id_str.isdigit():
            continue
        iid = int(item_id_str)
        if iid not in db_items:
            continue
        item = db_items[iid]
        # Invariant: Clamp quantity between 1 and 20
        clamped_qty = max(1, min(20, qty))
        line_total = (item.price * clamped_qty).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        subtotal += line_total
        total_qty += clamped_qty

        cart_items.append(CartItem(
            menu_item_id=item.id,
            name=item.name,
            price=item.price,
            quantity=clamped_qty,
            line_total=line_total,
            image_path=item.image_path,
            food_type=item.food_type,
            is_available=item.is_available
        ))

    tax_amount = ((subtotal * tax_percent) / Decimal("100.00")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    total = (subtotal + tax_amount).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    return CartResponse(
        items=cart_items,
        cart_count=total_qty,
        subtotal=subtotal,
        tax_percent=tax_percent,
        tax_amount=tax_amount,
        total=total
    )

@router.get("", response_model=ResponseModel)
async def get_cart(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    raw_cart = get_raw_cart(request)
    details = await calculate_cart_details(raw_cart, db)
    return ResponseModel(
        success=True,
        data=details.model_dump()
    )

@router.post("", response_model=ResponseModel)
async def handle_cart_action(
    payload: CartActionRequest,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    raw_cart = get_raw_cart(request)
    action = payload.action.lower()

    if action == "clear":
        raw_cart.clear()
        set_raw_cart(response, raw_cart)
        details = await calculate_cart_details(raw_cart, db)
        return ResponseModel(success=True, message="Cart cleared.", data=details.model_dump())

    if not payload.menu_item_id:
        raise HTTPException(status_code=400, detail="menu_item_id is required.")

    item_id_str = str(payload.menu_item_id)

    # Verify menu item exists and is available
    stmt = select(MenuItem).where(MenuItem.id == payload.menu_item_id, MenuItem.is_active == 1)
    db_item = (await db.execute(stmt)).scalar_one_or_none()
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found.")

    if action == "add":
        if db_item.is_available != 1:
            raise HTTPException(status_code=400, detail=f"'{db_item.name}' is currently unavailable.")
        add_qty = payload.quantity or 1
        current_qty = raw_cart.get(item_id_str, 0)
        new_qty = min(20, current_qty + add_qty)
        raw_cart[item_id_str] = new_qty
        msg = f"{db_item.name} added to cart."

    elif action == "update":
        new_qty = payload.quantity if payload.quantity is not None else 1
        if new_qty <= 0:
            raw_cart.pop(item_id_str, None)
            msg = f"{db_item.name} removed from cart."
        else:
            raw_cart[item_id_str] = min(20, max(1, new_qty))
            msg = f"{db_item.name} quantity updated."

    elif action == "remove":
        raw_cart.pop(item_id_str, None)
        msg = f"{db_item.name} removed from cart."

    else:
        raise HTTPException(status_code=400, detail=f"Invalid action '{action}'.")

    set_raw_cart(response, raw_cart)
    details = await calculate_cart_details(raw_cart, db)

    return ResponseModel(
        success=True,
        message=msg,
        data=details.model_dump()
    )

