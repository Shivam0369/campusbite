from typing import Optional, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, asc, desc
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.entities import Category, MenuItem
from app.schemas import CategoryResponse, MenuItemResponse, ResponseModel

router = APIRouter(prefix="/catalog", tags=["Catalog"])

@router.get("/categories", response_model=ResponseModel)
async def get_categories(
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(Category)
        .where(Category.is_active == 1)
        .order_order_by(Category.sort_order.asc())
        if hasattr(Category, "order_order_by") else
        select(Category).where(Category.is_active == 1).order_by(Category.sort_order.asc())
    )
    res = await db.execute(stmt)
    categories = res.scalars().all()

    return ResponseModel(
        success=True,
        data={"categories": [CategoryResponse.model_validate(c) for c in categories]}
    )

@router.get("/items", response_model=ResponseModel)
async def get_menu_items(
    category_slug: Optional[str] = Query(None),
    category_id: Optional[int] = Query(None),
    food_type: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    available_only: bool = Query(False),
    sort: str = Query("default"),  # default, price-low, price-high, name-az
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(MenuItem)
        .join(MenuItem.category)
        .options(selectinload(MenuItem.category))
        .where(MenuItem.is_active == 1)
        .where(Category.is_active == 1)
    )

    if category_slug and category_slug != "all":
        stmt = stmt.where(Category.slug == category_slug)
    elif category_id:
        stmt = stmt.where(MenuItem.category_id == category_id)

    if food_type and food_type != "all":
        stmt = stmt.where(MenuItem.food_type == food_type)

    if available_only:
        stmt = stmt.where(MenuItem.is_available == 1)

    if search and search.strip():
        term = f"%{search.strip()}%"
        stmt = stmt.where(
            (MenuItem.name.ilike(term)) | (MenuItem.description.ilike(term))
        )

    # Sorting
    if sort == "price-low":
        stmt = stmt.order_by(MenuItem.price.asc())
    elif sort == "price-high":
        stmt = stmt.order_by(MenuItem.price.desc())
    elif sort == "name-az":
        stmt = stmt.order_by(MenuItem.name.asc())
    else:
        # Default: category sort order then item name
        stmt = stmt.order_by(Category.sort_order.asc(), MenuItem.name.asc())

    res = await db.execute(stmt)
    items = res.scalars().all()

    items_data = []
    for item in items:
        item_dict = MenuItemResponse.model_validate(item).model_dump()
        item_dict["category_name"] = item.category.name if item.category else None
        item_dict["category_slug"] = item.category.slug if item.category else None
        items_data.append(item_dict)

    return ResponseModel(
        success=True,
        data={
            "items": items_data,
            "total_count": len(items_data)
        }
    )

