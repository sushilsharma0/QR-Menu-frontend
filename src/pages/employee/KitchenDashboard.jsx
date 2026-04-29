import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiCheck, FiX, FiClock } from 'react-icons/fi'
import toast from 'react-hot-toast'
import api from '../../services/api'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import { useSocket } from '../../hooks/useSocket'

const KitchenDashboard = () => {
  const navigate = useNavigate()
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
      const res = await api.get('/restaurant/orders', { params: { status: 'confirmed,preparing,ready' } })
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
      await api.patch(`/restaurant/orders/${orderId}/status`, { status })
      toast.success(`Order #${orderId} updated to ${status}`)
      fetchOrders()
    } catch (error) {
      toast.error('Failed to update status')
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: 'border-yellow-500 bg-yellow-50',
      confirmed: 'border-blue-500 bg-blue-50',
      preparing: 'border-purple-500 bg-purple-50',
      ready: 'border-green-500 bg-green-50',
      served: 'border-gray-500 bg-gray-50'
    }
    return colors[status] || colors.pending
  }

  const sections = [
    { title: 'New Orders', status: ['confirmed'], color: 'blue' },
    { title: 'Preparing', status: ['preparing'], color: 'purple' },
    { title: 'Ready to Serve', status: ['ready'], color: 'green' }
  ]

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Kitchen Dashboard</h1>
        <p className="text-gray-500 mt-1">Manage and track food preparation</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {sections.map((section) => (
          <Card key={section.title} title={section.title}>
            <div className="space-y-4">
              {orders.filter(o => section.status.includes(o.status)).map((order) => (
                <div key={order._id} className={`border-l-4 ${getStatusColor(order.status)} p-4 rounded-lg`}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-gray-900">#{order.orderNumber}</h3>
                      <p className="text-sm text-gray-500">Table: {order.table?.tableNumber}</p>
                    </div>
                    <span className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleTimeString()}</span>
                  </div>
                  
                  <div className="mb-3">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="text-sm">
                        <span className="font-medium">{item.quantity}x</span> {item.name}
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    {order.status === 'confirmed' && (
                      <Button size="sm" onClick={() => updateStatus(order._id, 'preparing')}>
                        Start Cooking
                      </Button>
                    )}
                    {order.status === 'preparing' && (
                      <Button size="sm" variant="success" onClick={() => updateStatus(order._id, 'ready')}>
                        <FiCheck className="mr-1" /> Mark Ready
                      </Button>
                    )}
                    {order.status === 'ready' && (
                      <Button size="sm" variant="secondary" onClick={() => updateStatus(order._id, 'served')}>
                        Served
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => navigate(`/restaurant/orders/${order._id}`)}>
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
              {orders.filter(o => section.status.includes(o.status)).length === 0 && (
                <p className="text-center text-gray-500 py-4">No orders</p>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default KitchenDashboard