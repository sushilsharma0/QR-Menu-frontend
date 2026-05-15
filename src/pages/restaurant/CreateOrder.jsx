import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from '@utils/toast'
import { FiArrowLeft, FiPlus, FiSearch, FiTrash2 } from 'react-icons/fi'
import api from '../../services/api'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import { useTenantRoutes } from '../../hooks/useTenantRoutes'
import { useAuth } from '../../hooks/useAuth'

const CreateOrder = () => {
  const navigate = useNavigate()
  const { restaurantBase } = useTenantRoutes()
  const { user } = useAuth()
  const currency = user?.currency || 'Rs.'

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [tables, setTables] = useState([])
  const [menuItems, setMenuItems] = useState([])

  const [tableId, setTableId] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [specialRequests, setSpecialRequests] = useState('')

  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(() => ({}))

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const [tRes, mRes] = await Promise.all([
          api.get('/restaurant/tables'),
          api.get('/restaurant/menu/items', { params: { isAvailable: true } }),
        ])
        setTables(tRes.data.data || [])
        setMenuItems(mRes.data.data || [])
      } catch (e) {
        toast.error('Failed to load tables/menu items')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filteredMenuItems = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return menuItems
    return menuItems.filter((i) => {
      const name = String(i?.name || '').toLowerCase()
      const desc = String(i?.description || '').toLowerCase()
      const cat = String(i?.category?.name || '').toLowerCase()
      return name.includes(q) || desc.includes(q) || cat.includes(q)
    })
  }, [menuItems, search])

  const selectedList = useMemo(() => Object.values(selected), [selected])

  const totals = useMemo(() => {
    let subtotal = 0
    selectedList.forEach((it) => {
      subtotal += Number(it.price || 0) * Number(it.quantity || 0)
    })
    return { subtotal }
  }, [selectedList])

  const addItem = (item) => {
    if (!item?._id) return
    setSelected((prev) => {
      const existing = prev[item._id]
      const nextQty = Math.min(999, Number(existing?.quantity || 0) + 1)
      return {
        ...prev,
        [item._id]: {
          menuItemId: item._id,
          name: item.name,
          price: item.price,
          quantity: nextQty,
          specialInstructions: existing?.specialInstructions || '',
        },
      }
    })
  }

  const updateQty = (menuItemId, quantity) => {
    const q = Number(quantity || 0)
    setSelected((prev) => {
      if (!prev[menuItemId]) return prev
      if (q <= 0) {
        const { [menuItemId]: _, ...rest } = prev
        return rest
      }
      return {
        ...prev,
        [menuItemId]: { ...prev[menuItemId], quantity: Math.min(999, q) },
      }
    })
  }

  const updateInstruction = (menuItemId, value) => {
    setSelected((prev) => {
      if (!prev[menuItemId]) return prev
      return { ...prev, [menuItemId]: { ...prev[menuItemId], specialInstructions: value } }
    })
  }

  const removeItem = (menuItemId) => {
    setSelected((prev) => {
      const { [menuItemId]: _, ...rest } = prev
      return rest
    })
  }

  const canSubmit =
    tableId &&
    customerName.trim().length > 0 &&
    selectedList.length > 0 &&
    !submitting

  const submit = async () => {
    if (!canSubmit) return
    try {
      setSubmitting(true)
      const payload = {
        tableId,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim() || undefined,
        customerEmail: customerEmail.trim() || undefined,
        specialRequests: specialRequests.trim() || undefined,
        items: selectedList.map((i) => ({
          menuItemId: i.menuItemId,
          quantity: Number(i.quantity),
          specialInstructions: i.specialInstructions || '',
        })),
      }
      const res = await api.post('/restaurant/customer-orders', payload)
      const orderId = res?.data?.data?.orderId
      toast.success('Order created')
      if (orderId) navigate(`${restaurantBase}/orders/${orderId}`)
      else navigate(`${restaurantBase}/orders`)
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to create order')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate(`${restaurantBase}/orders`)}>
            <FiArrowLeft className="mr-2" /> Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create Order (Manual)</h1>
            <p className="text-gray-500 mt-1">Use this when a customer can’t place an order via QR.</p>
          </div>
        </div>
        <Button onClick={submit} loading={submitting} disabled={!canSubmit}>
          Create Order
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card title="Customer & Table">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Table *</label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                  value={tableId}
                  onChange={(e) => setTableId(e.target.value)}
                >
                  <option value="">Select table</option>
                  {tables
                    .filter((t) => t?.isActive !== false && t?.isDeleted !== true)
                    .map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.tableNumber}
                      </option>
                    ))}
                </select>
              </div>

              <Input
                label="Customer name *"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Walk-in / John"
              />
              <Input
                label="Phone (optional)"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="e.g. 98xxxxxxxx"
              />
              <Input
                label="Email (optional)"
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="e.g. customer@email.com"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Special requests (optional)</label>
                <textarea
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  placeholder="Any special requests?"
                />
              </div>
            </div>
          </Card>

          <Card title="Summary">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Items</span>
                <span className="font-medium">{selectedList.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-semibold">
                  {currency}
                  {totals.subtotal.toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-gray-500 pt-2">
                Tax is calculated server-side per item tax rate after submission.
              </p>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card
            title="Add Menu Items"
            actions={
              <div className="w-72 max-w-full">
                <Input
                  icon={FiSearch}
                  placeholder="Search items..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            }
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredMenuItems.map((i) => (
                <div key={i._id} className="border border-gray-200 rounded-xl p-4 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{i.name}</p>
                    <p className="text-sm text-gray-500">
                      {currency}
                      {Number(i.price || 0).toFixed(2)}
                      {i?.category?.name ? ` • ${i.category.name}` : ''}
                    </p>
                    {i.description && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{i.description}</p>}
                  </div>
                  <Button size="sm" onClick={() => addItem(i)}>
                    <FiPlus className="mr-1" /> Add
                  </Button>
                </div>
              ))}
              {filteredMenuItems.length === 0 && (
                <div className="text-sm text-gray-500">No items match your search.</div>
              )}
            </div>
          </Card>

          <Card title="Selected Items">
            {selectedList.length === 0 ? (
              <p className="text-sm text-gray-500">No items selected yet.</p>
            ) : (
              <div className="space-y-4">
                {selectedList.map((i) => (
                  <div key={i.menuItemId} className="border border-gray-200 rounded-xl p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{i.name}</p>
                        <p className="text-sm text-gray-500">
                          {currency}
                          {Number(i.price || 0).toFixed(2)}
                        </p>
                      </div>
                      <Button variant="ghost" className="text-red-600 hover:text-red-700" onClick={() => removeItem(i.menuItemId)}>
                        <FiTrash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Quantity</label>
                        <input
                          type="number"
                          min={1}
                          max={999}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                          value={i.quantity}
                          onChange={(e) => updateQty(i.menuItemId, e.target.value)}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Special instructions</label>
                        <input
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                          value={i.specialInstructions || ''}
                          onChange={(e) => updateInstruction(i.menuItemId, e.target.value)}
                          placeholder="e.g. Less spicy"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end text-sm pt-3">
                      <span className="font-semibold text-gray-900">
                        Line total: {currency}
                        {(Number(i.price || 0) * Number(i.quantity || 0)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}

export default CreateOrder

