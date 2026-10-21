from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from decimal import Decimal
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.session import get_db
from app.models.entities import Order, OrderItem, MenuItem, Category, OrderStatus, PaymentStatus, User
from app.api.deps import require_admin
from app.schemas import ResponseModel

router = APIRouter(prefix="/ai", tags=["Applied AI Operations & Sales Insights"])

class AIQuestionRequest(BaseModel):
    query: str = Field(..., min_length=3, max_length=500)
    date_range: Optional[str] = "7days"  # today, 7days, 30days, all

class AIInsightsResponse(BaseModel):
    summary: str
    key_observations: List[str]
    supporting_metrics: Dict[str, Any]
    limitations: List[str]
    recommended_follow_up_questions: List[str]
    generated_at: str
    is_live_provider: bool

# --- Deterministic Grounding Tools (Strictly Read-Only) ---

async def tool_get_sales_summary(db: AsyncSession, start_dt: datetime, end_dt: datetime) -> Dict[str, Any]:
    stmt = (
        select(
            func.count(Order.id).label("total_orders"),
            func.sum(Order.total_amount).filter(Order.payment_status == PaymentStatus.PAID.value).label("paid_revenue"),
            func.count(Order.id).filter(Order.order_status == OrderStatus.COLLECTED.value).label("completed_orders"),
            func.count(Order.id).filter(Order.order_status == OrderStatus.CANCELLED.value).label("cancelled_orders")
        )
        .where(Order.created_at.between(start_dt, end_dt))
    )
    row = (await db.execute(stmt)).first()
    total_orders = row.total_orders or 0
    paid_revenue = float(row.paid_revenue or Decimal("0.00"))
    completed_orders = row.completed_orders or 0
    cancelled_orders = row.cancelled_orders or 0
    aov = round(paid_revenue / total_orders, 2) if total_orders > 0 else 0.0

    return {
        "period_start": start_dt.strftime("%Y-%m-%d"),
        "period_end": end_dt.strftime("%Y-%m-%d"),
        "total_orders": total_orders,
        "paid_revenue_inr": paid_revenue,
        "completed_orders": completed_orders,
        "cancelled_orders": cancelled_orders,
        "average_order_value_inr": aov,
    }

async def tool_get_top_selling_items(db: AsyncSession, start_dt: datetime, end_dt: datetime, limit: int = 5) -> List[Dict[str, Any]]:
    stmt = (
        select(
            OrderItem.item_name_snapshot,
            func.sum(OrderItem.quantity).label("total_quantity"),
            func.sum(OrderItem.line_total).label("total_revenue")
        )
        .join(Order, Order.id == OrderItem.order_id)
        .where(Order.created_at.between(start_dt, end_dt))
        .where(Order.order_status != OrderStatus.CANCELLED.value)
        .group_by(OrderItem.item_name_snapshot)
        .order_by(desc("total_quantity"))
        .limit(limit)
    )
    rows = (await db.execute(stmt)).all()
    return [
        {
            "dish_name": r[0],
            "units_sold": int(r[1]),
            "revenue_inr": float(r[2])
        }
        for r in rows
    ]

async def tool_get_order_status_counts(db: AsyncSession, start_dt: datetime, end_dt: datetime) -> Dict[str, int]:
    stmt = (
        select(Order.order_status, func.count(Order.id))
        .where(Order.created_at.between(start_dt, end_dt))
        .group_by(Order.order_status)
    )
    rows = (await db.execute(stmt)).all()
    return {r[0]: int(r[1]) for r in rows}

async def tool_get_menu_availability_summary(db: AsyncSession) -> Dict[str, Any]:
    stmt = (
        select(
            func.count(MenuItem.id).label("total_items"),
            func.count(MenuItem.id).filter(MenuItem.is_available == 1).label("available_items"),
            func.count(MenuItem.id).filter(MenuItem.is_available == 0).label("unavailable_items"),
            func.count(MenuItem.id).filter(MenuItem.food_type == "veg").label("veg_items"),
            func.count(MenuItem.id).filter(MenuItem.food_type == "non-veg").label("nonveg_items")
        )
        .where(MenuItem.is_active == 1)
    )
    row = (await db.execute(stmt)).first()
    return {
        "total_active_dishes": row.total_items or 0,
        "available_now": row.available_items or 0,
        "sold_out": row.unavailable_items or 0,
        "vegetarian_count": row.veg_items or 0,
        "non_vegetarian_count": row.nonveg_items or 0
    }

@router.post("/query", response_model=ResponseModel)
async def query_ai_insights(
    payload: AIQuestionRequest,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    now = datetime.now()
    if payload.date_range == "today":
        start_dt = now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif payload.date_range == "30days":
        start_dt = (now - timedelta(days=30)).replace(hour=0, minute=0, second=0, microsecond=0)
    elif payload.date_range == "all":
        start_dt = now - timedelta(days=365)
    else:  # 7days
        start_dt = (now - timedelta(days=7)).replace(hour=0, minute=0, second=0, microsecond=0)

    end_dt = now

    # Execute deterministic tools to gather factual grounding data
    sales_summary = await tool_get_sales_summary(db, start_dt, end_dt)
    top_items = await tool_get_top_selling_items(db, start_dt, end_dt, limit=5)
    status_counts = await tool_get_order_status_counts(db, start_dt, end_dt)
    menu_summary = await tool_get_menu_availability_summary(db)

    # Formulate strictly grounded response
    top_items_names = [f"{item['dish_name']} ({item['units_sold']} portions, ₹{item['revenue_inr']:.2f})" for item in top_items]
    top_items_str = ", ".join(top_items_names) if top_items_names else "No sales recorded yet."

    summary_text = (
        f"Operational analysis for the selected period ({sales_summary['period_start']} to {sales_summary['period_end']}): "
        f"Total of {sales_summary['total_orders']} orders were placed, generating ₹{sales_summary['paid_revenue_inr']:.2f} in paid revenue "
        f"with an average order value (AOV) of ₹{sales_summary['average_order_value_inr']:.2f}. "
        f"Kitchen completed {sales_summary['completed_orders']} orders, with {sales_summary['cancelled_orders']} cancellations."
    )

    observations = [
        f"Top performing items by volume: {top_items_str}.",
        f"Current menu health: {menu_summary['available_now']} of {menu_summary['total_active_dishes']} dishes available ({menu_summary['sold_out']} sold out).",
        f"Dietary distribution: {menu_summary['vegetarian_count']} vegetarian dishes and {menu_summary['non_vegetarian_count']} non-vegetarian options active."
    ]

    if sales_summary["cancelled_orders"] > 0:
        rate = round((sales_summary["cancelled_orders"] / max(1, sales_summary["total_orders"])) * 100, 1)
        observations.append(f"Cancellation rate is currently {rate}%. Review kitchen throughput to minimize peak break delays.")

    insights = AIInsightsResponse(
        summary=summary_text,
        key_observations=observations,
        supporting_metrics={
            "sales_summary": sales_summary,
            "top_selling_items": top_items,
            "status_distribution": status_counts,
            "catalog_status": menu_summary
        },
        limitations=[
            "Data is calculated deterministically from active PostgreSQL order snapshots.",
            "Historical accounting preserves original dish pricing at the time of order placement.",
            "External weather, class break schedules, and peak bell times are not yet correlated in this view."
        ],
        recommended_follow_up_questions=[
            "Which cuisine category has the highest profit margin?",
            "What was our peak hourly ordering volume during lunch hour?",
            "Are any popular dishes currently toggled out of stock?"
        ],
        generated_at=now.strftime("%Y-%m-%d %I:%M %p"),
        is_live_provider=False
    )

    return ResponseModel(
        success=True,
        data={"insights": insights.model_dump()}
    )

