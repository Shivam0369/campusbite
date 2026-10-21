from typing import Optional, List, Any
from decimal import Decimal
from datetime import datetime
from pydantic import BaseModel, ConfigDict, EmailStr, Field

class ResponseModel(BaseModel):
    success: bool = True
    message: Optional[str] = None
    data: Optional[Any] = None

# Auth Schemas
class UserRegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=120)
    username: str = Field(..., min_length=3, max_length=60, pattern=r"^[a-zA-Z0-9_]+$")
    email: EmailStr
    phone: Optional[str] = Field(None, pattern=r"^[0-9]{10}$")
    password: str = Field(..., min_length=6)
    confirm_password: Optional[str] = None

class UserLoginRequest(BaseModel):
    identifier: str = Field(..., min_length=1)  # username or email
    password: str = Field(..., min_length=1)

class UserProfileUpdateRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=120)
    phone: Optional[str] = Field(None, pattern=r"^[0-9]{10}$")

class UserPasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=6)

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    username: str
    email: str
    phone: Optional[str] = None
    role: str
    is_active: int
    created_at: datetime

# Category Schemas
class CategoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    slug: str
    description: Optional[str] = None
    icon: Optional[str] = None
    sort_order: int
    is_active: int

class CategoryCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=80)
    slug: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = "fa-bowl-food"
    sort_order: int = 0
    is_active: int = 1

class CategoryUpdateRequest(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    sort_order: Optional[int] = None
    is_active: Optional[int] = None

# Menu Item Schemas
class MenuItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    category_id: int
    category_name: Optional[str] = None
    category_slug: Optional[str] = None
    name: str
    description: Optional[str] = None
    price: Decimal
    food_type: str
    image_path: Optional[str] = None
    is_available: int
    is_active: int
    preparation_time_minutes: int

class MenuItemCreateRequest(BaseModel):
    category_id: int
    name: str = Field(..., min_length=2, max_length=120)
    description: Optional[str] = None
    price: Decimal = Field(..., gt=0)
    food_type: str = Field("veg", pattern=r"^(veg|non-veg)$")
    image_path: Optional[str] = None
    is_available: int = 1
    preparation_time_minutes: int = 15

class MenuItemUpdateRequest(BaseModel):
    category_id: Optional[int] = None
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[Decimal] = None
    food_type: Optional[str] = None
    image_path: Optional[str] = None
    is_available: Optional[int] = None
    preparation_time_minutes: Optional[int] = None

# Cart Schemas
class CartItem(BaseModel):
    menu_item_id: int
    name: str
    price: Decimal
    quantity: int
    line_total: Decimal
    image_path: Optional[str] = None
    food_type: str
    is_available: int

class CartResponse(BaseModel):
    items: List[CartItem]
    cart_count: int
    subtotal: Decimal
    tax_percent: Decimal
    tax_amount: Decimal
    total: Decimal

class CartActionRequest(BaseModel):
    action: str  # add, update, remove, clear
    menu_item_id: Optional[int] = None
    quantity: Optional[int] = 1

# Order Schemas
class OrderItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    menu_item_id: int
    item_name_snapshot: str
    unit_price: Decimal
    quantity: int
    line_total: Decimal

class OrderStatusHistoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    old_status: Optional[str] = None
    new_status: str
    changed_by_name: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime

class OrderDetailResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    order_number: str
    user_id: int
    customer_name_snapshot: str
    customer_phone_snapshot: Optional[str] = None
    subtotal: Decimal
    discount_amount: Decimal
    tax_amount: Decimal
    total_amount: Decimal
    payment_method: str
    payment_status: str
    order_status: str
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    collected_at: Optional[datetime] = None
    items: List[OrderItemResponse] = []
    status_history: List[OrderStatusHistoryResponse] = []

class CheckoutRequest(BaseModel):
    customer_name: str = Field(..., min_length=2, max_length=120)
    customer_phone: Optional[str] = Field(None, pattern=r"^[0-9]{10}$")
    notes: Optional[str] = Field(None, max_length=500)
    payment_method: str = Field("cash", pattern=r"^(cash|upi)$")

# Kitchen Schemas
class KitchenOrderItem(BaseModel):
    item_name_snapshot: str
    quantity: int
    unit_price: Decimal
    line_total: Decimal

class KitchenOrderCard(BaseModel):
    id: int
    order_number: str
    customer_name_snapshot: str
    customer_phone_snapshot: Optional[str] = None
    total_amount: Decimal
    total_formatted: str
    payment_method: str
    payment_status: str
    order_status: str
    notes: Optional[str] = None
    created_at: datetime
    created_at_formatted: str
    elapsed_minutes: int
    is_urgent: bool
    items: List[KitchenOrderItem]

class KitchenFeedResponse(BaseModel):
    success: bool = True
    count: int
    server_time: str
    orders: List[KitchenOrderCard]

class KitchenTransitionRequest(BaseModel):
    order_id: int
    new_status: str
    notes: Optional[str] = None
    mark_paid: Optional[bool] = False

# Admin Schemas
class AdminKpisResponse(BaseModel):
    today_revenue: Decimal
    total_revenue: Decimal
    total_orders_today: int
    completed_orders_today: int
    pending_orders_today: int
    avg_order_value: Decimal
    completion_rate_percent: float

class AdminDashboardResponse(BaseModel):
    kpis: AdminKpisResponse
    recent_orders: List[OrderDetailResponse]
    revenue_chart: List[dict]
    cuisine_chart: List[dict]

class AdminCreateUserRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=120)
    username: str = Field(..., min_length=3, max_length=60, pattern=r"^[a-zA-Z0-9_]+$")
    email: EmailStr
    phone: Optional[str] = Field(None, pattern=r"^[0-9]{10}$")
    password: str = Field(..., min_length=6)
    role: str = Field(..., pattern=r"^(customer|staff|admin)$")

class AdminSettingUpdateRequest(BaseModel):
    settings: dict

