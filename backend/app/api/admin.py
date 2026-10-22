import io
import csv
from typing import Optional, List
from datetime import datetime, date, timedelta
from decimal import Decimal
import os
import secrets
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy import select, func, desc, and_, or_, distinct
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import get_password_hash
from app.db.session import get_db
from app.models.entities import (
    Order, OrderItem, Payment, OrderStatusHistory, MenuItem,
    Category, Setting, User, UserRole, OrderStatus, PaymentStatus
)
from app.api.deps import require_admin
from app.schemas import (
    AdminDashboardResponse, AdminKpisResponse, OrderDetailResponse,
    OrderItemResponse, OrderStatusHistoryResponse, MenuItemResponse,
    MenuItemCreateRequest, MenuItemUpdateRequest, CategoryResponse,
    CategoryCreateRequest, CategoryUpdateRequest, AdminCreateUserRequest,
    UserResponse, ResponseModel
)

router = APIRouter(prefix="/admin", tags=["Administrator Control Panel"])

@router.get("/dashboard", response_model=ResponseModel)
async def get_dashboard(
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    now = datetime.now()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    # 1. Today Paid Revenue
    rev_stmt = select(func.sum(Order.total_amount)).where(
        Order.created_at >= today_start,
        Order.payment_status == PaymentStatus.PAID.value
    )
    today_rev = (await db.execute(rev_stmt)).scalar() or Decimal("0.00")

    # Total Revenue All Time
    total_rev_stmt = select(func.sum(Order.total_amount)).where(
        Order.payment_status == PaymentStatus.PAID.value
    )
    total_rev = (await db.execute(total_rev_stmt)).scalar() or Decimal("0.00")

    # 2. Total Orders Today
    total_today_stmt = select(func.count(Order.id)).where(Order.created_at >= today_start)
    total_today = (await db.execute(total_today_stmt)).scalar() or 0

    # 3. Completed Orders Today
    comp_stmt = select(func.count(Order.id)).where(
        Order.created_at >= today_start,
        Order.order_status == OrderStatus.COLLECTED.value
    )
    completed_today = (await db.execute(comp_stmt)).scalar() or 0

    # 4. Pending / Active Orders Today
    pending_stmt = select(func.count(Order.id)).where(
        Order.created_at >= today_start,
        Order.order_status.in_([
            OrderStatus.PLACED.value,
            OrderStatus.ACCEPTED.value,
            OrderStatus.PREPARING.value,
            OrderStatus.READY.value
        ])
    )
    pending_today = (await db.execute(pending_stmt)).scalar() or 0

    # 5. Average Order Value (AOV)
    aov = (today_rev / total_today) if total_today > 0 else Decimal("0.00")

    # 6. Completion Rate
    completion_rate = (completed_today / total_today * 100.0) if total_today > 0 else 0.0

    kpis = AdminKpisResponse(
        today_revenue=today_rev,
        total_revenue=total_rev,
        total_orders_today=total_today,
        completed_orders_today=completed_today,
        pending_orders_today=pending_today,
        avg_order_value=round(aov, 2),
        completion_rate_percent=round(completion_rate, 1)
    )

    # Recent Orders (last 10)
    recent_stmt = (
        select(Order)
        .options(selectinload(Order.items))
        .order_by(Order.created_at.desc())
        .limit(10)
    )
    recent_res = await db.execute(recent_stmt)
    recent_orders_list = []
    for o in recent_res.scalars().all():
        od = OrderDetailResponse.model_validate(o).model_dump()
        od["items"] = [OrderItemResponse.model_validate(i).model_dump() for i in o.items]
        recent_orders_list.append(od)

    # 7-day revenue trend
    revenue_chart = []
    for day_offset in range(6, -1, -1):
        target_day = (now - timedelta(days=day_offset)).date()
        day_start = datetime.combine(target_day, datetime.min.time())
        day_end = datetime.combine(target_day, datetime.max.time())
        d_stmt = select(func.sum(Order.total_amount)).where(
            Order.created_at.between(day_start, day_end),
            Order.payment_status == PaymentStatus.PAID.value
        )
        d_rev = (await db.execute(d_stmt)).scalar() or Decimal("0.00")
        revenue_chart.append({
            "date": target_day.strftime("%a %d"),
            "revenue": float(d_rev)
        })

    # Cuisine popularity breakdown
    cuisine_stmt = (
        select(Category.name, func.count(OrderItem.id))
        .join(MenuItem, MenuItem.id == OrderItem.menu_item_id)
        .join(Category, Category.id == MenuItem.category_id)
        .group_by(Category.name)
    )
    cuisine_res = (await db.execute(cuisine_stmt)).all()
    cuisine_chart = [{"category": row[0], "count": row[1]} for row in cuisine_res]

    return ResponseModel(
        success=True,
        data={
            "kpis": kpis.model_dump(),
            "recent_orders": recent_orders_list,
            "revenue_chart": revenue_chart,
            "cuisine_chart": cuisine_chart
        }
    )

@router.get("/orders", response_model=ResponseModel)
async def get_admin_orders(
    order_status: Optional[str] = Query(None),
    payment_status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Order).options(selectinload(Order.items)).order_by(Order.created_at.desc())

    if order_status and order_status != "all":
        stmt = stmt.where(Order.order_status == order_status)
    if payment_status and payment_status != "all":
        stmt = stmt.where(Order.payment_status == payment_status)
    if search and search.strip():
        term = f"%{search.strip()}%"
        stmt = stmt.where(
            or_(
                Order.order_number.ilike(term),
                Order.customer_name_snapshot.ilike(term),
                Order.customer_phone_snapshot.ilike(term)
            )
        )
    if start_date:
        try:
            s_dt = datetime.fromisoformat(start_date)
            stmt = stmt.where(Order.created_at >= s_dt)
        except Exception:
            pass
    if end_date:
        try:
            e_dt = datetime.fromisoformat(end_date)
            stmt = stmt.where(Order.created_at <= e_dt)
        except Exception:
            pass

    # Total count for pagination
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total_count = (await db.execute(count_stmt)).scalar() or 0

    # Paginate
    stmt = stmt.offset((page - 1) * limit).limit(limit)
    orders = (await db.execute(stmt)).scalars().all()

    orders_list = []
    for o in orders:
        od = OrderDetailResponse.model_validate(o).model_dump()
        od["items"] = [OrderItemResponse.model_validate(i).model_dump() for i in o.items]
        orders_list.append(od)

    return ResponseModel(
        success=True,
        data={
            "orders": orders_list,
            "total_count": total_count,
            "page": page,
            "limit": limit,
            "total_pages": (total_count + limit - 1) // limit if limit else 1
        }
    )

@router.post("/orders/{order_id}/override-status", response_model=ResponseModel)
async def admin_override_status(
    order_id: int,
    payload: dict,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Order).options(selectinload(Order.payments)).where(Order.id == order_id)
    order = (await db.execute(stmt)).scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")

    new_status = payload.get("new_status")
    new_payment_status = payload.get("payment_status")
    notes = payload.get("notes", f"Admin override by {current_user.full_name}")

    old_status = order.order_status
    if new_status:
        order.order_status = new_status
        if new_status == OrderStatus.COLLECTED.value and not order.collected_at:
            order.collected_at = datetime.now()

    if new_payment_status:
        order.payment_status = new_payment_status
        for p in order.payments:
            p.payment_status = new_payment_status
            if new_payment_status == PaymentStatus.PAID.value and not p.paid_at:
                p.paid_at = datetime.now()

    order.updated_at = datetime.now()

    audit = OrderStatusHistory(
        order_id=order.id,
        old_status=old_status,
        new_status=new_status or old_status,
        changed_by=current_user.id,
        notes=notes
    )
    db.add(audit)
    await db.commit()

    return ResponseModel(
        success=True,
        message=f"Order #{order.order_number} status overridden to {order.order_status}."
    )

# Menu Items CRUD
@router.get("/menu-items", response_model=ResponseModel)
async def get_admin_menu_items(
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(MenuItem).options(selectinload(MenuItem.category)).where(MenuItem.is_active == 1).order_by(MenuItem.category_id.asc(), MenuItem.name.asc())
    items = (await db.execute(stmt)).scalars().all()

    items_list = []
    for item in items:
        it = MenuItemResponse.model_validate(item).model_dump()
        it["category_name"] = item.category.name if item.category else None
        it["category_slug"] = item.category.slug if item.category else None
        items_list.append(it)

    return ResponseModel(success=True, data={"items": items_list})

@router.post("/menu-items", response_model=ResponseModel)
async def create_menu_item(
    payload: MenuItemCreateRequest,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    item = MenuItem(
        category_id=payload.category_id,
        name=payload.name.strip(),
        description=payload.description.strip() if payload.description else None,
        price=payload.price,
        food_type=payload.food_type,
        image_path=payload.image_path,
        is_available=payload.is_available,
        is_active=1,
        preparation_time_minutes=payload.preparation_time_minutes
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return ResponseModel(success=True, message=f"Item '{item.name}' created.", data={"id": item.id})

@router.put("/menu-items/{item_id}", response_model=ResponseModel)
async def update_menu_item(
    item_id: int,
    payload: MenuItemUpdateRequest,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(MenuItem).where(MenuItem.id == item_id)
    item = (await db.execute(stmt)).scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found.")

    if payload.category_id is not None:
        item.category_id = payload.category_id
    if payload.name is not None:
        item.name = payload.name.strip()
    if payload.description is not None:
        item.description = payload.description.strip()
    if payload.price is not None:
        item.price = payload.price
    if payload.food_type is not None:
        item.food_type = payload.food_type
    if payload.image_path is not None:
        item.image_path = payload.image_path
    if payload.is_available is not None:
        item.is_available = payload.is_available
    if payload.preparation_time_minutes is not None:
        item.preparation_time_minutes = payload.preparation_time_minutes

    item.updated_at = datetime.now()
    await db.commit()
    return ResponseModel(success=True, message=f"Item '{item.name}' updated.")

@router.patch("/menu-items/{item_id}/toggle-stock", response_model=ResponseModel)
async def toggle_menu_item_stock(
    item_id: int,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(MenuItem).where(MenuItem.id == item_id)
    item = (await db.execute(stmt)).scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found.")

    item.is_available = 0 if item.is_available == 1 else 1
    item.updated_at = datetime.now()
    await db.commit()

    status_str = "Available" if item.is_available == 1 else "Unavailable"
    return ResponseModel(success=True, message=f"{item.name} is now marked as {status_str}.", data={"is_available": item.is_available})

@router.delete("/menu-items/{item_id}", response_model=ResponseModel)
async def delete_menu_item(
    item_id: int,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(MenuItem).where(MenuItem.id == item_id)
    item = (await db.execute(stmt)).scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found.")

    # Soft delete to preserve historical integrity
    item.is_active = 0
    item.is_available = 0
    item.updated_at = datetime.now()
    await db.commit()

    return ResponseModel(success=True, message=f"Item '{item.name}' deleted.")

# Categories CRUD
@router.get("/categories", response_model=ResponseModel)
async def get_admin_categories(
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Category).order_by(Category.sort_order.asc())
    categories = (await db.execute(stmt)).scalars().all()
    return ResponseModel(
        success=True,
        data={"categories": [CategoryResponse.model_validate(c).model_dump() for c in categories]}
    )

@router.post("/categories", response_model=ResponseModel)
async def create_category(
    payload: CategoryCreateRequest,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    slug = payload.slug or payload.name.lower().replace(" ", "-")
    cat = Category(
        name=payload.name.strip(),
        slug=slug.strip(),
        description=payload.description,
        icon=payload.icon,
        sort_order=payload.sort_order,
        is_active=payload.is_active
    )
    db.add(cat)
    await db.commit()
    await db.refresh(cat)
    return ResponseModel(success=True, message=f"Category '{cat.name}' created.", data={"id": cat.id})

@router.put("/categories/{cat_id}", response_model=ResponseModel)
async def update_category(
    cat_id: int,
    payload: CategoryUpdateRequest,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Category).where(Category.id == cat_id)
    cat = (await db.execute(stmt)).scalar_one_or_none()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found.")

    if payload.name is not None:
        cat.name = payload.name.strip()
    if payload.slug is not None:
        cat.slug = payload.slug.strip()
    if payload.description is not None:
        cat.description = payload.description.strip()
    if payload.icon is not None:
        cat.icon = payload.icon
    if payload.sort_order is not None:
        cat.sort_order = payload.sort_order
    if payload.is_active is not None:
        cat.is_active = payload.is_active

    await db.commit()
    return ResponseModel(success=True, message=f"Category '{cat.name}' updated.")

# Users Management with Last Admin Protection
@router.get("/users", response_model=ResponseModel)
async def get_admin_users(
    role: Optional[str] = Query(None),
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(User).order_by(User.created_at.desc())
    if role and role != "all":
        stmt = stmt.where(User.role == role)
    users = (await db.execute(stmt)).scalars().all()
    return ResponseModel(
        success=True,
        data={"users": [UserResponse.model_validate(u).model_dump() for u in users]}
    )

@router.post("/users", response_model=ResponseModel)
async def create_admin_user(
    payload: AdminCreateUserRequest,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(User).where(or_(User.username == payload.username, User.email == payload.email))
    existing = (await db.execute(stmt)).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Username or email is already registered.")

    new_user = User(
        full_name=payload.full_name.strip(),
        username=payload.username.strip(),
        email=payload.email.strip(),
        phone=payload.phone.strip() if payload.phone else None,
        password_hash=get_password_hash(payload.password),
        role=payload.role,
        is_active=1
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return ResponseModel(success=True, message=f"User '{new_user.username}' created.")

@router.patch("/users/{user_id}/toggle-active", response_model=ResponseModel)
async def toggle_user_active(
    user_id: int,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(User).where(User.id == user_id)
    target_user = (await db.execute(stmt)).scalar_one_or_none()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found.")

    # Invariant: Last Administrator Protection
    if target_user.role == UserRole.ADMIN.value and target_user.is_active == 1:
        count_admins_stmt = select(func.count(User.id)).where(
            User.role == UserRole.ADMIN.value,
            User.is_active == 1
        )
        active_admins_count = (await db.execute(count_admins_stmt)).scalar() or 0
        if active_admins_count <= 1:
            raise HTTPException(
                status_code=400,
                detail="Security Lock: Cannot deactivate the last active administrator account."
            )

    target_user.is_active = 0 if target_user.is_active == 1 else 1
    target_user.updated_at = datetime.now()
    await db.commit()

    status_str = "activated" if target_user.is_active == 1 else "deactivated"
    return ResponseModel(
        success=True,
        message=f"Account for {target_user.full_name} ({target_user.username}) has been {status_str}.",
        data={"is_active": target_user.is_active}
    )

# Reports & CSV Export
@router.get("/reports", response_model=ResponseModel)
async def get_admin_reports(
    date_preset: str = Query("7days"),  # today, 7days, this_month, 30days, custom
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    now = datetime.now()
    if date_preset == "today":
        start_dt = now.replace(hour=0, minute=0, second=0, microsecond=0)
        end_dt = now.replace(hour=23, minute=59, second=59, microsecond=999999)
    elif date_preset == "this_month":
        start_dt = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        end_dt = now
    elif date_preset == "30days":
        start_dt = (now - timedelta(days=30)).replace(hour=0, minute=0, second=0, microsecond=0)
        end_dt = now
    elif date_preset == "custom" and start_date and end_date:
        start_dt = datetime.fromisoformat(start_date)
        end_dt = datetime.fromisoformat(end_date)
    else:  # 7days default
        start_dt = (now - timedelta(days=7)).replace(hour=0, minute=0, second=0, microsecond=0)
        end_dt = now

    stmt = (
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.created_at.between(start_dt, end_dt))
        .order_by(Order.created_at.desc())
    )
    orders = (await db.execute(stmt)).scalars().all()

    total_orders = len(orders)
    paid_orders = [o for o in orders if o.payment_status == PaymentStatus.PAID.value]
    total_revenue = sum([o.total_amount for o in paid_orders], Decimal("0.00"))
    completed_orders = len([o for o in orders if o.order_status == OrderStatus.COLLECTED.value])
    aov = (total_revenue / len(paid_orders)) if paid_orders else Decimal("0.00")
    comp_rate = (completed_orders / total_orders * 100.0) if total_orders else 0.0

    return ResponseModel(
        success=True,
        data={
            "summary": {
                "total_orders": total_orders,
                "paid_orders": len(paid_orders),
                "total_revenue": float(total_revenue),
                "completed_orders": completed_orders,
                "average_order_value": float(round(aov, 2)),
                "completion_rate_percent": round(comp_rate, 1),
                "start_date": start_dt.isoformat(),
                "end_date": end_dt.isoformat(),
            },
            "orders": [
                OrderDetailResponse.model_validate(o).model_dump() for o in orders
            ]
        }
    )

@router.get("/reports/export-csv")
async def export_reports_csv(
    date_preset: str = Query("7days"),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    now = datetime.now()
    if date_preset == "today":
        start_dt = now.replace(hour=0, minute=0, second=0, microsecond=0)
        end_dt = now
    elif date_preset == "this_month":
        start_dt = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        end_dt = now
    elif date_preset == "30days":
        start_dt = (now - timedelta(days=30)).replace(hour=0, minute=0, second=0, microsecond=0)
        end_dt = now
    elif date_preset == "custom" and start_date and end_date:
        start_dt = datetime.fromisoformat(start_date)
        end_dt = datetime.fromisoformat(end_date)
    else:
        start_dt = (now - timedelta(days=7)).replace(hour=0, minute=0, second=0, microsecond=0)
        end_dt = now

    stmt = (
        select(Order)
        .where(Order.created_at.between(start_dt, end_dt))
        .order_by(Order.created_at.desc())
    )
    orders = (await db.execute(stmt)).scalars().all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Order Number", "Date & Time", "Customer Name", "Phone",
        "Subtotal (INR)", "Tax (INR)", "Total (INR)",
        "Payment Method", "Payment Status", "Order Status"
    ])

    for o in orders:
        writer.writerow([
            o.order_number,
            o.created_at.strftime("%Y-%m-%d %H:%M:%S") if o.created_at else "",
            o.customer_name_snapshot,
            o.customer_phone_snapshot or "",
            f"{o.subtotal:.2f}",
            f"{o.tax_amount:.2f}",
            f"{o.total_amount:.2f}",
            o.payment_method.upper(),
            o.payment_status.upper(),
            o.order_status.upper()
        ])

    output.seek(0)
    filename = f"campusbite_sales_{start_dt.strftime('%Y%m%d')}_{end_dt.strftime('%Y%m%d')}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

# Settings CRUD
@router.get("/settings", response_model=ResponseModel)
async def get_settings(
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Setting)
    settings_rows = (await db.execute(stmt)).scalars().all()
    data = {s.setting_key: s.setting_value for s in settings_rows}
    return ResponseModel(success=True, data={"settings": data})

@router.post("/settings", response_model=ResponseModel)
async def update_settings(
    payload: dict,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    for k, v in payload.items():
        stmt = select(Setting).where(Setting.setting_key == k)
        row = (await db.execute(stmt)).scalar_one_or_none()
        if row:
            row.setting_value = str(v)
            row.updated_at = datetime.now()
        else:
            db.add(Setting(setting_key=k, setting_value=str(v)))
    await db.commit()
    return ResponseModel(success=True, message="Settings saved successfully.")

