from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select, func, desc, or_
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.entities import (
    Order, OrderItem, OrderStatusHistory, Payment,
    User, OrderStatus, PaymentStatus, PaymentMethod
)
from app.api.deps import require_staff
from app.schemas import (
    KitchenFeedResponse, KitchenOrderCard, KitchenOrderItem,
    KitchenTransitionRequest, ResponseModel
)

router = APIRouter(prefix="/kitchen", tags=["Kitchen Display System"])

VALID_TRANSITIONS = {
    OrderStatus.PLACED.value: [OrderStatus.ACCEPTED.value, OrderStatus.CANCELLED.value],
    OrderStatus.ACCEPTED.value: [OrderStatus.PREPARING.value, OrderStatus.CANCELLED.value],
    OrderStatus.PREPARING.value: [OrderStatus.READY.value],
    OrderStatus.READY.value: [OrderStatus.COLLECTED.value],
    OrderStatus.COLLECTED.value: [],
    OrderStatus.CANCELLED.value: [],
}

@router.get("/feed", response_model=KitchenFeedResponse)
async def get_kitchen_feed(
    status_filter: str = Query("active"),  # active, all, placed, accepted, preparing, ready, collected
    current_user: User = Depends(require_staff),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(Order)
        .options(selectinload(Order.items))
        .order_by(Order.created_at.asc())
    )

    if status_filter == "active":
        # All orders in active stages
        stmt = stmt.where(Order.order_status.in_([
            OrderStatus.PLACED.value,
            OrderStatus.ACCEPTED.value,
            OrderStatus.PREPARING.value,
            OrderStatus.READY.value
        ]))
    elif status_filter == "collected_today":
        today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        stmt = stmt.where(Order.order_status == OrderStatus.COLLECTED.value, Order.created_at >= today_start)
    elif status_filter != "all":
        stmt = stmt.where(Order.order_status == status_filter)

    res = await db.execute(stmt)
    orders = res.scalars().all()

    now = datetime.now()
    cards: List[KitchenOrderCard] = []

    for o in orders:
        elapsed = int((now - o.created_at).total_seconds() / 60) if o.created_at else 0
        is_urgent = elapsed >= 15 and o.order_status not in [OrderStatus.COLLECTED.value, OrderStatus.CANCELLED.value]

        items_list = [
            KitchenOrderItem(
                item_name_snapshot=i.item_name_snapshot,
                quantity=i.quantity,
                unit_price=i.unit_price,
                line_total=i.line_total
            ) for i in o.items
        ]

        cards.append(KitchenOrderCard(
            id=o.id,
            order_number=o.order_number,
            customer_name_snapshot=o.customer_name_snapshot,
            customer_phone_snapshot=o.customer_phone_snapshot,
            total_amount=o.total_amount,
            total_formatted=f"₹{o.total_amount:.2f}",
            payment_method=o.payment_method,
            payment_status=o.payment_status,
            order_status=o.order_status,
            notes=o.notes,
            created_at=o.created_at,
            created_at_formatted=o.created_at.strftime("%I:%M %p") if o.created_at else "",
            elapsed_minutes=elapsed,
            is_urgent=is_urgent,
            items=items_list
        ))

    return KitchenFeedResponse(
        success=True,
        count=len(cards),
        server_time=now.strftime("%I:%M:%S %p"),
        orders=cards
    )

@router.post("/transition", response_model=ResponseModel)
async def transition_order_status(
    payload: KitchenTransitionRequest,
    current_user: User = Depends(require_staff),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Order).options(selectinload(Order.payments)).where(Order.id == payload.order_id)
    order = (await db.execute(stmt)).scalar_one_or_none()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")

    current_status = order.order_status
    target_status = payload.new_status

    # Enforce state transition rules (Admins can override, but staff must follow rigid state machine)
    allowed = VALID_TRANSITIONS.get(current_status, [])
    if current_user.role != "admin" and target_status not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid transition from '{current_status}' to '{target_status}'."
        )

    order.order_status = target_status
    order.updated_at = datetime.now()

    # If collected, set collected_at and mark cash paid if requested or default
    if target_status == OrderStatus.COLLECTED.value:
        order.collected_at = datetime.now()
        if order.payment_status == PaymentStatus.PENDING.value or payload.mark_paid:
            order.payment_status = PaymentStatus.PAID.value
            for p in order.payments:
                p.payment_status = PaymentStatus.PAID.value
                p.paid_at = datetime.now()

    # Audit history
    note = payload.notes or f"Status changed to {target_status} by kitchen staff."
    audit = OrderStatusHistory(
        order_id=order.id,
        old_status=current_status,
        new_status=target_status,
        changed_by=current_user.id,
        notes=note
    )
    db.add(audit)
    await db.commit()

    return ResponseModel(
        success=True,
        message=f"Order #{order.order_number} moved to '{target_status}'.",
        data={"order_id": order.id, "new_status": target_status}
    )

