'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api, Category, MenuItem } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';

export default function MenuPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { addToCart } = useCart();

  useEffect(() => {
    if (!authLoading && user?.role === 'staff') {
      router.replace('/staff');
    }
  }, [user, authLoading, router]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dietFilter, setDietFilter] = useState<'all' | 'veg' | 'non-veg'>('all');
  const [sortBy, setSortBy] = useState<string>('default');
  const [availableOnly, setAvailableOnly] = useState<boolean>(false);
  const [addingId, setAddingId] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [catsRes, itemsRes] = await Promise.all([
        api.getCategories(),
        api.getItems(),
      ]);
      if (catsRes.success) setCategories(catsRes.data.categories);
      if (itemsRes.success) setItems(itemsRes.data.items);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (item: MenuItem) => {
    if (item.is_available !== 1) return;
    setAddingId(item.id);
    try {
      await addToCart(item.id, 1);
      showToast(`${item.name} added to cart!`);
    } catch (err: any) {
      alert(err.message || 'Failed to add item to cart.');
    } finally {
      setAddingId(null);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Client-side filtering & sorting
  const filteredItems = items.filter((item) => {
    if (selectedCategory !== 'all' && item.category_slug !== selectedCategory) {
      return false;
    }
    if (dietFilter !== 'all' && item.food_type !== dietFilter) {
      return false;
    }
    if (availableOnly && item.is_available !== 1) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchDesc = item.description?.toLowerCase().includes(q);
      if (!matchName && !matchDesc) return false;
    }
    return true;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sortBy === 'price-low') {
      return Number(a.price) - Number(b.price);
    }
    if (sortBy === 'price-high') {
      return Number(b.price) - Number(a.price);
    }
    if (sortBy === 'name-az') {
      return a.name.localeCompare(b.name);
    }
    return 0;
  });

  return (
    <div className="menu-kiosk-page">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast-notification-pop">
          <i className="fa-solid fa-circle-check"></i> {toastMessage}
        </div>
      )}

      {/* Header section */}
      <div className="menu-header">
        <div className="container">
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <i className="fa-solid fa-utensils" style={{ color: 'var(--color-accent)' }}></i> Our Menu
          </h1>
          <p className="subtitle">
            {user
              ? `Welcome, ${user.full_name}! What would you like to eat today?`
              : 'Welcome! What would you like to eat today?'}
          </p>
        </div>
      </div>

      {/* Category Pills Navigation Bar */}
      <div className="container" style={{ marginBottom: '12px' }}>
        <div className="category-nav">
          <button
            className={`category-pill ${selectedCategory === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('all')}
          >
            <i className="fa-solid fa-border-all"></i> All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`category-pill ${selectedCategory === cat.slug ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat.slug)}
            >
              {cat.icon && <i className={`fa-solid ${cat.icon}`}></i>} {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div className="container">
        {/* Single-Row Filter Controls Bar */}
        <div className="menu-filters">
          {/* Search Box */}
          <div className="search-box">
            <i className="fa-solid fa-magnifying-glass search-icon"></i>
            <input
              type="text"
              placeholder="Search for food..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Dietary Filters */}
          <div className="filter-group">
            <button
              className={`filter-btn ${dietFilter === 'all' ? 'active' : ''}`}
              onClick={() => setDietFilter('all')}
            >
              All
            </button>
            <button
              className={`filter-btn ${dietFilter === 'veg' ? 'active-veg' : ''}`}
              onClick={() => setDietFilter('veg')}
            >
              <span className="food-dot" style={{ background: 'var(--color-veg)', marginRight: '6px' }}></span> Veg
            </button>
            <button
              className={`filter-btn ${dietFilter === 'non-veg' ? 'active-nonveg' : ''}`}
              onClick={() => setDietFilter('non-veg')}
            >
              <span className="food-dot" style={{ background: 'var(--color-nonveg)', marginRight: '6px' }}></span> Non-Veg
            </button>
          </div>

          {/* Sort Dropdown */}
          <div className="filter-row">
            <select
              className="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="default">Sort by</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="name-az">Name: A to Z</option>
            </select>

            {/* Availability Toggle */}
            <button
              className={`filter-btn ${availableOnly ? 'active' : ''}`}
              onClick={() => setAvailableOnly(!availableOnly)}
            >
              <i className="fa-solid fa-circle-check" style={{ marginRight: '6px' }}></i> Available Only
            </button>
          </div>
        </div>

        {/* Counter Header */}
        <div style={{ padding: '8px 0 16px', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
          {sortedItems.length} items available
        </div>

        {/* Food Items Grid */}
        {loading ? (
          <div className="text-center py-5">
            <i className="fa-solid fa-spinner fa-spin fa-2x" style={{ color: 'var(--color-accent)' }}></i>
            <p className="mt-3">Loading menu items...</p>
          </div>
        ) : sortedItems.length === 0 ? (
          <div className="card text-center py-5" style={{ padding: '40px', margin: '20px 0' }}>
            <div style={{ fontSize: '3rem', color: 'var(--color-accent)', marginBottom: '16px' }}>
              <i className="fa-solid fa-utensils"></i>
            </div>
            <h3 style={{ marginBottom: '8px' }}>No dishes match your filters</h3>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
              Try clearing your search query or switching cuisine categories.
            </p>
            <div>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  setSelectedCategory('all');
                  setSearchQuery('');
                  setDietFilter('all');
                  setAvailableOnly(false);
                }}
              >
                Reset All Filters
              </button>
            </div>
          </div>
        ) : (
          <div className="food-grid">
            {sortedItems.map((dish) => {
              const isAvail = dish.is_available === 1;
              const imgUrl = dish.image_path ? `/${dish.image_path}` : '/assets/images/food/default-food.svg';

              return (
                <div key={dish.id} className="food-card">
                  {/* Image container */}
                  <div className="food-card-image">
                    <img
                      src={imgUrl}
                      alt={dish.name}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/assets/images/food/default-food.svg';
                      }}
                    />

                    {/* Unavailable banner overlay */}
                    {!isAvail && (
                      <div className="unavailable-overlay">
                        <span><i className="fa-regular fa-clock"></i> Currently Unavailable</span>
                      </div>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="food-card-body">
                    {/* Badge and prep time row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span className={`food-type-badge ${dish.food_type === 'veg' ? 'food-type-veg' : 'food-type-nonveg'}`}>
                        <span className="food-dot"></span>
                        {dish.food_type === 'veg' ? 'VEG' : 'NON-VEG'}
                      </span>
                      <span className="food-card-time">
                        <i className="fa-regular fa-clock"></i> {dish.preparation_time_minutes} min
                      </span>
                    </div>

                    <h3 className="food-card-title">{dish.name}</h3>
                    <p className="food-card-desc">{dish.description || 'Freshly prepared at counter.'}</p>

                    <div className="food-card-meta">
                      <div className="food-card-price">
                        ₹{Number(dish.price).toFixed(2)}
                      </div>

                      <div className="food-card-actions">
                        {isAvail ? (
                          <button
                            className="btn btn-accent btn-sm"
                            disabled={addingId === dish.id}
                            onClick={() => handleAddToCart(dish)}
                          >
                            {addingId === dish.id ? (
                              <i className="fa-solid fa-spinner fa-spin"></i>
                            ) : (
                              <>
                                <i className="fa-solid fa-plus"></i> Add
                              </>
                            )}
                          </button>
                        ) : (
                          <span style={{ color: 'var(--color-text-light)', fontSize: '0.85rem', fontWeight: 600 }}>
                            Unavailable
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
