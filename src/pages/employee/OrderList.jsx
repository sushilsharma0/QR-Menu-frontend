import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { FiEye, FiClock, FiCheck, FiX, FiRefreshCw, FiSearch } from 'react-icons/fi'
import toast from 'react-hot-toast'
import api from '../../services/api'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import { useSocket } from '../../hooks/useSocket'
import { useTenantRoutes } from '../../hooks/useTenantRoutes'
import { useAuth } from '../../hooks/useAuth'

const OrderList = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { kitchenBase, employeeBase } = useTenantRoutes()
  const { user } = useAuth()
  const currency = user?.currency || 'Rs.'
  const ordersBase = location.pathname.startsWith('/kitchen/') ? kitchenBase : employeeBase
  const { socket } = useSocket()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchOrders()
  }, [filter])

  useEffect(() => {
    if (socket) {
      socket.on('new_order', handleNewOrder)
      socket.on('order_updated', handleOrderUpdate)
      return () => {
        socket.off('new_order', handleNewOrder)
        socket.off('order_updated', handleOrderUpdate)
      }
    }
  }, [socket])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const params = {}
      if (filter !== 'all') params.status = filter
      const res = await api.get('/restaurant/customer-orders', { params })
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

  const handleOrderUpdate = (order) => {
    toast(`Order #${order.orderNumber} status updated`)
    fetchOrders()
  }

  const updateOrderStatus = async (orderId, status) => {
    try {
      await api.patch(`/restaurant/customer-orders/${orderId}/status`, { status })
      toast.success(`Order status updated to ${status}`)
      fetchOrders()
    } catch (error) {
      toast.error('Failed to update status')
    }
  }

  const getStatusBadge = (status) => {
    const config = {
      pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: FiClock },
      confirmed: { label: 'Confirmed', color: 'bg-blue-100 text-blue-800', icon: FiCheck },
      preparing: { label: 'Preparing', color: 'bg-purple-100 text-purple-800', icon: FiClock },
      ready: { label: 'Ready', color: 'bg-green-100 text-green-800', icon: FiCheck },
      served: { label: 'Served', color: 'bg-gray-100 text-gray-800', icon: FiCheck },
      cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: FiX },
    }
    const { label, color, icon: Icon } = config[status] || config.pending
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${color}`}>
        <Icon className="h-3 w-3" />
        {label}
      </span>
    )
  }

  const getStatusActions = (order) => {
    switch (order.status) {
      case 'pending':
        return (
          <Button size="sm" onClick={() => updateOrderStatus(order._id, 'confirmed')}>
            Confirm
          </Button>
        )
      case 'confirmed':
        return (
          <Button size="sm" onClick={() => updateOrderStatus(order._id, 'preparing')}>
            Start Preparing
          </Button>
        )
      case 'preparing':
        return (
          <Button size="sm" variant="success" onClick={() => updateOrderStatus(order._id, 'ready')}>
            Mark Ready
          </Button>
        )
      case 'ready':
        return (
          <Button size="sm" variant="success" onClick={() => updateOrderStatus(order._id, 'served')}>
            Serve
          </Button>
        )
      default:
        return null
    }
  }

  const filters = [
    { value: 'all', label: 'All Orders', count: orders.length },
    { value: 'pending', label: 'Pending', count: orders.filter(o => o.status === 'pending').length },
    { value: 'confirmed', label: 'Confirmed', count: orders.filter(o => o.status === 'confirmed').length },
    { value: 'preparing', label: 'Preparing', count: orders.filter(o => o.status === 'preparing').length },
    { value: 'ready', label: 'Ready', count: orders.filter(o => o.status === 'ready').length },
    { value: 'served', label: 'Served', count: orders.filter(o => o.status === 'served').length },
    { value: 'cancelled', label: 'Cancelled', count: orders.filter(o => o.status === 'cancelled').length },
  ]

  const filteredOrders = orders.filter(order =>
    order.orderNumber?.toLowerCase().includes(search.toLowerCase()) ||
    order.table?.tableNumber?.toLowerCase().includes(search.toLowerCase()) ||
    order.customerName?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
          <p className="text-gray-500 mt-1">View and manage all customer orders</p>
        </div>
        <Button variant="secondary" onClick={fetchOrders}>
          <FiRefreshCw className="mr-2" /> Refresh
        </Button>
      </div>

      {/* Search Bar */}
      <Card>
        <Input
          placeholder="Search by order number, table or customer name..."
          icon={FiSearch}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Card>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              filter === f.value
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.label}
            {f.count > 0 && (
              <span className={`ml-2 px-1.5 py-0.5 text-xs rounded-full ${
                filter === f.value ? 'bg-white text-primary-600' : 'bg-gray-200 text-gray-600'
              }`}>
                {f.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredOrders.map((order) => (
          <div key={order._id} className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow overflow-hidden">
            {/* Order Header */}
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-gray-900">#{order.orderNumber}</h3>
                <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleString()}</p>
              </div>
              {getStatusBadge(order.status)}
            </div>

            {/* Order Body */}
            <div className="p-4 space-y-3">
              {/* Customer & Table Info */}
              <div className="flex justify-between text-sm">
                <div>
                  <p className="text-gray-500">Customer</p>
                  <p className="font-medium">{order.customerName || 'Walk-in'}</p>
                  {order.createdBy?.type === 'waiter' && order.createdBy?.employeeId?.name && (
                    <p className="text-xs text-accent-700">Order by: {order.createdBy.employeeId.name} (Waiter)</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-gray-500">Table</p>
                  <p className="font-medium">{order.table?.tableNumber || 'N/A'}</p>
                </div>
              </div>

              {/* Items Summary */}
              <div>
                <p className="text-gray-500 text-sm mb-2">Items ({order.items?.length || 0})</p>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {order.items?.slice(0, 4).map((item, idx) => (
                    <div key={idx} className="text-sm flex justify-between">
                      <span>{item.quantity}x {item.name}</span>
                      <span className="text-gray-600">{currency}{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  {order.items?.length > 4 && (
                    <p className="text-xs text-gray-400">+{order.items.length - 4} more items</p>
                  )}
                </div>
              </div>

              {/* Total Amount */}
              <div className="border-t pt-3 flex justify-between items-center">
                <span className="text-gray-600">Total Amount</span>
                <span className="text-xl font-bold text-primary-600">{currency}{order.grandTotal ?? order.totalAmount}</span>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate(`${ordersBase}/orders/${order._id}`)}
                >
                  <FiEye className="mr-1" /> View Details
                </Button>
                {getStatusActions(order)}
              </div>

              {/* Estimated Time (if set) */}
              {order.estimatedWaitTime && order.status !== 'served' && order.status !== 'cancelled' && (
                <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 p-2 rounded-lg">
                  <FiClock className="h-4 w-4" />
                  <span>Est. wait time: {order.estimatedWaitTime} minutes</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredOrders.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
          <p className="text-gray-500">
            {search ? 'Try adjusting your search or filter' : 'No orders match the selected filter'}
          </p>
          {(search || filter !== 'all') && (
            <Button
              variant="secondary"
              className="mt-4"
              onClick={() => {
                setSearch('')
                setFilter('all')
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      )}

      {/* Order Statistics Summary */}
      {orders.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-3">Order Statistics</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{orders.filter(o => o.status === 'pending').length}</p>
              <p className="text-xs text-gray-500">Pending</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{orders.filter(o => o.status === 'confirmed').length}</p>
              <p className="text-xs text-gray-500">Confirmed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{orders.filter(o => o.status === 'preparing').length}</p>
              <p className="text-xs text-gray-500">Preparing</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{orders.filter(o => o.status === 'ready').length}</p>
              <p className="text-xs text-gray-500">Ready</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-600">{orders.filter(o => o.status === 'served').length}</p>
              <p className="text-xs text-gray-500">Served</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OrderList