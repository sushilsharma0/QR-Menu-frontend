import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiEye, FiRefreshCw } from 'react-icons/fi'
import toast from 'react-hot-toast'
import api from '../../services/api'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import { useSocket } from '../../hooks/useSocket'

const Orders = () => {
  const navigate = useNavigate()
  const { socket } = useSocket()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchOrders()
  }, [filter])

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
      const res = await api.get('/restaurant/customer-orders', { params: { status: filter !== 'all' ? filter : undefined } })
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

  const updateOrderStatus = async (orderId, status, estimatedWaitTime = null) => {
    try {
      await api.patch(`/restaurant/customer-orders/${orderId}/status`, { status, estimatedWaitTime })
      toast.success(`Order status updated to ${status}`)
      fetchOrders()
    } catch (error) {
      toast.error('Failed to update status')
    }
  }

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      preparing: 'bg-purple-100 text-purple-800',
      ready: 'bg-green-100 text-green-800',
      served: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800'
    }
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${styles[status] || styles.pending}`}>
        {status.toUpperCase()}
      </span>
    )
  }

  const filters = [
    { value: 'all', label: 'All Orders' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'preparing', label: 'Preparing' },
    { value: 'ready', label: 'Ready' },
    { value: 'served', label: 'Served' },
    { value: 'cancelled', label: 'Cancelled' }
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-500 mt-1">Manage and track customer orders</p>
        </div>
        <Button variant="secondary" onClick={fetchOrders}>
          <FiRefreshCw className="mr-2" /> Refresh
        </Button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {filters.map(f => (
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
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {orders.map((order) => (
          <Card key={order._id} className="hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">#{order.orderNumber}</h3>
                <p className="text-sm text-gray-500">{order.customerName}</p>
              </div>
              {getStatusBadge(order.status)}
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Table:</span>
                <span className="font-medium">{order.table?.tableNumber}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Items:</span>
                <span className="font-medium">{order.items?.length || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total:</span>
                <span className="font-bold text-primary-600">${order.grandTotal}</span>
              </div>
              {order.estimatedWaitTime && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Est. Wait:</span>
                  <span className="font-medium">{order.estimatedWaitTime} min</span>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button size="sm" onClick={() => navigate(`/restaurant/orders/${order._id}`)}>
                <FiEye className="mr-1" /> View Details
              </Button>
              
              {order.status === 'pending' && (
                <Button size="sm" variant="success" onClick={() => updateOrderStatus(order._id, 'confirmed', 15)}>
                  Confirm Order
                </Button>
              )}
              
              {order.status === 'confirmed' && (
                <Button size="sm" variant="primary" onClick={() => updateOrderStatus(order._id, 'preparing')}>
                  Start Preparing
                </Button>
              )}
              
              {order.status === 'preparing' && (
                <Button size="sm" variant="primary" onClick={() => updateOrderStatus(order._id, 'ready')}>
                  Mark Ready
                </Button>
              )}
              
              {order.status === 'ready' && (
                <Button size="sm" variant="success" onClick={() => updateOrderStatus(order._id, 'served')}>
                  Serve Order
                </Button>
              )}
              
              {['pending', 'confirmed', 'preparing'].includes(order.status) && (
                <Button size="sm" variant="danger" onClick={() => updateOrderStatus(order._id, 'cancelled')}>
                  Cancel
                </Button>
              )}
            </div>
          </Card>
        ))}

        {orders.length === 0 && (
          <div className="col-span-2 text-center py-12 text-gray-500">
            No orders found
          </div>
        )}
      </div>
    </div>
  )
}

export default Orders