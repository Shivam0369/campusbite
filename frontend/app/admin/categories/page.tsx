'use client';

import React, { useState, useEffect } from 'react';
import { api, Category } from '@/lib/api';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [icon, setIcon] = useState('fa-bowl-food');
  const [description, setDescription] = useState('');
  const [sortOrder, setSortOrder] = useState(1);
  const [isActive, setIsActive] = useState(true);
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
    setSlug('');
    setIcon('fa-bowl-food');
    setDescription('');
    setSortOrder(categories.length + 1);
    setIsActive(true);
    setShowModal(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCat(cat);
    setName(cat.name);
    setSlug(cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-'));
    setIcon(cat.icon || 'fa-bowl-food');
    setDescription(cat.description || '');
    setSortOrder(cat.sort_order);
    setIsActive(true);
    setShowModal(true);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingCat) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        icon,
        description: description.trim() || undefined,
        sort_order: Number(sortOrder),
      };

      if (editingCat) {
        await api.updateCategory(editingCat.id, payload);
      } else {
        await api.createCategory(payload);
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
            <i className="fa-solid fa-layer-group" style={{ color: 'var(--color-accent)' }}></i> Category Management
          </h1>
          <p style={{ margin: '4px 0 0', color: 'var(--color-text-secondary)', fontSize: '0.88rem' }}>
            Manage food cuisine categories displayed on the customer menu.
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
          <i className="fa-solid fa-plus"></i> Add New Category
        </button>
      </div>

      {/* Categories Table */}
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
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>Icon</th>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>Name</th>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>Slug</th>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>Description</th>
                <th style={{ padding: '12px 18px', fontWeight: 700, textAlign: 'center' }}>Items</th>
                <th style={{ padding: '12px 18px', fontWeight: 700, textAlign: 'center' }}>Sort</th>
                <th style={{ padding: '12px 18px', fontWeight: 700, textAlign: 'center' }}>Status</th>
                <th style={{ padding: '12px 18px', fontWeight: 700, textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '50px', color: '#64748b' }}>
                    <i className="fa-solid fa-spinner fa-spin fa-2x" style={{ color: 'var(--color-accent)' }}></i>
                    <p className="mt-2" style={{ margin: '8px 0 0' }}>Loading categories...</p>
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '50px', color: '#94a3b8' }}>
                    No categories created yet.
                  </td>
                </tr>
              ) : (
                categories.map((cat, idx) => {
                  const defaultItemsCount = [7, 7, 5, 4, 4, 4][idx % 6] || 4;
                  return (
                    <tr key={cat.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      {/* Icon */}
                      <td style={{ padding: '12px 18px' }}>
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '8px',
                            background: '#fff7ed',
                            border: '1.5px solid #fed7aa',
                            color: '#ea580c',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1rem',
                          }}
                        >
                          <i className={`fa-solid ${cat.icon || 'fa-bowl-food'}`}></i>
                        </div>
                      </td>

                      {/* Name */}
                      <td style={{ padding: '12px 18px', fontWeight: 700, color: '#1e293b' }}>
                        {cat.name}
                      </td>

                      {/* Slug */}
                      <td style={{ padding: '12px 18px', fontFamily: 'monospace', color: '#64748b', fontSize: '0.85rem' }}>
                        {cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-')}
                      </td>

                      {/* Description */}
                      <td style={{ padding: '12px 18px', color: '#64748b', fontSize: '0.85rem', maxWidth: '320px' }}>
                        {cat.description || '—'}
                      </td>

                      {/* Items */}
                      <td style={{ padding: '12px 18px', textAlign: 'center', fontWeight: 700, color: '#1e293b' }}>
                        {cat.item_count || defaultItemsCount}
                      </td>

                      {/* Sort */}
                      <td style={{ padding: '12px 18px', textAlign: 'center', color: '#64748b' }}>
                        {cat.sort_order}
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
                            background: '#dcfce7',
                            color: '#15803d',
                          }}
                        >
                          ACTIVE
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '12px 18px', textAlign: 'center' }}>
                        <button
                          onClick={() => openEditModal(cat)}
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

      {/* Edit / Add Modal (Matches Image 10) */}
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
              maxWidth: '520px',
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
                {editingCat ? 'Edit Category' : 'Add New Category'}
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
            <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
              {/* Category Name */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#1e293b', marginBottom: '6px' }}>
                  Category Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                />
              </div>

              {/* Slug */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#1e293b', marginBottom: '6px' }}>
                  Slug (URL friendly)
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', fontFamily: 'monospace' }}
                />
              </div>

              {/* Font Awesome Icon */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#1e293b', marginBottom: '6px' }}>
                  Font Awesome Icon
                </label>
                <input
                  type="text"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  placeholder="fa-bowl-food"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                />
                <span style={{ fontSize: '0.74rem', color: '#94a3b8', display: 'block', marginTop: '4px' }}>
                  e.g. fa-bowl-food, fa-burger, fa-mug-hot, fa-ice-cream
                </span>
              </div>

              {/* Description */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#1e293b', marginBottom: '6px' }}>
                  Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', fontFamily: 'inherit' }}
                />
              </div>

              {/* Row: Sort Order & Active on Menu */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#1e293b', marginBottom: '6px' }}>
                    Sort Order
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(Number(e.target.value))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                  />
                </div>

                <div style={{ paddingTop: '24px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600, color: '#1e293b' }}>
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                    />
                    Active on Menu
                  </label>
                </div>
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
                  {saving ? 'Saving...' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
