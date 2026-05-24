import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiCheck, FiClock, FiRefreshCw, FiUsers, FiZap } from 'react-icons/fi'
import toast from '@utils/toast'
import api from '../../services/api'
import Card from '../../components/common/Card'
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Kitchen Control Center</p>
            <h1 className="text-3xl font-semibold mt-2">Kitchen Dashboard</h1>
            <p className="text-slate-300 mt-1">Manage incoming orders and cooking flow in real time.</p>
          </div>
          <Button variant="secondary" onClick={fetchOrders} title="Reload all kitchen orders">
            <FiRefreshCw className="mr-2" /> Refresh Queue
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-2 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {sections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              title={`Jump to ${section.title}`}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {section.title}
            </a>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-sm" title="Total orders currently active in kitchen workflow">
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Total Active</p>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-2xl font-semibold text-slate-900 dark:text-gray-100">{totalOrders}</p>
            <FiUsers className="text-slate-500" />
          </div>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm" title="Orders waiting for acceptance or cooking start">
          <p className="text-xs uppercase tracking-wide text-amber-700">Incoming</p>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-2xl font-semibold text-amber-900">{pendingCount}</p>
            <FiClock className="text-amber-600" />
          </div>
        </div>
        <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4 shadow-sm" title="Orders in prep or on the line">
          <p className="text-xs uppercase tracking-wide text-violet-700">Prep / cooking</p>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-2xl font-semibold text-violet-900">{preparingCount}</p>
            <FiZap className="text-violet-600" />
          </div>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm" title="Orders ready for serving handoff">
          <p className="text-xs uppercase tracking-wide text-emerald-700">Ready</p>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-2xl font-semibold text-emerald-900">{readyCount}</p>
            <FiCheck className="text-emerald-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {sections.map((section) => (
          <Card key={section.title}>
            <div id={section.id} />
            <div className={`mb-4 rounded-xl bg-gradient-to-r ${section.accent} p-[1px]`}>
              <div className="rounded-[11px] bg-white dark:bg-gray-900 px-4 py-3">
                <h2 className="font-semibold text-gray-900 dark:text-gray-100">{section.title}</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{section.subtitle}</p>
              </div>
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
                      <div key={idx} className="text-sm text-gray-700 dark:text-gray-300">
                        <span className="font-semibold">{item.quantity}x</span> {item.name}
                        <span className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          item.fulfillmentMode === 'parcel'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200'
                            : 'bg-primary-100 text-primary-800 dark:bg-primary-900/40 dark:text-primary-200'
                        }`}>
                          {item.fulfillmentMode === 'parcel' ? 'Parcel' : 'Eat here'}
                        </span>
                        {(item.selectedVariations || []).length > 0 && (
                          <div className="ml-5 mt-1 text-xs font-semibold text-gray-500 dark:text-gray-400">
                            {(item.selectedVariations || [])
                              .map((v) => `${v.groupName}: ${v.optionName}${Number(v.quantity || 1) > 1 ? ` x${v.quantity}` : ''}`)
                              .join(' | ')}
                          </div>
                        )}
                        {item.cookingInstructions ? (
                          <div className="ml-5 mt-1 rounded bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
                            {item.cookingInstructions}
                          </div>
                        ) : null}
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
          </Card>
        ))}
      </div>
    </div>
  )
}

export default KitchenDashboard
