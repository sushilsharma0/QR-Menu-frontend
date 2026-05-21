import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from '@utils/toast'
import { FiCoffee, FiMinus, FiPlus, FiSearch, FiShoppingBag, FiTrash2, FiUsers } from 'react-icons/fi'
import api from '../../../services/api'
import { createPosOrder } from '../../../services/posApi'
import { usePosCartStore } from '../../../stores/posCartStore'
import { usePosAccess } from '../../../hooks/usePosAccess'
import { useSocket } from '../../../hooks/useSocket'
import { posSounds } from '../../../utils/posSounds'
import {
  drainOfflinePosQueue,
  enqueueOfflinePosAction,
  isOnline,
} from '../../../lib/posOfflineQueue'

export default function PosMain() {
  const { canTakeOrder } = usePosAccess()
  const { socket } = useSocket()
  const [categories, setCategories] = useState([])
  const [activeCategory, setActiveCategory] = useState(null)
  const [items, setItems] = useState([])
  const [loadingMenu, setLoadingMenu] = useState(true)
  const [search, setSearch] = useState('')
  const [tableFilter, setTableFilter] = useState('')
  const [tables, setTables] = useState([])
  const [submitting, setSubmitting] = useState(false)

  const mode = usePosCartStore((s) => s.mode)
  const setMode = usePosCartStore((s) => s.setMode)
  const tableId = usePosCartStore((s) => s.tableId)
  const setField = usePosCartStore((s) => s.setField)
  const guestsCount = usePosCartStore((s) => s.guestsCount)
  const customerName = usePosCartStore((s) => s.customerName)
  const customerPhone = usePosCartStore((s) => s.customerPhone)
  const deliveryAddress = usePosCartStore((s) => s.deliveryAddress)
  const riderName = usePosCartStore((s) => s.riderName)
  const riderPhone = usePosCartStore((s) => s.riderPhone)
  const deliveryCharge = usePosCartStore((s) => s.deliveryCharge)
  const discountAmount = usePosCartStore((s) => s.discountAmount)
  const discountPercent = usePosCartStore((s) => s.discountPercent)
  const serviceChargeAmount = usePosCartStore((s) => s.serviceChargeAmount)
  const promoCode = usePosCartStore((s) => s.promoCode)
  const lines = usePosCartStore((s) => s.lines)
  const addLine = usePosCartStore((s) => s.addLine)
  const updateLine = usePosCartStore((s) => s.updateLine)
  const removeLine = usePosCartStore((s) => s.removeLine)
  const clearCart = usePosCartStore((s) => s.clearCart)
  const cartTotals = usePosCartStore((s) => s.cartTotals)

  const totals = cartTotals()

  const loadCategories = useCallback(async () => {
    try {
      const res = await api.get('/restaurant/menu/categories')
      const data = res.data?.data || []
      setCategories(data)
      if (data[0]) setActiveCategory(data[0]._id)
    } catch {
      toast.error('Could not load categories')
    } finally {
      setLoadingMenu(false)
    }
  }, [])

  const loadTables = useCallback(async () => {
    try {
      const res = await api.get('/restaurant/tables')
      const list = res.data?.data || []
      const arr = Array.isArray(list) ? list : []
      setTables(arr.filter((t) => !String(t.tableNumber || '').startsWith('POS-')))
    } catch {
      setTables([])
    }
  }, [])

  useEffect(() => {
    loadCategories()
    loadTables()
  }, [loadCategories, loadTables])

  useEffect(() => {
    const onOnline = () => {
      drainOfflinePosQueue(async (row) => {
        if (row.action === 'createPosOrder') {
          await createPosOrder(row.payload)
        }
      })
    }
    window.addEventListener('online', onOnline)
    return () => window.removeEventListener('online', onOnline)
  }, [])

  useEffect(() => {
    if (!socket) return undefined
    const play = () => posSounds.newOrder()
    socket.on('pos:new_order', play)
    socket.on('pos:kitchen_ready', () => posSounds.kitchenReady())
    return () => {
      socket.off('pos:new_order', play)
      socket.off('pos:kitchen_ready')
    }
  }, [socket])

  useEffect(() => {
    let cancelled = false
    async function run() {
      if (search.trim()) {
        try {
          const res = await api.get('/restaurant/menu/items', {
            params: { search: search.trim(), isAvailable: true },
          })
          if (!cancelled) setItems(res.data?.data || [])
        } catch {
          if (!cancelled) setItems([])
        }
        return
      }
      if (!activeCategory) {
        setItems([])
        return
      }
      try {
        const res = await api.get('/restaurant/menu/items', {
          params: { category: activeCategory, isAvailable: true },
        })
        if (!cancelled) setItems(res.data?.data || [])
      } catch {
        if (!cancelled) setItems([])
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [activeCategory, search])

  const filteredTables = useMemo(() => {
    if (!tableFilter.trim()) return tables
    const q = tableFilter.toLowerCase()
    return tables.filter((t) => String(t.tableNumber).toLowerCase().includes(q))
  }, [tables, tableFilter])

  const submitOrder = async () => {
    if (!canTakeOrder) {
      toast.error('No permission to place orders')
      return
    }
    if (!lines.length) {
      toast.error('Cart is empty')
      return
    }
    if (mode === 'dine_in' && !tableId) {
      toast.error('Select a table')
      return
    }
    const payload = {
      mode,
      tableId: mode === 'dine_in' ? tableId : undefined,
      guestsCount,
      customerName,
      customerPhone,
      items: lines.map((l) => ({
        menuItemId: l.menuItemId,
        quantity: l.quantity,
        specialInstructions: l.note,
        cookingInstructions: l.cookingInstructions,
        customizations: l.customizations,
        addOns: l.addOns,
      })),
      discountAmount,
      discountPercent,
      serviceChargeAmount: serviceChargeAmount === '' ? null : serviceChargeAmount,
      deliveryCharge: mode === 'delivery' ? deliveryCharge : 0,
      deliveryAddress: mode === 'delivery' ? deliveryAddress : undefined,
      riderName: mode === 'delivery' ? riderName : undefined,
      riderPhone: mode === 'delivery' ? riderPhone : undefined,
      promoCode: promoCode || undefined,
    }

    setSubmitting(true)
    try {
      if (!isOnline()) {
        await enqueueOfflinePosAction({ action: 'createPosOrder', payload })
        toast.success('Saved offline - will sync when online')
        clearCart()
        return
      }
      await createPosOrder(payload)
      posSounds.newOrder()
      toast.success('Order sent to kitchen')
      clearCart()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Order failed')
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        document.getElementById('pos-search')?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="flex min-h-full flex-col gap-3 p-3 md:p-4 xl:h-full xl:min-h-0 xl:flex-row">
      {/* Categories / filters */}
      <aside className="flex shrink-0 flex-col gap-3 rounded-3xl border border-surface-200 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-900 xl:w-60 xl:overflow-y-auto">
        <div className="flex items-center gap-2 rounded-2xl bg-primary-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-primary-700">
          <FiShoppingBag className="h-4 w-4" />
          Mode
        </div>
        <div className="grid grid-cols-3 gap-2 xl:grid-cols-1">
          {['dine_in', 'takeaway', 'delivery'].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`truncate rounded-xl px-3 py-2 text-center text-xs font-semibold capitalize transition md:text-sm xl:text-left ${
                mode === m
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-surface-50 text-gray-700 hover:bg-primary-50 hover:text-primary-700'
              }`}
            >
              {m.replace('_', ' ')}
            </button>
          ))}
        </div>
        <div className="mt-1 flex items-center gap-2 rounded-2xl bg-surface-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
          <FiCoffee className="h-4 w-4" />
          Categories
        </div>
        <div className="scrollbar-hide flex gap-1 overflow-x-auto pb-1 xl:max-h-none xl:flex-col xl:overflow-y-auto xl:pb-0">
          {loadingMenu ? (
            <div className="animate-pulse text-xs text-gray-500">Loading...</div>
          ) : (
            categories.map((c) => (
              <button
                key={c._id}
                type="button"
                onClick={() => {
                  setActiveCategory(c._id)
                  setSearch('')
                }}
                className={`shrink-0 truncate rounded-xl px-3 py-2 text-left text-xs font-semibold transition md:text-sm xl:w-full ${
                  activeCategory === c._id && !search.trim()
                    ? 'bg-[#210b02] text-white'
                    : 'text-gray-600 hover:bg-surface-100 hover:text-primary-700'
                }`}
              >
                {c.name}
              </button>
            ))
          )}
        </div>
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Search
        </div>
        <div className="relative">
          <FiSearch className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <input
            id="pos-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name / SKU"
            className="w-full rounded-xl border border-surface-200 bg-white py-2 pl-8 pr-2 text-xs outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800"
          />
        </div>
        {mode === 'dine_in' && (
          <>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase text-gray-500">
              <FiUsers className="h-4 w-4" />
              Tables
            </div>
            <input
              value={tableFilter}
              onChange={(e) => setTableFilter(e.target.value)}
              placeholder="Filter"
              className="w-full rounded-xl border border-surface-200 px-3 py-2 text-xs outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800"
            />
            <div className="scrollbar-hide flex max-h-32 gap-1 overflow-x-auto overflow-y-hidden xl:max-h-48 xl:flex-col xl:overflow-y-auto">
              {filteredTables.map((t) => (
                <button
                  key={t._id}
                  type="button"
                  onClick={() => setField('tableId', t._id)}
                  className={`flex min-w-20 flex-col rounded-xl px-3 py-2 text-left text-[10px] transition md:text-xs xl:w-full ${
                    tableId === t._id
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'bg-surface-50 hover:bg-primary-50 hover:text-primary-700 dark:bg-gray-800'
                  }`}
                >
                  <span className="font-semibold">T-{t.tableNumber}</span>
                  <span className="text-[9px] opacity-80">{t.posStatus}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </aside>

      {/* Grid */}
      <section className="min-w-0 flex-1 rounded-3xl border border-surface-200 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-900 md:p-4 xl:overflow-y-auto">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary-700">Menu register</p>
            <h2 className="mt-1 text-xl font-semibold text-gray-950 dark:text-gray-100 sm:text-2xl">Add items to order</h2>
          </div>
          <div className="rounded-2xl bg-surface-50 px-3 py-2 text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300 sm:px-4 sm:text-sm">
            {items.length} available items
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {items.map((item) => (
            <motion.button
              key={item._id}
              type="button"
              layout
              whileTap={{ scale: 0.97 }}
              onClick={() => addLine(item)}
              className="flex flex-col overflow-hidden rounded-2xl border border-surface-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="aspect-[4/3] w-full overflow-hidden bg-gray-100">
                {item.image ? (
                  <img
                    src={item.image}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-3xl text-gray-300">
                    <FiCoffee className="h-8 w-8" />
                  </div>
                )}
              </div>
              <div className="p-2">
                <div className="line-clamp-2 text-xs font-semibold leading-tight text-gray-950 dark:text-gray-100 md:text-sm">
                  {item.name}
                </div>
                <div className="mt-1 text-xs font-semibold text-primary-700 dark:text-primary-300">
                  Rs. {item.price}
                </div>
              </div>
            </motion.button>
          ))}
        </div>
        {!items.length && (
          <div className="py-20 text-center text-sm text-gray-500">
            No items - pick a category or search
          </div>
        )}
      </section>

      {/* Cart */}
      <aside className="flex w-full shrink-0 flex-col overflow-hidden rounded-3xl border border-surface-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900 lg:max-h-[45rem] xl:h-full xl:w-80">
        <div className="border-b border-surface-200 px-4 py-3 dark:border-gray-800">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary-700">Cart</p>
          <h2 className="mt-1 text-lg font-semibold text-gray-950 dark:text-gray-100">Current order</h2>
        </div>
        <div className="max-h-72 flex-1 space-y-2 overflow-y-auto p-3 xl:max-h-none">
          <AnimatePresence initial={false}>
            {lines.map((l) => (
              <motion.div
                key={l.menuItemId}
                layout
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                className="rounded-2xl border border-surface-200 bg-surface-50 p-3 dark:border-gray-700 dark:bg-gray-800"
              >
                <div className="flex justify-between gap-2">
                  <span className="text-xs font-semibold leading-tight">{l.name}</span>
                  <button
                    type="button"
                    className="text-red-500"
                    onClick={() => removeLine(l.menuItemId)}
                  >
                    <FiTrash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    className="rounded-lg bg-white p-1 shadow-sm dark:bg-gray-700"
                    onClick={() =>
                      updateLine(l.menuItemId, {
                        quantity: Math.max(1, l.quantity - 1),
                      })
                    }
                  >
                    <FiMinus className="h-4 w-4" />
                  </button>
                  <span className="w-6 text-center text-sm font-semibold">{l.quantity}</span>
                  <button
                    type="button"
                    className="rounded-lg bg-white p-1 shadow-sm dark:bg-gray-700"
                    onClick={() =>
                      updateLine(l.menuItemId, { quantity: l.quantity + 1 })
                    }
                  >
                    <FiPlus className="h-4 w-4" />
                  </button>
                  <span className="ml-auto text-xs font-semibold">
                    Rs. {l.price * l.quantity}
                  </span>
                </div>
                <input
                  placeholder="Note"
                  value={l.note}
                  onChange={(e) => updateLine(l.menuItemId, { note: e.target.value })}
                  className="mt-2 w-full rounded border border-gray-200 px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-900"
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="space-y-2 border-t border-surface-200 p-3 dark:border-gray-800">
          {mode !== 'dine_in' && (
            <input
              placeholder="Customer name"
              value={customerName}
              onChange={(e) => setField('customerName', e.target.value)}
              className="w-full rounded-lg border px-2 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-800"
            />
          )}
          <input
            placeholder="Phone"
            value={customerPhone}
            onChange={(e) => setField('customerPhone', e.target.value)}
            className="w-full rounded-lg border px-2 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-800"
          />
          {mode === 'dine_in' && (
            <input
              type="number"
              min={1}
              placeholder="Guests"
              value={guestsCount}
              onChange={(e) => setField('guestsCount', Number(e.target.value) || 1)}
              className="w-full rounded-lg border px-2 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-800"
            />
          )}
          {mode === 'delivery' && (
            <>
              <input
                placeholder="Address"
                value={deliveryAddress}
                onChange={(e) => setField('deliveryAddress', e.target.value)}
                className="w-full rounded-lg border px-2 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-800"
              />
              <input
                placeholder="Rider"
                value={riderName}
                onChange={(e) => setField('riderName', e.target.value)}
                className="w-full rounded-lg border px-2 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-800"
              />
              <input
                placeholder="Rider phone"
                value={riderPhone}
                onChange={(e) => setField('riderPhone', e.target.value)}
                className="w-full rounded-lg border px-2 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-800"
              />
              <input
                type="number"
                placeholder="Delivery charge"
                value={deliveryCharge}
                onChange={(e) => setField('deliveryCharge', e.target.value)}
                className="w-full rounded-lg border px-2 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-800"
              />
            </>
          )}
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              placeholder="Disc Rs"
              value={discountAmount}
              onChange={(e) => setField('discountAmount', e.target.value)}
              className="rounded-lg border px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-800"
            />
            <input
              type="number"
              placeholder="Disc %"
              value={discountPercent}
              onChange={(e) => setField('discountPercent', e.target.value)}
              className="rounded-lg border px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-800"
            />
          </div>
          <input
            placeholder="Service charge (Rs)"
            value={serviceChargeAmount ?? ''}
            onChange={(e) => setField('serviceChargeAmount', e.target.value)}
            className="w-full rounded-lg border px-2 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-800"
          />
          <input
            placeholder="Promo code"
            value={promoCode}
            onChange={(e) => setField('promoCode', e.target.value)}
            className="w-full rounded-lg border px-2 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-800"
          />

          <div className="space-y-1 rounded-2xl bg-primary-50 p-3 text-xs dark:bg-gray-800">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>Rs. {totals.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax</span>
              <span>Rs. {totals.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Service</span>
              <span>Rs. {totals.serviceCharge.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-base font-semibold text-primary-700 dark:text-primary-300">
              <span>Total</span>
              <span>Rs. {totals.grandTotal.toFixed(2)}</span>
            </div>
          </div>

          <button
            type="button"
            disabled={submitting || !canTakeOrder}
            onClick={submitOrder}
            className="w-full rounded-xl bg-primary-600 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-primary-700 disabled:opacity-50"
          >
            {submitting ? 'Sending...' : 'Send to kitchen'}
          </button>
        </div>
      </aside>
    </div>
  )
}
