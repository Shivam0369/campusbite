'use client';

import React, { useState, useEffect } from 'react';
import { api, MenuItem, Category } from '@/lib/api';

export default function AdminMenuItemsPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category_id: 1,
    price: '',
    food_type: 'veg',
    description: '',
    preparation_time_minutes: 15,
    is_available: 1,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleDelete = async (itemId: number, name: string) => {
    if (!confirm(`Are you sure you want to remove '${name}' from the menu?`)) return;
    try {
      const res = await api.deleteMenuItem(itemId);
      if (res.success) {
        setItems((prev) => prev.filter((i) => i.id !== itemId));
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete item.');
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
    });
    setError(null);
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
    });
    setError(null);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const priceNum = parseFloat(formData.price);
    if (isNaN(priceNum) || priceNum <= 0) {
      setError('Price must be greater than zero.');
      return;
    }

    setSaving(true);
    try {
      if (editingItem) {
        const res = await api.updateMenuItem(editingItem.id, {
          name: formData.name.trim(),
          category_id: Number(formData.category_id),
          price: priceNum,
          food_type: formData.food_type,
          description: formData.description.trim() || undefined,
          preparation_time_minutes: Number(formData.preparation_time_minutes),
          is_available: formData.is_available,
        });
        if (res.success) {
          setShowModal(false);
          await fetchData();
        }
      } else {
        const res = await api.createMenuItem({
          name: formData.name.trim(),
          category_id: Number(formData.category_id),
          price: priceNum,
          food_type: formData.food_type,
          description: formData.description.trim() || undefined,
          preparation_time_minutes: Number(formData.preparation_time_minutes),
          is_available: formData.is_available,
        });
        if (res.success) {
          setShowModal(false);
          await fetchData();
        }
      }
    } catch (err: any) {
      setError(err.message || 'Saving failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-menu-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-heading">
            <i className="fa-solid fa-bowl-food"></i> Food Menu Items
          </h1>
          <p className="admin-subheading">Add dishes, update prices, and manage live canteen stock toggles</p>
        </div>
        <button className="btn btn-accent" onClick={openCreateModal}>
          <i className="fa-solid fa-plus"></i> Add New Dish
        </button>
      </div>

      {/* Items Table */}
      <div className="admin-table-card mt-4">
        {loading ? (
          <div className="text-center py-5">
            <i className="fa-solid fa-spinner fa-spin fa-2x"></i>
            <p className="mt-3">Loading menu items...</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>Dish</th>
                  <th>Cuisine Category</th>
                  <th>Price</th>
                  <th>Type</th>
                  <th>Prep Time</th>
                  <th>Live Stock</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const isAvail = item.is_available === 1;
                  const imgUrl = item.image_path ? `/${item.image_path}` : '/assets/images/food/default-food.svg';

                  return (
                    <tr key={item.id}>
                      <td>
                        <div className="dish-table-cell">
                          <img
                            src={imgUrl}
                            alt={item.name}
                            className="dish-table-thumbnail"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/assets/images/food/default-food.svg';
                            }}
                          />
                          <div>
                            <strong className="dish-name-cell">{item.name}</strong>
                            {item.description && (
                              <div className="dish-desc-cell text-muted">{item.description}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge-pill badge-cuisine">
                          {item.category_name || 'General'}
                        </span>
                      </td>
                      <td className="font-weight-bold">₹{Number(item.price).toFixed(2)}</td>
                      <td>
                        <span className={`badge-diet ${item.food_type === 'veg' ? 'veg' : 'nonveg'}`}>
                          {item.food_type.toUpperCase()}
                        </span>
                      </td>
                      <td>{item.preparation_time_minutes} min</td>
                      <td>
                        <button
                          className={`btn-stock-toggle ${isAvail ? 'in-stock' : 'out-of-stock'}`}
                          onClick={() => handleToggleStock(item.id)}
                          title="Click to toggle availability"
                        >
                          <i className={`fa-solid ${isAvail ? 'fa-toggle-on' : 'fa-toggle-off'}`}></i>{' '}
                          {isAvail ? 'In Stock' : 'Sold Out'}
                        </button>
                      </td>
                      <td>
                        <div className="btn-group">
                          <button
                            className="btn btn-outline-secondary btn-xs mr-1"
                            onClick={() => openEditModal(item)}
                            title="Edit dish"
                          >
                            <i className="fa-solid fa-pen-to-square"></i>
                          </button>
                          <button
                            className="btn btn-outline-danger btn-xs"
                            onClick={() => handleDelete(item.id, item.name)}
                            title="Delete dish"
                          >
                            <i className="fa-solid fa-trash-can"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h3>{editingItem ? 'Edit Dish' : 'Add New Food Item'}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {error && <div className="alert alert-danger mt-2">{error}</div>}

            <form onSubmit={handleSubmit} className="mt-3">
              <div className="form-group mb-3">
                <label className="form-label">Dish Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Masala Dosa"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-row mb-3">
                <div className="form-group form-col">
                  <label className="form-label">Cuisine Category</label>
                  <select
                    className="form-control"
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: Number(e.target.value) })}
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group form-col">
                  <label className="form-label">Price in INR (₹)</label>
                  <input
                    type="number"
                    step="0.5"
                    className="form-control"
                    placeholder="90.00"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-row mb-3">
                <div className="form-group form-col">
                  <label className="form-label">Dietary Classification</label>
                  <select
                    className="form-control"
                    value={formData.food_type}
                    onChange={(e) => setFormData({ ...formData, food_type: e.target.value })}
                  >
                    <option value="veg">Vegetarian</option>
                    <option value="non-veg">Non-Vegetarian</option>
                  </select>
                </div>

                <div className="form-group form-col">
                  <label className="form-label">Estimated Prep Duration (min)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.preparation_time_minutes}
                    onChange={(e) => setFormData({ ...formData, preparation_time_minutes: Number(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div className="form-group mb-3">
                <label className="form-label">Description / Ingredients</label>
                <textarea
                  className="form-control"
                  rows={2}
                  placeholder="Portion size, ingredients, accompaniments..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                ></textarea>
              </div>

              <div className="modal-actions mt-4">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-accent"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : editingItem ? 'Save Changes' : 'Create Dish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

