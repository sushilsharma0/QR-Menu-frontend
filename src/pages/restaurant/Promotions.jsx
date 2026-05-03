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
    <div className="space-y-6">
      <Card title="Create Promotion">
        <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4 p-4">
          <input className="border rounded p-2" placeholder="Promo name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
          <input className="border rounded p-2" placeholder="Promo code" value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} />
          <select className="border rounded p-2" value={form.discountType} onChange={(e) => setForm((p) => ({ ...p, discountType: e.target.value }))}>
            <option value="percent">Percent</option>
            <option value="flat">Flat</option>
          </select>
          <input className="border rounded p-2" type="number" min="1" placeholder="Discount value" value={form.discountValue} onChange={(e) => setForm((p) => ({ ...p, discountValue: e.target.value }))} />
          <select className="border rounded p-2" value={form.scope} onChange={(e) => setForm((p) => ({ ...p, scope: e.target.value, targetMenuItems: [] }))}>
            <option value="order">Order level</option>
            <option value="item">Specific menu items</option>
          </select>
          <input className="border rounded p-2" type="number" min="0" placeholder="Minimum order amount" value={form.minOrderAmount} onChange={(e) => setForm((p) => ({ ...p, minOrderAmount: e.target.value }))} />
          <input className="border rounded p-2" type="number" min="0" placeholder="Max discount amount (optional)" value={form.maxDiscountAmount} onChange={(e) => setForm((p) => ({ ...p, maxDiscountAmount: e.target.value }))} />
          <input className="border rounded p-2" type="number" min="1" placeholder="Usage limit (optional)" value={form.usageLimit} onChange={(e) => setForm((p) => ({ ...p, usageLimit: e.target.value }))} />
          <input className="border rounded p-2" type="datetime-local" value={form.startAt} onChange={(e) => setForm((p) => ({ ...p, startAt: e.target.value }))} />
          <input className="border rounded p-2" type="datetime-local" value={form.endAt} onChange={(e) => setForm((p) => ({ ...p, endAt: e.target.value }))} />
          <input className="border rounded p-2 md:col-span-2" placeholder="Banner text for customer panel" value={form.bannerText} onChange={(e) => setForm((p) => ({ ...p, bannerText: e.target.value }))} />
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-600">Banner color</label>
            <input type="color" value={form.bannerColor} onChange={(e) => setForm((p) => ({ ...p, bannerColor: e.target.value }))} />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))} />
              Active
            </label>
          </div>
          {form.scope === 'item' && (
            <select
              multiple
              className="border rounded p-2 md:col-span-2 min-h-32"
              value={form.targetMenuItems}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  targetMenuItems: Array.from(e.target.selectedOptions).map((o) => o.value),
                }))
              }
            >
              {menuItems.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.name}
                </option>
              ))}
            </select>
          )}
          <div className="md:col-span-2 flex gap-2">
            <Button type="submit">{editingId ? 'Update Promo' : 'Create Promo'}</Button>
            {editingId && (
              <Button variant="ghost" type="button" onClick={resetForm}>
                Cancel edit
              </Button>
            )}
          </div>
        </form>
      </Card>

      <Card title="Existing Promotions">
        <div className="overflow-x-auto p-4">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2">Name</th>
                <th>Code</th>
                <th>Type</th>
                <th>Value</th>
                <th>Scope</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {promotions.map((promo) => (
                <tr key={promo._id} className="border-b">
                  <td className="py-2">{promo.name}</td>
                  <td>{promo.code}</td>
                  <td>{promo.discountType}</td>
                  <td>{promo.discountValue}</td>
                  <td>{promo.scope}</td>
                  <td>{promo.isActive ? 'Active' : 'Inactive'}</td>
                  <td className="space-x-2">
                    <button className="text-blue-600" onClick={() => handleEdit(promo)}>Edit</button>
                    <button className="text-red-600" onClick={() => handleDelete(promo._id)}>Delete</button>
                  </td>
                </tr>
              ))}
              {promotions.length === 0 && (
                <tr>
                  <td className="py-4 text-gray-500" colSpan={7}>
                    No promotions yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

export default Promotions
