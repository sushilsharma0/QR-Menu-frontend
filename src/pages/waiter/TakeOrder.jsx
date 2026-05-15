import React, { useEffect, useMemo, useState } from 'react'
import { FiGrid, FiSearch, FiUser } from 'react-icons/fi'
import { useSearchParams } from 'react-router-dom'
import toast from '@utils/toast'
import api from '../../services/api'
import { useAuth } from '../../hooks/useAuth'
import Cart from './Cart'

const TakeOrder = () => {
  const { user } = useAuth()
  const currency = user?.currency || 'Rs.'
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [tables, setTables] = useState([])
  const [categories, setCategories] = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedTableId, setSelectedTableId] = useState(searchParams.get('tableId') || '')
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState({})
  const [customerName, setCustomerName] = useState('')

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const [tablesRes, categoriesRes, itemsRes] = await Promise.all([
          api.get('/restaurant/tables'),
          api.get('/restaurant/menu/categories'),
          api.get('/restaurant/menu/items', { params: { isAvailable: true } }),
        ])
        setTables(tablesRes.data?.data || [])
        setCategories(categoriesRes.data?.data || [])
        setMenuItems(itemsRes.data?.data || [])
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load menu and tables')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase()
    return menuItems.filter((item) => {
      const byCategory =
        selectedCategory === 'all' || String(item.category?._id || item.category) === selectedCategory
      const bySearch = !q || item.name?.toLowerCase().includes(q)
      return byCategory && bySearch && item.isAvailable !== false
    })
  }, [menuItems, search, selectedCategory])

  const cartItems = useMemo(() => Object.values(cart), [cart])
  const total = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity * Number(item.price || 0), 0),
    [cartItems]
  )

  const addToCart = (item) => {
    setCart((prev) => {
      const existing = prev[item._id]
      return {
        ...prev,
        [item._id]: {
          _id: item._id,
          name: item.name,
          price: item.price,
          quantity: existing ? existing.quantity + 1 : 1,
        },
      }
    })
  }

  const updateQuantity = (itemId, delta) => {
    setCart((prev) => {
      const existing = prev[itemId]
      if (!existing) return prev
      const qty = existing.quantity + delta
      if (qty <= 0) {
        const cloned = { ...prev }
        delete cloned[itemId]
        return cloned
      }
      return { ...prev, [itemId]: { ...existing, quantity: qty } }
    })
  }

  const removeItem = (itemId) => {
    setCart((prev) => {
      const cloned = { ...prev }
      delete cloned[itemId]
      return cloned
    })
  }

  const submitOrder = async () => {
    if (!selectedTableId) {
      toast.error('Select a table first')
      return
    }
    if (cartItems.length === 0) {
      toast.error('Add at least one item')
      return
    }

    try {
      setSubmitting(true)
      await api.post('/restaurant/customer-orders', {
        tableId: selectedTableId,
        customerName: customerName.trim() || undefined,
        items: cartItems.map((item) => ({
          menuItemId: item._id,
          quantity: item.quantity,
        })),
      })
      toast.success('Order sent to kitchen')
      setCart({})
      setCustomerName('')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="text-center py-10 text-accent-700">Loading POS menu...</div>
  }

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-secondary-200 bg-gradient-to-r from-surface-50 to-white p-4 md:p-5">
        <h1 className="text-2xl font-bold text-primary-900">Take Order</h1>
        <p className="text-sm text-accent-700">POS mode: choose table, add items quickly, and send directly to kitchen.</p>
      </div>

      <div className="grid lg:grid-cols-[1fr_380px] gap-4">
      <div className="space-y-4">
        <div className="card p-4">
          <h2 className="text-lg font-bold text-primary-900 flex items-center gap-2">
            <FiGrid /> Order Details
          </h2>
          <p className="text-sm text-accent-700">Select table and optional customer name.</p>
          <div className="grid sm:grid-cols-2 gap-3 mt-3">
            <select
              className="input-field"
              value={selectedTableId}
              onChange={(e) => setSelectedTableId(e.target.value)}
            >
              <option value="">Select table</option>
              {tables.map((table) => (
                <option key={table._id} value={table._id}>
                  {table.tableNumber}
                </option>
              ))}
            </select>
            <input
              className="input-field"
              placeholder="Customer name (optional)"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </div>
          <div className="mt-3 text-xs text-accent-700 flex items-center gap-2">
            <FiUser />
            You are placing this as waiter: <span className="font-semibold text-primary-700">{user?.name || user?.username}</span>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex flex-wrap gap-2 mb-3">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1 rounded-full text-sm ${
                selectedCategory === 'all' ? 'bg-primary-600 text-white' : 'bg-surface-100 text-accent-800'
              }`}
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category._id}
                type="button"
                onClick={() => setSelectedCategory(category._id)}
                className={`px-3 py-1 rounded-full text-sm ${
                  selectedCategory === category._id
                    ? 'bg-primary-600 text-white'
                    : 'bg-surface-100 text-accent-800'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>

          <div className="relative mb-3">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-accent-600" />
            <input
              className="input-field pl-9"
              placeholder="Search menu item..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {filteredItems.map((item) => (
              <button
                type="button"
                key={item._id}
                onClick={() => addToCart(item)}
                className="text-left border border-surface-200 rounded-xl p-3 hover:border-primary-300 hover:shadow-sm transition-all"
              >
                <p className="font-semibold text-primary-900 text-sm">{item.name}</p>
                <p className="text-xs text-accent-700">
                  {currency}
                  {item.price}
                </p>
              </button>
            ))}
          </div>
          {filteredItems.length === 0 && (
            <p className="text-sm text-accent-700 mt-2">No menu items match your filters.</p>
          )}
        </div>
      </div>

      <div className="lg:sticky lg:top-20 h-fit">
        <Cart
          items={cartItems}
          currency={currency}
          onIncrease={(id) => updateQuantity(id, 1)}
          onDecrease={(id) => updateQuantity(id, -1)}
          onRemove={removeItem}
          total={total}
          onSubmit={submitOrder}
          submitting={submitting}
          disabled={!selectedTableId}
        />
      </div>
      </div>
    </div>
  )
}

export default TakeOrder
