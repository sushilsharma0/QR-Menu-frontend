import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiCheck, FiClock, FiRefreshCw, FiUsers, FiZap } from 'react-icons/fi'
import toast from 'react-hot-toast'
import api from '../../services/api'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import { useSocket } from '../../hooks/useSocket'
import { useTenantRoutes } from '../../hooks/useTenantRoutes'

const KitchenDashboard = () => {
  const navigate = useNavigate()
  const { kitchenBase } = useTenantRoutes()
  const { socket } = useSocket()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOrders()
  }, [])

  useEffect(() => {
    if (socket) {
      socket.on('new_order', handleNewOrder)
      socket.on('order_updated', handleOrderUpdate)
      return () => {
        socket.off('new_order')
        socket.off('order_updated')
      }
    }
  }, [socket])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const res = await api.get('/restaurant/customer-orders', {
        params: { status: 'pending,confirmed,preparing,ready' },
      })
      setOrders(res.data.data.orders)
    } catch (error) {
      toast.error('Failed to fetch orders')
    } finally {
      setLoading(false)
    }
  }

  const handleNewOrder = (order) => {
    toast.success(`New order #${order.orderNumber} received!`)
    fetchOrders()
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
      id: 'progress-lane',
      title: 'In Progress',
      subtitle: 'Currently in preparation',
      status: ['preparing'],
      accent: 'from-violet-500 to-fuchsia-500',
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
  const preparingCount = orders.filter((o) => o.status === 'preparing').length
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
            <h1 className="text-3xl font-bold mt-2">Kitchen Dashboard</h1>
            <p className="text-slate-300 mt-1">Manage incoming orders and cooking flow in real time.</p>
          </div>
          <Button variant="secondary" onClick={fetchOrders} title="Reload all kitchen orders">
            <FiRefreshCw className="mr-2" /> Refresh Queue
          </Button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-2 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {sections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              title={`Jump to ${section.title}`}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
            >
              {section.title}
            </a>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm" title="Total orders currently active in kitchen workflow">
          <p className="text-xs uppercase tracking-wide text-gray-500">Total Active</p>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-2xl font-bold text-slate-900">{totalOrders}</p>
            <FiUsers className="text-slate-500" />
          </div>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm" title="Orders waiting for acceptance or cooking start">
          <p className="text-xs uppercase tracking-wide text-amber-700">Incoming</p>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-2xl font-bold text-amber-900">{pendingCount}</p>
            <FiClock className="text-amber-600" />
          </div>
        </div>
        <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4 shadow-sm" title="Orders currently being prepared">
          <p className="text-xs uppercase tracking-wide text-violet-700">Cooking</p>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-2xl font-bold text-violet-900">{preparingCount}</p>
            <FiZap className="text-violet-600" />
          </div>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm" title="Orders ready for serving handoff">
          <p className="text-xs uppercase tracking-wide text-emerald-700">Ready</p>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-2xl font-bold text-emerald-900">{readyCount}</p>
            <FiCheck className="text-emerald-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {sections.map((section) => (
          <Card key={section.title}>
            <div id={section.id} />
            <div className={`mb-4 rounded-xl bg-gradient-to-r ${section.accent} p-[1px]`}>
              <div className="rounded-[11px] bg-white px-4 py-3">
                <h2 className="font-bold text-gray-900">{section.title}</h2>
                <p className="text-xs text-gray-500 mt-0.5">{section.subtitle}</p>
              </div>
            </div>
            <div className="space-y-4">
              {orders.filter(o => section.status.includes(o.status)).map((order) => (
                <div
                  key={order._id}
                  className={`border ${getStatusStyle(order.status).card} p-4 rounded-2xl transition-all hover:shadow-md`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-gray-900">#{order.orderNumber}</h3>
                      <p className="text-sm text-gray-600">Table: {order.table?.tableNumber || 'N/A'}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 text-[11px] rounded-full font-semibold ${getStatusStyle(order.status).badge}`}>
                        {getStatusStyle(order.status).label}
                      </span>
                      <p className="text-[11px] text-gray-500 mt-1">{new Date(order.createdAt).toLocaleTimeString()}</p>
                    </div>
                  </div>
                  
                  <div className="mb-3 space-y-1">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="text-sm text-gray-700">
                        <span className="font-semibold">{item.quantity}x</span> {item.name}
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
                      <Button
                        size="sm"
                        variant="success"
                        onClick={() => updateStatus(order._id, 'ready')}
                        title="Mark this order ready for serving"
                      >
                        <FiCheck className="mr-1" /> Mark Ready
                      </Button>
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
                <div className="text-center py-8 rounded-xl border border-dashed border-gray-300 bg-gray-50">
                  <p className="text-sm font-medium text-gray-500">No orders in this lane</p>
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