import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiCheck, FiClock, FiRefreshCw, FiUsers, FiZap } from 'react-icons/fi'
import toast from '@utils/toast'
import api from '../../services/api'
import Button from '../../components/common/Button'
import { useSocket } from '../../hooks/useSocket'
import useOrderAlerts from '../../hooks/useOrderAlerts'
import { useTenantRoutes } from '../../hooks/useTenantRoutes'

const KitchenDashboard = () => {
  const navigate = useNavigate()
  const { kitchenBase } = useTenantRoutes()
  const { socket } = useSocket()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [recentOrderIds, setRecentOrderIds] = useState([])

  useOrderAlerts({
    role: 'kitchen',
    fullscreenUrgent: true,
    onRefresh: (payload) => {
      fetchOrders()
      if (payload?.orderId) {
        setRecentOrderIds((prev) => [String(payload.orderId), ...prev].slice(0, 8))
        window.setTimeout(() => {
          setRecentOrderIds((prev) => prev.filter((id) => id !== String(payload.orderId)))
        }, 12000)
      }
    },
  })

  useEffect(() => {
    fetchOrders()
  }, [])

  useEffect(() => {
    if (socket) {
      socket.on('order_updated', handleOrderUpdate)
      return () => {
        socket.off('order_updated', handleOrderUpdate)
      }
    }
  }, [socket])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const res = await api.get('/restaurant/customer-orders', {
        params: { status: 'pending,confirmed,preparing,cooking,ready' },
      })
      setOrders(res.data.data.orders)
    } catch (error) {
      toast.error('Failed to fetch orders')
    } finally {
      setLoading(false)
    }
  }

  const handleOrderUpdate = () => {
    fetchOrders()
  }

  const updateStatus = async (orderId, status) => {
    try {
      const res = await api.patch(`/restaurant/customer-orders/${orderId}/status`, { status })
      const orderNumber = res?.data?.data?.orderNumber
      toast.success(`Order #${orderNumber || orderId} updated to ${status}`)
      fetchOrders()
    } catch (error) {
      const message = error?.response?.data?.message || 'Failed to update status'
      toast.error(message)
    }
  }

  const notifyDelay = async (orderId, minutes) => {
    try {
      await api.patch(`/restaurant/customer-orders/${orderId}/status`, {
        kitchenDelayMinutes: minutes,
      })
      toast.success(`Guests notified: +${minutes} min`)
      fetchOrders()
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Could not send delay notice')
    }
  }

  const updateItemKitchenStatus = async (orderId, itemId, kitchenStatus) => {
    try {
      await api.patch(`/restaurant/customer-orders/${orderId}/items/${itemId}/kitchen`, { kitchenStatus })
      toast.success(`Item marked ${kitchenStatus}`)
      fetchOrders()
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to update item')
    }
  }

  const getStatusStyle = (status) => {
    const styles = {
      pending: {
        card: 'border-amber-200 bg-amber-50/60',
        badge: 'bg-amber-100 text-amber-700',
        label: 'Pending',
      },
      confirmed: {
        card: 'border-sky-200 bg-sky-50/60',
        badge: 'bg-sky-100 text-sky-700',
        label: 'Confirmed',
      },
      preparing: {
        card: 'border-violet-200 bg-violet-50/60',
        badge: 'bg-violet-100 text-violet-700',
        label: 'Preparing',
      },
      cooking: {
        card: 'border-fuchsia-200 bg-fuchsia-50/60',
        badge: 'bg-fuchsia-100 text-fuchsia-800',
        label: 'Cooking',
      },
      ready: {
        card: 'border-emerald-200 bg-emerald-50/60',
        badge: 'bg-emerald-100 text-emerald-700',
        label: 'Ready',
      },
    }

    return styles[status] || styles.pending
  }

  const sections = [
    {
      id: 'incoming-lane',
      title: 'Incoming Queue',
      subtitle: 'Accept and start new tickets',
      status: ['pending', 'confirmed'],
      accent: 'from-sky-500 to-indigo-500',
    },
    {
      id: 'prep-lane',
      title: 'Preparing',
      subtitle: 'Prep and mise en place',
      status: ['preparing'],
      accent: 'from-violet-500 to-fuchsia-500',
    },
    {
      id: 'cook-lane',
      title: 'Cooking',
      subtitle: 'On the line / grill',
      status: ['cooking'],
      accent: 'from-orange-500 to-rose-500',
    },
    {
      id: 'ready-lane',
      title: 'Ready To Serve',
      subtitle: 'Waiting for serving handoff',
      status: ['ready'],
      accent: 'from-emerald-500 to-teal-500',
    },
  ]

  const totalOrders = orders.length
  const pendingCount = orders.filter((o) => ['pending', 'confirmed'].includes(o.status)).length
  const preparingCount = orders.filter((o) => ['preparing', 'cooking'].includes(o.status)).length
  const readyCount = orders.filter((o) => o.status === 'ready').length
  const itemStatusStyle = {
    queued: 'bg-slate-100 text-slate-700',
    preparing: 'bg-violet-100 text-violet-800',
    cooking: 'bg-orange-100 text-orange-800',
    ready: 'bg-emerald-100 text-emerald-800',
    served: 'bg-gray-100 text-gray-700',
    held: 'bg-amber-100 text-amber-800',
    cancelled: 'bg-red-100 text-red-800',
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
      <div className="rounded-2xl bg-slate-950 p-5 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Kitchen Control Center</p>
            <h1 className="text-3xl font-semibold mt-2">Kitchen Dashboard</h1>
            <p className="text-slate-300 mt-1">Accept, cook, and hand off orders without losing the flow.</p>
          </div>
          <div className="flex flex-col gap-3 sm:items-end">
            <Button variant="secondary" onClick={fetchOrders} title="Reload all kitchen orders">
              <FiRefreshCw className="mr-2" /> Refresh
            </Button>
            <div className="flex flex-wrap gap-2 text-xs font-bold">
              <span className="rounded-full bg-white/10 px-3 py-1.5 text-white"><FiUsers className="mr-1 inline" />{totalOrders} active</span>
              <span className="rounded-full bg-amber-400/20 px-3 py-1.5 text-amber-100"><FiClock className="mr-1 inline" />{pendingCount} incoming</span>
              <span className="rounded-full bg-violet-400/20 px-3 py-1.5 text-violet-100"><FiZap className="mr-1 inline" />{preparingCount} cooking</span>
              <span className="rounded-full bg-emerald-400/20 px-3 py-1.5 text-emerald-100"><FiCheck className="mr-1 inline" />{readyCount} ready</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        {sections.map((section) => (
          <section
            key={section.title}
            className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900/70"
          >
            <div id={section.id} />
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-gray-100">{section.title}</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{section.subtitle}</p>
              </div>
              <span className="rounded-full bg-white px-2.5 py-1 text-xs font-black text-slate-700 shadow-sm dark:bg-gray-800 dark:text-gray-200">
                {orders.filter(o => section.status.includes(o.status)).length}
              </span>
            </div>
            <div className="space-y-4">
              {orders.filter(o => section.status.includes(o.status)).map((order) => (
                <div
                  key={order._id}
                  className={`border ${getStatusStyle(order.status).card} p-4 rounded-2xl transition-all hover:shadow-md ${
                    recentOrderIds.includes(String(order._id)) ? 'ring-4 ring-amber-300 ring-offset-2 animate-pulse' : ''
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">#{order.orderNumber}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Table: {order.table?.tableNumber || 'N/A'}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 text-[11px] rounded-full font-semibold ${getStatusStyle(order.status).badge}`}>
                        {getStatusStyle(order.status).label}
                      </span>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">{new Date(order.createdAt).toLocaleTimeString()}</p>
                    </div>
                  </div>
                  
                  <div className="mb-3 space-y-1">
                    {order.items.map((item, idx) => (
                      <div key={item._id || idx} className="rounded-xl border border-white/70 bg-white/70 p-2 text-sm text-gray-700 shadow-sm dark:border-gray-700 dark:bg-gray-900/70 dark:text-gray-300">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0">
                            <span className="font-semibold">{item.quantity}x</span> {item.name}
                            <span className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              item.fulfillmentMode === 'parcel'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200'
                                : 'bg-primary-100 text-primary-800 dark:bg-primary-900/40 dark:text-primary-200'
                            }`}>
                              {item.fulfillmentMode === 'parcel' ? 'Parcel' : 'Eat here'}
                            </span>
                          </div>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${itemStatusStyle[item.kitchenStatus || 'queued'] || itemStatusStyle.queued}`}>
                            {item.kitchenStatus || 'queued'}
                          </span>
                        </div>
                        {(item.selectedVariations || []).length > 0 && (
                          <div className="mt-1 text-xs font-semibold text-gray-500 dark:text-gray-400">
                            {(item.selectedVariations || [])
                              .map((v) => `${v.groupName}: ${v.optionName}${Number(v.quantity || 1) > 1 ? ` x${v.quantity}` : ''}`)
                              .join(' | ')}
                          </div>
                        )}
                        {item.cookingInstructions ? (
                          <div className="mt-1 rounded bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
                            {item.cookingInstructions}
                          </div>
                        ) : null}
                        <div className="mt-2">
                          <select
                            value={item.kitchenStatus || 'queued'}
                            disabled={!item._id}
                            onChange={(event) => updateItemKitchenStatus(order._id, item._id, event.target.value)}
                            className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs font-bold capitalize text-gray-700 outline-none focus:ring-2 focus:ring-primary-300 disabled:opacity-45 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-200"
                            title="Update item kitchen status"
                          >
                            {['queued', 'preparing', 'cooking', 'ready', 'served'].map((nextStatus) => (
                              <option key={nextStatus} value={nextStatus}>
                                {nextStatus}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {order.status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => updateStatus(order._id, 'confirmed')}
                        title="Confirm this order and move it to kitchen queue"
                      >
                        Accept Order
                      </Button>
                    )}
                    {order.status === 'confirmed' && (
                      <Button
                        size="sm"
                        onClick={() => updateStatus(order._id, 'preparing')}
                        title="Start preparing this order"
                      >
                        Start Cooking
                      </Button>
                    )}
                    {order.status === 'preparing' && (
                      <>
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => updateStatus(order._id, 'cooking')}
                          title="Move to active cooking"
                        >
                          <FiZap className="mr-1" /> Start cooking
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => notifyDelay(order._id, 10)}
                          title="Notify guests of about 10 extra minutes"
                        >
                          +10 min delay
                        </Button>
                      </>
                    )}
                    {order.status === 'cooking' && (
                      <>
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => updateStatus(order._id, 'ready')}
                          title="Mark this order ready for serving"
                        >
                          <FiCheck className="mr-1" /> Mark ready
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => notifyDelay(order._id, 10)}
                          title="Notify guests of about 10 extra minutes"
                        >
                          +10 min delay
                        </Button>
                      </>
                    )}
                    {order.status === 'ready' && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => updateStatus(order._id, 'served')}
                        title="Mark this order as served"
                      >
                        Served
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => navigate(`${kitchenBase}/orders/${order._id}`)}
                      title="Open full order details"
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
              {orders.filter(o => section.status.includes(o.status)).length === 0 && (
                <div className="text-center py-8 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No orders in this lane</p>
                </div>
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}

export default KitchenDashboard
