from typing import Optional, List
from datetime import datetime, date
from decimal import Decimal, ROUND_HALF_UP
import json
from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from sqlalchemy import select, func, desc
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.session import get_db
from app.models.entities import (
    Order, OrderItem, Payment, OrderStatusHistory, MenuItem,
    Setting, User, OrderStatus, PaymentMethod, PaymentStatus
)
from app.api.deps import get_current_user, require_customer
from app.api.cart import get_raw_cart, set_raw_cart, calculate_cart_details
from app.schemas import (
    CheckoutRequest, OrderDetailResponse, OrderItemResponse,
    OrderStatusHistoryResponse, ResponseModel
)

router = APIRouter(prefix="/orders", tags=["Orders"])

async def generate_order_number(db: AsyncSession) -> str:
    # Prefix from settings (default CB)
    prefix_stmt = select(Setting).where(Setting.setting_key == "order_prefix")
    prefix_res = (await db.execute(prefix_stmt)).scalar_one_or_none()
    prefix = prefix_res.setting_value if prefix_res and prefix_res.setting_value else "CB"

    today_str = datetime.now().strftime("%y%m%d")
    today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)

    # Count orders created today for sequence
    count_stmt = select(func.count(Order.id)).where(Order.created_at >= today_start)
    today_count = (await db.execute(count_stmt)).scalar_one() or 0
    seq = today_count + 1

    return f"{prefix}{today_str}{str(seq).zfill(4)}"

@router.post("/checkout", response_model=ResponseModel)
async def checkout(
    payload: CheckoutRequest,
    request: Request,
    response: Response,
    current_user: User = Depends(require_customer),
    db: AsyncSession = Depends(get_db)
):
    raw_cart = get_raw_cart(request)
    if not raw_cart:
        raise HTTPException(status_code=400, detail="Your cart is empty.")

    # 1. Zero Client Trust: Fetch live items from DB
    item_ids = [int(k) for k in raw_cart.keys() if k.isdigit()]
    stmt = select(MenuItem).where(MenuItem.id.in_(item_ids), MenuItem.is_active == 1)
    res = await db.execute(stmt)
    db_items = {item.id: item for item in res.scalars().all()}

    if not db_items:
        raise HTTPException(status_code=400, detail="No active items found in cart.")

    # Check stock availability
    for iid, qty in raw_cart.items():
        item = db_items.get(int(iid))
        if not item or item.is_available != 1:
            item_name = item.name if item else f"Item #{iid}"
            raise HTTPException(status_code=400, detail=f"'{item_name}' is currently unavailable. Please remove it from your cart.")

    # Fetch tax rate from settings
    tax_stmt = select(Setting).where(Setting.setting_key == "tax_percent")
    tax_res = (await db.execute(tax_stmt)).scalar_one_or_none()
    try:
        tax_percent = Decimal(tax_res.setting_value) if tax_res and tax_res.setting_value else Decimal(str(settings.DEFAULT_TAX_PERCENT))
    except Exception:
        tax_percent = Decimal(str(settings.DEFAULT_TAX_PERCENT))

    # Calculate line totals & subtotal
    subtotal = Decimal("0.00")
    order_items_to_create = []

    for iid_str, qty in raw_cart.items():
        iid = int(iid_str)
        item = db_items[iid]
        clamped_qty = max(1, min(20, qty))
        line_total = (item.price * clamped_qty).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        subtotal += line_total

        # Invariant: Immutable accounting snapshots
        order_items_to_create.append({
            "menu_item_id": item.id,
            "item_name_snapshot": item.name,
            "unit_price": item.price,
            "quantity": clamped_qty,
            "line_total": line_total
        })

    tax_amount = ((subtotal * tax_percent) / Decimal("100.00")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    total_amount = (subtotal + tax_amount).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    # Invariant: ACID Transactional Integrity
    try:
        order_num = await generate_order_number(db)
        new_order = Order(
            order_number=order_num,
            user_id=current_user.id,
            customer_name_snapshot=payload.customer_name.strip(),
            customer_phone_snapshot=payload.customer_phone.strip() if payload.customer_phone else current_user.phone,
            subtotal=subtotal,
            discount_amount=Decimal("0.00"),
            tax_amount=tax_amount,
            total_amount=total_amount,
            payment_method=payload.payment_method,
            payment_status=PaymentStatus.PENDING.value,
            order_status=OrderStatus.PLACED.value,
            notes=payload.notes.strip() if payload.notes else None
        )
        db.add(new_order)
        await db.flush()  # to obtain new_order.id

        # Insert order items
        for oi in order_items_to_create:
            item_entity = OrderItem(
                order_id=new_order.id,
                menu_item_id=oi["menu_item_id"],
                item_name_snapshot=oi["item_name_snapshot"],
                unit_price=oi["unit_price"],
                quantity=oi["quantity"],
                line_total=oi["line_total"]
            )
            db.add(item_entity)

        # Insert payment record
        new_payment = Payment(
            order_id=new_order.id,
            payment_reference=f"TXN-{order_num}",
            payment_method=payload.payment_method,
            amount=total_amount,
            payment_status=PaymentStatus.PENDING.value
        )
        db.add(new_payment)

        # Insert initial status history audit
        new_history = OrderStatusHistory(
            order_id=new_order.id,
            old_status=None,
            new_status=OrderStatus.PLACED.value,
            changed_by=current_user.id,
            notes="Order placed by customer at counter checkout."
        )
        db.add(new_history)

        await db.commit()
        await db.refresh(new_order)

        # Clear cart on successful order placement
        set_raw_cart(response, {})

        return ResponseModel(
            success=True,
            message="Order placed successfully!",
            data={
                "order_id": new_order.id,
                "order_number": new_order.order_number,
                "total_amount": float(new_order.total_amount),
            }
        )
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Order placement failed: {str(e)}"
        )

@router.get("/my-orders", response_model=ResponseModel)
async def get_my_orders(
    current_user: User = Depends(require_customer),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.user_id == current_user.id)
        .order_by(Order.created_at.desc())
    )
    res = await db.execute(stmt)
    orders = res.scalars().all()

    orders_data = []
    for o in orders:
        ord_dict = OrderDetailResponse.model_validate(o).model_dump()
        ord_dict["items"] = [OrderItemResponse.model_validate(i).model_dump() for i in o.items]
        orders_data.append(ord_dict)

    return ResponseModel(
        success=True,
        data={"orders": orders_data}
    )

@router.get("/{order_id}", response_model=ResponseModel)
async def get_order_details(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(Order)
        .options(
            selectinload(Order.items),
            selectinload(Order.status_history)
        )
        .where(Order.id == order_id)
    )
    res = await db.execute(stmt)
    order = res.scalar_one_or_none()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")

    # Authorization check: customer can only view own order; staff/admin can view any
    if current_user.role == "customer" and order.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied.")

    ord_dict = OrderDetailResponse.model_validate(order).model_dump()
    ord_dict["items"] = [OrderItemResponse.model_validate(i).model_dump() for i in order.items]
    ord_dict["status_history"] = [
        OrderStatusHistoryResponse.model_validate(h).model_dump() for h in order.status_history
    ]

    return ResponseModel(
        success=True,
        data={"order": ord_dict}
    )

@router.get("/{order_id}/status", response_model=ResponseModel)
async def get_order_status_poll(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Order.id, Order.order_number, Order.order_status, Order.payment_status, Order.user_id).where(Order.id == order_id)
    res = (await db.execute(stmt)).first()

    if not res:
        raise HTTPException(status_code=404, detail="Order not found.")

    if current_user.role == "customer" and res.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied.")

    return ResponseModel(
        success=True,
        data={
            "order_id": res.id,
            "order_number": res.order_number,
            "order_status": res.order_status,
            "payment_status": res.payment_status
        }
    )

@router.post("/{order_id}/cancel", response_model=ResponseModel)
async def cancel_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Order).where(Order.id == order_id)
    order = (await db.execute(stmt)).scalar_one_or_none()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")

    # Authorization
    if current_user.role == "customer" and order.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied.")

    # Invariant: Cancellation rule - only allowed when order is 'placed'
    if order.order_status != OrderStatus.PLACED.value and current_user.role != "admin":
        raise HTTPException(
            status_code=400,
            detail="Order cannot be cancelled once accepted or preparing by the kitchen."
        )

    old_status = order.order_status
    order.order_status = OrderStatus.CANCELLED.value
    order.updated_at = datetime.now()

    # Log transition in audit history
    audit = OrderStatusHistory(
        order_id=order.id,
        old_status=old_status,
        new_status=OrderStatus.CANCELLED.value,
        changed_by=current_user.id,
        notes=f"Cancelled by {current_user.role} ({current_user.full_name})."
    )
    db.add(audit)
    await db.commit()

    return ResponseModel(
        success=True,
        message=f"Order #{order.order_number} has been cancelled."
    )

@router.post("/{order_id}/reorder", response_model=ResponseModel)
async def reorder(
    order_id: int,
    request: Request,
    response: Response,
    current_user: User = Depends(require_customer),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Order).options(selectinload(Order.items)).where(Order.id == order_id)
    order = (await db.execute(stmt)).scalar_one_or_none()

    if not order or (current_user.role == "customer" and order.user_id != current_user.id):
        raise HTTPException(status_code=404, detail="Order not found.")

    raw_cart = get_raw_cart(request)
    added_count = 0
    skipped = []

    # Check current item availability
    item_ids = [item.menu_item_id for item in order.items]
    items_stmt = select(MenuItem).where(MenuItem.id.in_(item_ids))
    db_items = {item.id: item for item in (await db.execute(items_stmt)).scalars().all()}

    for item in order.items:
        db_item = db_items.get(item.menu_item_id)
        if db_item and db_item.is_active == 1 and db_item.is_available == 1:
            current_q = raw_cart.get(str(item.menu_item_id), 0)
            raw_cart[str(item.menu_item_id)] = min(20, current_q + item.quantity)
            added_count += 1
        else:
            skipped.append(item.item_name_snapshot)

    set_raw_cart(response, raw_cart)

    msg = f"Added {added_count} items to your cart."
    if skipped:
        msg += f" Note: {', '.join(skipped)} was skipped as it is currently out of stock."

    return ResponseModel(
        success=True,
        message=msg
    )

