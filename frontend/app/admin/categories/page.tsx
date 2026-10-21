'use client';

import React, { useState, useEffect } from 'react';
import { api, Category } from '@/lib/api';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('fa-bowl-food');
  const [description, setDescription] = useState('');
  const [sortOrder, setSortOrder] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminCategories();
      if (res.success) setCategories(res.data.categories);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingCat(null);
    setName('');
    setIcon('fa-bowl-food');
    setDescription('');
    setSortOrder(categories.length + 1);
    setShowModal(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCat(cat);
    setName(cat.name);
    setIcon(cat.icon || 'fa-bowl-food');
    setDescription(cat.description || '');
    setSortOrder(cat.sort_order);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingCat) {
        await api.updateCategory(editingCat.id, {
          name: name.trim(),
          icon,
          description: description.trim() || undefined,
          sort_order: Number(sortOrder),
        });
      } else {
        await api.createCategory({
          name: name.trim(),
          icon,
          description: description.trim() || undefined,
          sort_order: Number(sortOrder),
        });
      }
      setShowModal(false);
      await fetchCategories();
    } catch (err: any) {
      alert(err.message || 'Operation failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-categories-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-heading">
            <i className="fa-solid fa-layer-group"></i> Cuisine Categories
          </h1>
          <p className="admin-subheading">Organize food dishes into kiosk sections with custom icons</p>
        </div>
        <button className="btn btn-accent" onClick={openCreateModal}>
          <i className="fa-solid fa-plus"></i> New Category
        </button>
      </div>

      <div className="admin-table-card mt-4">
        {loading ? (
          <div className="text-center py-5">
            <i className="fa-solid fa-spinner fa-spin fa-2x"></i>
            <p className="mt-3">Loading categories...</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>Icon</th>
                  <th>Category Title</th>
                  <th>URL Slug</th>
                  <th>Description</th>
                  <th>Sort Order</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <tr key={cat.id}>
                    <td>
                      <div className="category-table-icon">
                        <i className={`fa-solid ${cat.icon || 'fa-bowl-food'}`}></i>
                      </div>
                    </td>
                    <td className="font-weight-bold">{cat.name}</td>
                    <td><code>{cat.slug}</code></td>
                    <td className="text-muted">{cat.description || '—'}</td>
                    <td>{cat.sort_order}</td>
                    <td>
                      <span className="badge-pill badge-active">Active</span>
                    </td>
                    <td>
                      <button
                        className="btn btn-outline-secondary btn-xs"
                        onClick={() => openEditModal(cat)}
                      >
                        <i className="fa-solid fa-pen-to-square"></i> Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h3>{editingCat ? 'Edit Cuisine Category' : 'Create Category'}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-3">
              <div className="form-group mb-3">
                <label className="form-label">Category Title</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. South Indian"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group mb-3">
                <label className="form-label">Font Awesome Icon Class</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="fa-bowl-food"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  required
                />
              </div>

              <div className="form-group mb-3">
                <label className="form-label">Menu Display Sort Order</label>
                <input
                  type="number"
                  className="form-control"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(Number(e.target.value))}
                  required
                />
              </div>

              <div className="form-group mb-3">
                <label className="form-label">Short Description</label>
                <textarea
                  className="form-control"
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
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
                <button type="submit" className="btn btn-accent" disabled={saving}>
                  {saving ? 'Saving...' : editingCat ? 'Save Changes' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

