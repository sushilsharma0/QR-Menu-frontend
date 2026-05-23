import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiRefreshCw, FiTruck } from 'react-icons/fi'
import toast from '@utils/toast'
import api from '../../services/api'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import { useTenantRoutes } from '../../hooks/useTenantRoutes'
import { RestaurantPageLoader, RestaurantStatusPill, formatRestaurantCurrency } from '../../components/restaurant/RestaurantUI'

export default function DeliveryDispatch() {
  const { restaurantBase } = useTenantRoutes()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('active')
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ riderName: '', riderPhone: '', deliveryAddress: '' })

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get('/restaurant/insights/delivery-dispatch', { params: { status: statusFilter } })
      setOrders(res.data?.data?.orders || [])
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load deliveries')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [statusFilter])

  const openEdit = (order) => {
    setEditing(order._id)
    setForm({
      riderName: order.riderName || '',
      riderPhone: order.riderPhone || '',
      deliveryAddress: order.deliveryAddress || '',
    })
  }

  const saveDispatch = async () => {
    try {
      await api.patch(`/restaurant/insights/delivery-dispatch/${editing}`, form)
      toast.success('Delivery details saved')
      setEditing(null)
      load()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Save failed')
    }
  }

  const updateStatus = async (orderId, status) => {
    try {
      await api.patch(`/restaurant/customer-orders/${orderId}/status`, { status })
      toast.success('Status updated')
      load()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Status update failed')
    }
  }

  if (loading && !orders.length) return <RestaurantPageLoader label="Loading deliveries…" />

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-950 dark:text-gray-100">Delivery dispatch</h1>
          <p className="text-sm text-gray-500">Assign riders and track delivery orders</p>
        </div>
        <Button variant="secondary" onClick={load}>
          <FiRefreshCw className="mr-1 inline" /> Refresh
        </Button>
      </div>

      <select
        className="rounded-xl border border-surface-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
      >
        <option value="active">Active deliveries</option>
        <option value="completed">Completed / cancelled</option>
        <option value="all">All</option>
      </select>

      <div className="space-y-3">
        {orders.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-12 text-center text-gray-500">
            <FiTruck className="mx-auto h-10 w-10 opacity-40" />
            <p className="mt-2">No delivery orders in this view</p>
          </div>
        ) : (
          orders.map((order) => (
            <article key={order._id} className="rounded-2xl border bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link to={`${restaurantBase}/orders/${order._id}`} className="font-bold text-primary-800 hover:underline">
                    #{order.orderNumber}
                  </Link>
                  <p className="text-sm text-gray-600">{order.customerName} · {order.customerPhone || 'No phone'}</p>
                  <p className="mt-1 text-sm">{order.deliveryAddress || 'No address'}</p>
                  {order.riderName && (
                    <p className="mt-1 text-xs text-gray-500">
                      Rider: {order.riderName} {order.riderPhone ? `(${order.riderPhone})` : ''}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <RestaurantStatusPill value={order.status} />
                  <p className="mt-2 font-bold">{formatRestaurantCurrency(order.grandTotal)}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {['confirmed', 'preparing', 'ready', 'completed'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => updateStatus(order._id, st)}
                    className="rounded-lg border px-2 py-1 text-xs font-semibold capitalize hover:bg-surface-50"
                  >
                    → {st}
                  </button>
                ))}
                <Button size="sm" variant="secondary" onClick={() => openEdit(order)}>
                  Rider / address
                </Button>
              </div>
              {editing === order._id && (
                <div className="mt-4 grid gap-2 border-t pt-4 sm:grid-cols-3">
                  <Input label="Rider name" value={form.riderName} onChange={(e) => setForm((f) => ({ ...f, riderName: e.target.value }))} />
                  <Input label="Rider phone" value={form.riderPhone} onChange={(e) => setForm((f) => ({ ...f, riderPhone: e.target.value }))} />
                  <Input label="Address" value={form.deliveryAddress} onChange={(e) => setForm((f) => ({ ...f, deliveryAddress: e.target.value }))} />
                  <div className="sm:col-span-3 flex gap-2">
                    <Button onClick={saveDispatch}>Save</Button>
                    <Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
                  </div>
                </div>
              )}
            </article>
          ))
        )}
      </div>
    </div>
  )
}
