import React, { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import api from '../../services/api'
import {
  getPromotions,
  createPromotion,
  updatePromotion,
  deletePromotion,
} from '../../services/restaurant'

const initialForm = {
  name: '',
  code: '',
  discountType: 'percent',
  discountValue: '',
  scope: 'order',
  targetMenuItems: [],
  minOrderAmount: '',
  maxDiscountAmount: '',
  startAt: '',
  endAt: '',
  usageLimit: '',
  bannerText: '',
  bannerColor: '#f97316',
  isActive: true,
}

const Promotions = () => {
  const [promotions, setPromotions] = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(initialForm)

  const fetchData = async () => {
    try {
      setLoading(true)
      const [promoRes, itemsRes] = await Promise.all([
        getPromotions(),
        api.get('/restaurant/menu/items'),
      ])
      setPromotions(promoRes.data || [])
      setMenuItems(itemsRes?.data?.data || [])
    } catch (err) {
      toast.error('Failed to load promotions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const resetForm = () => {
    setForm(initialForm)
    setEditingId(null)
  }

  const payload = useMemo(
    () => ({
      ...form,
      code: form.code.trim().toUpperCase(),
      discountValue: Number(form.discountValue),
      minOrderAmount: Number(form.minOrderAmount || 0),
      maxDiscountAmount: form.maxDiscountAmount ? Number(form.maxDiscountAmount) : null,
      usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
      targetMenuItems: form.scope === 'item' ? form.targetMenuItems : [],
    }),
    [form]
  )

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.code || !form.discountValue || !form.startAt || !form.endAt) {
      toast.error('Please fill all required fields')
      return
    }

    try {
      if (editingId) {
        await updatePromotion(editingId, payload)
        toast.success('Promotion updated')
      } else {
        await createPromotion(payload)
        toast.success('Promotion created')
      }
      resetForm()
      fetchData()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save promotion')
    }
  }

  const handleEdit = (promo) => {
    setEditingId(promo._id)
    setForm({
      name: promo.name || '',
      code: promo.code || '',
      discountType: promo.discountType || 'percent',
      discountValue: promo.discountValue || '',
      scope: promo.scope || 'order',
      targetMenuItems: (promo.targetMenuItems || []).map((item) =>
        typeof item === 'string' ? item : item._id
      ),
      minOrderAmount: promo.minOrderAmount || '',
      maxDiscountAmount: promo.maxDiscountAmount || '',
      startAt: promo.startAt ? new Date(promo.startAt).toISOString().slice(0, 16) : '',
      endAt: promo.endAt ? new Date(promo.endAt).toISOString().slice(0, 16) : '',
      usageLimit: promo.usageLimit || '',
      bannerText: promo.bannerText || '',
      bannerColor: promo.bannerColor || '#f97316',
      isActive: promo.isActive ?? true,
    })
  }

  const handleDelete = async (id) => {
    try {
      await deletePromotion(id)
      toast.success('Promotion deleted')
      fetchData()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete promotion')
    }
  }

  if (loading) return <div className="text-center py-10">Loading promotions...</div>

  return (
  <div className="space-y-8">
    {/* ================= CREATE PROMO ================= */}
    <Card title="🎯 Create Promotion">
      <form onSubmit={handleSubmit} className="p-6 space-y-8">

  {/* ===== BASIC INFO ===== */}
  <div>
    <h3 className="text-sm font-semibold text-gray-600 mb-4">
      Basic Information
    </h3>

    <div className="grid md:grid-cols-2 gap-5">
      <div>
        <label className="label">Promotion Name</label>
        <input
          type="text"
          className="input"
          value={form.name}
          onChange={(e) =>
            setForm((p) => ({ ...p, name: e.target.value }))
          }
        />
      </div>

      <div>
        <label className="label">Promo Code</label>
        <input
          type="text"
          className="input uppercase"
          value={form.code}
          onChange={(e) =>
            setForm((p) => ({ ...p, code: e.target.value }))
          }
        />
      </div>
    </div>
  </div>

  {/* ===== DISCOUNT ===== */}
  <div>
    <h3 className="text-sm font-semibold text-gray-600 mb-4">
      Discount Details
    </h3>

    <div className="grid md:grid-cols-3 gap-5">
      <div>
        <label className="label">Discount Type</label>
        <select
          className="input"
          value={form.discountType}
          onChange={(e) =>
            setForm((p) => ({ ...p, discountType: e.target.value }))
          }
        >
          <option value="percent">Percentage (%)</option>
          <option value="flat">Flat Amount (Rs)</option>
        </select>
      </div>

      <div>
        <label className="label">Discount Value</label>
        <input
          type="number"
          className="input"
          value={form.discountValue}
          onChange={(e) =>
            setForm((p) => ({ ...p, discountValue: e.target.value }))
          }
        />
      </div>

      <div>
        <label className="label">Apply To</label>
        <select
          className="input"
          value={form.scope}
          onChange={(e) =>
            setForm((p) => ({
              ...p,
              scope: e.target.value,
              targetMenuItems: [],
            }))
          }
        >
          <option value="order">Entire Order</option>
          <option value="item">Specific Items</option>
        </select>
      </div>
    </div>
  </div>

  {/* ===== CONDITIONS ===== */}
  <div>
    <h3 className="text-sm font-semibold text-gray-600 mb-4">
      Conditions
    </h3>

    <div className="grid md:grid-cols-3 gap-5">
      <div>
        <label className="label">Minimum Order (Rs)</label>
        <input
          type="number"
          className="input"
          value={form.minOrderAmount}
          onChange={(e) =>
            setForm((p) => ({ ...p, minOrderAmount: e.target.value }))
          }
        />
      </div>

      <div>
        <label className="label">Max Discount (Optional)</label>
        <input
          type="number"
          className="input"
          value={form.maxDiscountAmount}
          onChange={(e) =>
            setForm((p) => ({ ...p, maxDiscountAmount: e.target.value }))
          }
        />
      </div>

      <div>
        <label className="label">Usage Limit</label>
        <input
          type="number"
          className="input"
          value={form.usageLimit}
          onChange={(e) =>
            setForm((p) => ({ ...p, usageLimit: e.target.value }))
          }
        />
      </div>
    </div>
  </div>

  {/* ===== DATE ===== */}
  <div>
    <h3 className="text-sm font-semibold text-gray-600 mb-4">
      Validity
    </h3>

    <div className="grid md:grid-cols-2 gap-5">
      <div>
        <label className="label">Start Date</label>
        <input
          type="datetime-local"
          className="input"
          value={form.startAt}
          onChange={(e) =>
            setForm((p) => ({ ...p, startAt: e.target.value }))
          }
        />
      </div>

      <div>
        <label className="label">End Date</label>
        <input
          type="datetime-local"
          className="input"
          value={form.endAt}
          onChange={(e) =>
            setForm((p) => ({ ...p, endAt: e.target.value }))
          }
        />
      </div>
    </div>
  </div>

  {/* ===== BANNER ===== */}
  <div>
    <h3 className="text-sm font-semibold text-gray-600 mb-4">
      Banner Settings
    </h3>

    <div className="flex gap-4 items-end">
      <div className="flex-1">
        <label className="label">Banner Text</label>
        <input
          className="input"
          value={form.bannerText}
          onChange={(e) =>
            setForm((p) => ({ ...p, bannerText: e.target.value }))
          }
        />
      </div>

      <div>
        <label className="label">Color</label>
        <input
          type="color"
          value={form.bannerColor}
          onChange={(e) =>
            setForm((p) => ({ ...p, bannerColor: e.target.value }))
          }
          className="h-12 w-16 rounded-lg border"
        />
      </div>
    </div>
  </div>

  {/* ===== ACTIVE ===== */}
  <div className="flex items-center gap-3">
    <input
      type="checkbox"
      checked={form.isActive}
      onChange={(e) =>
        setForm((p) => ({ ...p, isActive: e.target.checked }))
      }
    />
    <span className="text-sm text-gray-700">Active Promotion</span>
  </div>

  {/* ===== BUTTONS ===== */}
  <div className="flex gap-3 pt-4 border-t">
    <button className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-semibold transition">
      {editingId ? "Update Promotion" : "Create Promotion"}
    </button>

    {editingId && (
      <button
        type="button"
        onClick={resetForm}
        className="px-6 py-3 rounded-xl bg-gray-100 hover:bg-gray-200"
      >
        Cancel
      </button>
    )}
  </div>
</form>
    </Card>

    {/* ================= TABLE ================= */}
    <Card title="📊 Promotions">
      <div className="overflow-x-auto p-4">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th>Name</th>
              <th>Code</th>
              <th>Discount</th>
              <th>Scope</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {promotions.map((promo) => (
              <tr
                key={promo._id}
                className="border-b hover:bg-gray-50 transition"
              >
                <td className="py-3 font-medium">{promo.name}</td>

                <td className="font-mono text-orange-500">
                  {promo.code}
                </td>

                <td>
                  {promo.discountType === "percent"
                    ? `${promo.discountValue}%`
                    : `Rs ${promo.discountValue}`}
                </td>

                <td>{promo.scope}</td>

                {/* STATUS BADGE */}
                <td>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      promo.isActive
                        ? "bg-green-100 text-green-600"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {promo.isActive ? "Active" : "Inactive"}
                  </span>
                </td>

                <td className="space-x-3">
                  <button
                    onClick={() => handleEdit(promo)}
                    className="text-blue-500 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(promo._id)}
                    className="text-red-500 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}

            {promotions.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-6 text-gray-400">
                  No promotions created yet 🚀
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  </div>
);
}

export default Promotions
