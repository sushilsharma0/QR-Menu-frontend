import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { FiCheck, FiClock, FiCoffee, FiSmile } from 'react-icons/fi'
import api from '../../services/api'
import { useSocket } from '../../hooks/useSocket'

const OrderTracking = () => {
  const { qrToken } = useParams()
  const { socket } = useSocket()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOrder()
  }, [qrToken])

  useEffect(() => {
    if (socket && qrToken) {
      socket.emit('join:order', qrToken)
      socket.on('order_status', handleStatusUpdate)
      return () => {
        socket.off('order_status')
      }
    }
  }, [socket, qrToken])

  const fetchOrder = async () => {
    try {
      const res = await api.get(`/customer/order/${qrToken}`)
      setOrder(res.data.data)
    } catch (error) {
      console.error('Failed to fetch order')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = (data) => {
    setOrder(prev => ({ ...prev, ...data }))
  }

  const getStatusStep = () => {
    const steps = [
      { key: 'pending', label: 'Order Received', icon: FiClock, time: order?.createdAt },
      { key: 'confirmed', label: 'Order Confirmed', icon: FiCheck, time: order?.statusHistory?.find(h => h.status === 'confirmed')?.timestamp },
      { key: 'preparing', label: 'Preparing', icon: FiCoffee, time: order?.statusHistory?.find(h => h.status === 'preparing')?.timestamp },
      { key: 'ready', label: 'Ready for Pickup', icon: FiSmile, time: order?.statusHistory?.find(h => h.status === 'ready')?.timestamp },
    ]
    const currentIndex = steps.findIndex(s => s.key === order?.status)
    return steps.map((step, idx) => ({
      ...step,
      completed: idx <= currentIndex,
      active: idx === currentIndex
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Order not found</h2>
          <p className="text-gray-500">Please check your QR code</p>
        </div>
      </div>
    )
  }

  const steps = getStatusStep()

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Order Status</h1>
            <p className="text-gray-500">Order #{order.orderNumber}</p>
          </div>

          {/* Timeline */}
          <div className="relative">
            {steps.map((step, idx) => (
              <div key={step.key} className="flex items-start mb-8 last:mb-0">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${
                  step.completed ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  <step.icon className="h-5 w-5" />
                </div>
                <div className="ml-4 flex-1">
                  <div className="flex justify-between items-center">
                    <h3 className={`font-medium ${step.completed ? 'text-gray-900' : 'text-gray-500'}`}>
                      {step.label}
                    </h3>
                    {step.time && (
                      <span className="text-sm text-gray-400">
                        {new Date(step.time).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                  {step.active && order.estimatedWaitTime && (
                    <p className="text-sm text-blue-600 mt-1">
                      Estimated wait: {order.estimatedWaitTime} minutes
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Details */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
          <div className="space-y-3 mb-4">
            {order.items?.map((item, idx) => (
              <div key={idx} className="flex justify-between">
                <span>{item.quantity}x {item.name}</span>
                <span>${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="border-t pt-4">
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span className="text-primary-600">${order.totalAmount}</span>
            </div>
          </div>
        </div>

        {/* Customer Info */}
        <div className="mt-6 bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-2">Customer Information</h2>
          <p className="text-gray-600">Name: {order.customerName}</p>
          {order.customerPhone && <p className="text-gray-600">Phone: {order.customerPhone}</p>}
          {order.tableNumber && <p className="text-gray-600">Table: {order.tableNumber}</p>}
        </div>
      </div>
    </div>
  )
}

export default OrderTracking