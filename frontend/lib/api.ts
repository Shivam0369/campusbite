// CampusBite Typed API Client

export interface User {
  id: number;
  full_name: string;
  username: string;
  email: string;
  phone?: string | null;
  role: 'customer' | 'staff' | 'admin';
  is_active: number;
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  sort_order: number;
  is_active: number;
}

export interface MenuItem {
  id: number;
  category_id: number;
  category_name?: string | null;
  category_slug?: string | null;
  name: string;
  description?: string | null;
  price: number | string;
  food_type: 'veg' | 'non-veg';
  image_path?: string | null;
  is_available: number;
  is_active: number;
  preparation_time_minutes: number;
}

export interface CartItem {
  menu_item_id: number;
  name: string;
  price: number | string;
  quantity: number;
  line_total: number | string;
  image_path?: string | null;
  food_type: 'veg' | 'non-veg';
  is_available: number;
}

export interface CartData {
  items: CartItem[];
  cart_count: number;
  subtotal: number | string;
  tax_percent: number | string;
  tax_amount: number | string;
  total: number | string;
}

export interface OrderItem {
  id: number;
  menu_item_id: number;
  item_name_snapshot: string;
  unit_price: number | string;
  quantity: number;
  line_total: number | string;
}

export interface OrderStatusHistory {
  id: number;
  old_status?: string | null;
  new_status: string;
  changed_by_name?: string | null;
  notes?: string | null;
  created_at: string;
}

export interface Order {
  id: number;
  order_number: string;
  user_id: number;
  customer_name_snapshot: string;
  customer_phone_snapshot?: string | null;
  subtotal: number | string;
  discount_amount: number | string;
  tax_amount: number | string;
  total_amount: number | string;
  payment_method: 'cash' | 'upi' | 'online';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  order_status: 'placed' | 'accepted' | 'preparing' | 'ready' | 'collected' | 'cancelled';
  notes?: string | null;
  created_at: string;
  updated_at: string;
  collected_at?: string | null;
  items?: OrderItem[];
  status_history?: OrderStatusHistory[];
}

export interface KitchenOrderCard {
  id: number;
  order_number: string;
  customer_name_snapshot: string;
  customer_phone_snapshot?: string | null;
  total_amount: number | string;
  total_formatted: string;
  payment_method: string;
  payment_status: string;
  order_status: string;
  notes?: string | null;
  created_at: string;
  created_at_formatted: string;
  elapsed_minutes: number;
  is_urgent: boolean;
  items: {
    item_name_snapshot: string;
    quantity: number;
    unit_price: number | string;
    line_total: number | string;
  }[];
}

const API_BASE = '/api';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // sends and receives cookies
  });

  const json = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = json.detail || json.message || 'Request failed';
    throw new Error(errorMsg);
  }

  return json;
}

export const api = {
  // Auth
  register: (data: any) => request<any>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: any) => request<any>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  logout: () => request<any>('/auth/logout', { method: 'POST' }),
  getMe: () => request<any>('/auth/me'),
  updateProfile: (data: any) => request<any>('/auth/profile', { method: 'PUT', body: JSON.stringify(data) }),
  changePassword: (data: any) => request<any>('/auth/password', { method: 'PUT', body: JSON.stringify(data) }),

  // Catalog
  getCategories: () => request<any>('/catalog/categories'),
  getItems: (params: Record<string, any> = {}) => {
    const q = new URLSearchParams(params).toString();
    return request<any>(`/catalog/items${q ? `?${q}` : ''}`);
  },

  // Cart
  getCart: () => request<any>('/cart'),
  cartAction: (action: string, menu_item_id?: number, quantity?: number) =>
    request<any>('/cart', {
      method: 'POST',
      body: JSON.stringify({ action, menu_item_id, quantity }),
    }),

  // Orders
  checkout: (data: any) => request<any>('/orders/checkout', { method: 'POST', body: JSON.stringify(data) }),
  getMyOrders: () => request<any>('/orders/my-orders'),
  getOrder: (id: number) => request<any>(`/orders/${id}`),
  getOrderStatus: (id: number) => request<any>(`/orders/${id}/status`),
  cancelOrder: (id: number) => request<any>(`/orders/${id}/cancel`, { method: 'POST' }),
  reorder: (id: number) => request<any>(`/orders/${id}/reorder`, { method: 'POST' }),

  // Kitchen
  getKitchenFeed: (status_filter: string = 'active') => request<any>(`/kitchen/feed?status_filter=${status_filter}`),
  kitchenTransition: (data: { order_id: number; new_status: string; notes?: string; mark_paid?: boolean }) =>
    request<any>('/kitchen/transition', { method: 'POST', body: JSON.stringify(data) }),

  // Admin
  getDashboard: () => request<any>('/admin/dashboard'),
  getAdminOrders: (params: Record<string, any> = {}) => {
    const q = new URLSearchParams(params).toString();
    return request<any>(`/admin/orders${q ? `?${q}` : ''}`);
  },
  overrideOrderStatus: (id: number, data: any) =>
    request<any>(`/admin/orders/${id}/override-status`, { method: 'POST', body: JSON.stringify(data) }),
  getAdminMenuItems: () => request<any>('/admin/menu-items'),
  createMenuItem: (data: any) => request<any>('/admin/menu-items', { method: 'POST', body: JSON.stringify(data) }),
  updateMenuItem: (id: number, data: any) =>
    request<any>(`/admin/menu-items/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  toggleMenuItemStock: (id: number) =>
    request<any>(`/admin/menu-items/${id}/toggle-stock`, { method: 'PATCH' }),
  deleteMenuItem: (id: number) => request<any>(`/admin/menu-items/${id}`, { method: 'DELETE' }),

  getAdminCategories: () => request<any>('/admin/categories'),
  createCategory: (data: any) => request<any>('/admin/categories', { method: 'POST', body: JSON.stringify(data) }),
  updateCategory: (id: number, data: any) =>
    request<any>(`/admin/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  getAdminUsers: (role?: string) => request<any>(`/admin/users${role ? `?role=${role}` : ''}`),
  createAdminUser: (data: any) => request<any>('/admin/users', { method: 'POST', body: JSON.stringify(data) }),
  toggleUserActive: (id: number) => request<any>(`/admin/users/${id}/toggle-active`, { method: 'PATCH' }),

  getAdminReports: (params: Record<string, any> = {}) => {
    const q = new URLSearchParams(params).toString();
    return request<any>(`/admin/reports${q ? `?${q}` : ''}`);
  },
  getSettings: () => request<any>('/admin/settings'),
  updateSettings: (data: any) => request<any>('/admin/settings', { method: 'POST', body: JSON.stringify(data) }),

  // AI Insights
  queryAI: (data: { query: string; date_range?: string }) =>
    request<any>('/ai/query', { method: 'POST', body: JSON.stringify(data) }),
};
