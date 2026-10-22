'use client';

import React, { useState, useEffect } from 'react';
import { api, MenuItem, Category } from '@/lib/api';

export default function AdminMenuItemsPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category_id: 1,
    price: '',
    food_type: 'non-veg',
    description: '',
    preparation_time_minutes: 15,
    is_available: 1,
    is_active: 1,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [itemsRes, catsRes] = await Promise.all([
        api.getAdminMenuItems(),
        api.getAdminCategories(),
      ]);
      if (itemsRes.success) setItems(itemsRes.data.items);
      if (catsRes.success) setCategories(catsRes.data.categories);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStock = async (itemId: number) => {
    try {
      const res = await api.toggleMenuItemStock(itemId);
      if (res.success) {
        setItems((prev) =>
          prev.map((i) =>
            i.id === itemId ? { ...i, is_available: res.data.is_available } : i
          )
        );
      }
    } catch (err: any) {
      alert(err.message || 'Failed to toggle stock.');
    }
  };

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      category_id: categories[0]?.id || 1,
      price: '',
      food_type: 'veg',
      description: '',
      preparation_time_minutes: 15,
      is_available: 1,
      is_active: 1,
    });
    setShowModal(true);
  };

  const openEditModal = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category_id: item.category_id,
      price: String(item.price),
      food_type: item.food_type,
      description: item.description || '',
      preparation_time_minutes: item.preparation_time_minutes,
      is_available: item.is_available,
      is_active: item.is_active ?? 1,
    });
    setShowModal(true);
  };

  const handleSaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: any = {
        name: formData.name.trim(),
        category_id: Number(formData.category_id),
        price: parseFloat(formData.price),
        food_type: formData.food_type,
        description: formData.description.trim() || undefined,
        preparation_time_minutes: Number(formData.preparation_time_minutes),
        is_available: formData.is_available,
        is_active: formData.is_active,
      };

      if (editingItem) {
        await api.updateMenuItem(editingItem.id, payload);
      } else {
        await api.createMenuItem(payload);
      }
      setShowModal(false);
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Operation failed.');
    } finally {
      setSaving(false);
    }
  };

  const filteredItems = items.filter((item) => {
    if (search.trim() && !item.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (categoryFilter !== 'all' && String(item.category_id) !== categoryFilter) return false;
    if (typeFilter !== 'all' && item.food_type !== typeFilter) return false;
    return true;
  });

  return (
    <div>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '14px',
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.65rem',
              fontWeight: 800,
              margin: 0,
              color: 'var(--color-text)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <i className="fa-solid fa-bowl-food" style={{ color: 'var(--color-accent)' }}></i> Menu Items Management
          </h1>
          <p style={{ margin: '4px 0 0', color: 'var(--color-text-secondary)', fontSize: '0.88rem' }}>
            Add, edit dishes, update prices, toggle availability, and upload photos.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '9px 18px',
            borderRadius: '6px',
            border: 'none',
            background: 'var(--color-accent)',
            color: 'white',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer',
          }}
        >
          <i className="fa-solid fa-plus"></i> Add New Dish
        </button>
      </div>

      {/* Filters Toolbar */}
      <div
        style={{
          background: 'white',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          padding: '16px 20px',
          marginBottom: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(200px, 1.6fr) minmax(180px, 1fr) minmax(180px, 1fr) auto',
            gap: '10px',
            alignItems: 'center',
          }}
        >
          <input
            type="text"
            className="form-control"
            placeholder="Search dish name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ fontSize: '0.88rem', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
          />

          <select
            className="form-control"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{ fontSize: '0.88rem', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={String(c.id)}>{c.name}</option>
            ))}
          </select>

          <select
            className="form-control"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{ fontSize: '0.88rem', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
          >
            <option value="all">All Types (Veg & Non-Veg)</option>
            <option value="veg">Vegetarian</option>
            <option value="non-veg">Non-Vegetarian</option>
          </select>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              style={{
                background: '#1B4332',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '9px 18px',
                fontSize: '0.88rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <i className="fa-solid fa-filter"></i> Filter
            </button>
            <button
              type="button"
              onClick={() => { setSearch(''); setCategoryFilter('all'); setTypeFilter('all'); }}
              title="Reset Filters"
              style={{
                background: 'white',
                color: '#64748b',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                padding: '9px 12px',
                cursor: 'pointer',
              }}
            >
              <i className="fa-solid fa-rotate-left"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Menu Items Table */}
      <div
        style={{
          background: 'white',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          overflow: 'hidden',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>Item</th>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>Category</th>
                <th style={{ padding: '12px 18px', fontWeight: 700, textAlign: 'center' }}>Type</th>
                <th style={{ padding: '12px 18px', fontWeight: 700, textAlign: 'right' }}>Price</th>
                <th style={{ padding: '12px 18px', fontWeight: 700, textAlign: 'center' }}>Prep Time</th>
                <th style={{ padding: '12px 18px', fontWeight: 700, textAlign: 'center' }}>Available</th>
                <th style={{ padding: '12px 18px', fontWeight: 700, textAlign: 'center' }}>Status</th>
                <th style={{ padding: '12px 18px', fontWeight: 700, textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '50px', color: '#64748b' }}>
                    <i className="fa-solid fa-spinner fa-spin fa-2x" style={{ color: 'var(--color-accent)' }}></i>
                    <p className="mt-2" style={{ margin: '8px 0 0' }}>Loading dishes...</p>
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '50px', color: '#94a3b8' }}>
                    No dishes found matching filters.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isVeg = item.food_type === 'veg';
                  const inStock = item.is_available === 1;
                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      {/* Item thumbnail and name */}
                      <td style={{ padding: '12px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div
                            style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '50%',
                              background: '#fff7ed',
                              border: '1.5px solid #fed7aa',
                              color: '#ea580c',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '1rem',
                              flexShrink: 0,
                            }}
                          >
                            <i className="fa-solid fa-bowl-food"></i>
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: '#1e293b' }}>{item.name}</div>
                            {item.description && (
                              <div style={{ fontSize: '0.74rem', color: '#94a3b8', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {item.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td style={{ padding: '12px 18px', color: '#475569', fontWeight: 500 }}>
                        {item.category?.name || 'Indian'}
                      </td>

                      {/* Type Badge */}
                      <td style={{ padding: '12px 18px', textAlign: 'center' }}>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            padding: '3px 10px',
                            borderRadius: 'var(--radius-full)',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            background: isVeg ? '#dcfce7' : '#fee2e2',
                            color: isVeg ? '#15803d' : '#b91c1c',
                            textTransform: 'uppercase',
                          }}
                        >
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isVeg ? '#15803d' : '#b91c1c' }}></span>
                          {isVeg ? 'VEG' : 'NON-VEG'}
                        </span>
                      </td>

                      {/* Price */}
                      <td style={{ padding: '12px 18px', textAlign: 'right', fontWeight: 700, color: '#1e293b' }}>
                        ₹{Number(item.price).toFixed(2)}
                      </td>

                      {/* Prep time */}
                      <td style={{ padding: '12px 18px', textAlign: 'center', fontSize: '0.85rem', color: '#64748b' }}>
                        {item.preparation_time_minutes} mins
                      </td>

                      {/* Available Stock Toggle */}
                      <td style={{ padding: '12px 18px', textAlign: 'center' }}>
                        <button
                          onClick={() => handleToggleStock(item.id)}
                          title="Click to toggle stock"
                          style={{
                            fontSize: '0.68rem',
                            padding: '3px 10px',
                            borderRadius: '4px',
                            fontWeight: 700,
                            letterSpacing: '0.5px',
                            textTransform: 'uppercase',
                            border: 'none',
                            cursor: 'pointer',
                            background: inStock ? '#dcfce7' : '#fee2e2',
                            color: inStock ? '#15803d' : '#b91c1c',
                          }}
                        >
                          {inStock ? 'IN STOCK' : 'OUT OF STOCK'}
                        </button>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '12px 18px', textAlign: 'center' }}>
                        <span
                          style={{
                            fontSize: '0.68rem',
                            padding: '3px 10px',
                            borderRadius: '4px',
                            fontWeight: 700,
                            letterSpacing: '0.5px',
                            textTransform: 'uppercase',
                            background: '#e0f2fe',
                            color: '#0369a1',
                          }}
                        >
                          ACTIVE
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '12px 18px', textAlign: 'center' }}>
                        <button
                          onClick={() => openEditModal(item)}
                          style={{
                            padding: '4px 12px',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            background: '#ffffff',
                            color: '#334155',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <i className="fa-solid fa-pencil" style={{ fontSize: '0.75rem' }}></i> Edit
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit / Add Modal (Matches Image 9) */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '20px',
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '12px',
              maxWidth: '560px',
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
              overflow: 'hidden',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '16px 24px',
                borderBottom: '1px solid #f1f5f9',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#1e293b', fontFamily: 'var(--font-display)' }}>
                {editingItem ? 'Edit Food Item' : 'Add New Dish'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  border: 'none',
                  background: 'none',
                  fontSize: '1.5rem',
                  lineHeight: 1,
                  color: '#94a3b8',
                  cursor: 'pointer',
                }}
              >
                &times;
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveSubmit} style={{ padding: '24px' }}>
              {/* Dish Name */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#1e293b', marginBottom: '6px' }}>
                  Dish Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                />
              </div>

              {/* Cuisine & Food Classification */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#1e293b', marginBottom: '6px' }}>
                    Cuisine Category <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: Number(e.target.value) })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#1e293b', marginBottom: '6px' }}>
                    Food Classification <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    value={formData.food_type}
                    onChange={(e) => setFormData({ ...formData, food_type: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                  >
                    <option value="veg">Vegetarian</option>
                    <option value="non-veg">Non-Vegetarian</option>
                  </select>
                </div>
              </div>

              {/* Price & Prep Time */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#1e293b', marginBottom: '6px' }}>
                    Price (₹) <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#1e293b', marginBottom: '6px' }}>
                    Estimated Prep Time (mins)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.preparation_time_minutes}
                    onChange={(e) => setFormData({ ...formData, preparation_time_minutes: Number(e.target.value) })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                  />
                </div>
              </div>

              {/* Description */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#1e293b', marginBottom: '6px' }}>
                  Description
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', fontFamily: 'inherit' }}
                />
              </div>

              {/* Dish Photo */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#1e293b', marginBottom: '6px' }}>
                  Dish Photo (JPG, PNG, WebP &lt; 2MB)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                />
                <span style={{ fontSize: '0.74rem', color: '#94a3b8', display: 'block', marginTop: '4px' }}>
                  Leave blank to keep existing photo.
                </span>
              </div>

              {/* Checkboxes: Available in Stock & Active on Menu */}
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '24px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600, color: '#1e293b' }}>
                  <input
                    type="checkbox"
                    checked={formData.is_available === 1}
                    onChange={(e) => setFormData({ ...formData, is_available: e.target.checked ? 1 : 0 })}
                  />
                  Available in Stock
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600, color: '#1e293b' }}>
                  <input
                    type="checkbox"
                    checked={formData.is_active === 1}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked ? 1 : 0 })}
                  />
                  Active on Menu
                </label>
              </div>

              {/* Modal Footer Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: '9px 20px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#475569',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: '9px 24px',
                    borderRadius: '6px',
                    border: 'none',
                    background: 'var(--color-accent)',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: saving ? 'not-allowed' : 'pointer',
                  }}
                >
                  {saving ? 'Saving...' : 'Save Dish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
