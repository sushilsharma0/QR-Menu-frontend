import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FiArrowLeft, FiPrinter, FiCheck, FiX, FiClock } from 'react-icons/fi'
import toast from 'react-hot-toast'
import api from '../../services/api'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import { useSocket } from '../../hooks/useSocket'
import { useAuth } from '../../hooks/useAuth'

const OrderDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { socket } = useSocket()
  const { user } = useAuth()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const backPath =
    user?.scope === 'employee' || ['kitchen', 'cashier', 'manager', 'waiter'].includes(user?.role)
      ? '/employee/orders'
      : '/restaurant/orders'

  useEffect(() => {
    fetchOrder()
  }, [id])

  useEffect(() => {
    if (socket && id) {
      socket.emit('join:order', id)
      socket.on('order_status', handleStatusUpdate)
      return () => {
        socket.off('order_status')
      }
    }
  }, [socket, id])

  const fetchOrder = async () => {
    try {
      setLoading(true)
      const res = await api.get(`/restaurant/customer-orders/${id}`)
      setOrder(res.data.data)
    } catch (error) {
      toast.error('Failed to fetch order details')
      navigate(backPath)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = (data) => {
    setOrder(prev => ({ ...prev, ...data }))
    toast.success(`Order status updated to ${data.status}`)
    fetchOrder()
  }

  const updateStatus = async (status, estimatedWaitTime = null) => {
    try {
      setUpdating(true)
      await api.patch(`/restaurant/customer-orders/${id}/status`, { status, estimatedWaitTime })
      toast.success(`Order status updated to ${status}`)
      fetchOrder()
    } catch (error) {
      toast.error('Failed to update status')
    } finally {
      setUpdating(false)
    }
  }

  const printReceipt = () => {
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <html>
        <head>
          <title>Order Receipt</title>
          <style>
            body { font-family: monospace; padding: 20px; max-width: 300px; margin: 0 auto; }
            h1 { text-align: center; color: #2563eb; }
            .divider { border-top: 1px dashed #ccc; margin: 10px 0; }
            .total { font-size: 18px; font-weight: bold; text-align: right; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <h1>QR Menu SaaS</h1>
          <p style="text-align:center">${order?.restaurant?.name || 'Restaurant'}</p>
          <div class="divider"></div>
          <p><strong>Order #:</strong> ${order?.orderNumber}</p>
          <p><strong>Customer:</strong> ${order?.customerName}</p>
          <p><strong>Table:</strong> ${order?.table?.tableNumber || 'N/A'}</p>
          <p><strong>Date:</strong> ${new Date(order?.createdAt).toLocaleString()}</p>
          <div class="divider"></div>
          <h3>Items:</h3>
          ${order?.items?.map(item => `
            <p>${item.quantity}x ${item.name} - $${(item.price * item.quantity).toFixed(2)}</p>
          `).join('')}
          <div class="divider"></div>
          <p><strong>Subtotal:</strong> $${order?.totalAmount}</p>
          <p><strong>Tax:</strong> $${order?.taxAmount}</p>
          <p class="total"><strong>Total:</strong> $${order?.grandTotal}</p>
          <div class="divider"></div>
          <p class="footer">Thank you for your order!</p>
        </body>
      </html>
    `)
    printWindow.print()
    printWindow.close()
  }

  const getStatusActions = () => {
    switch (order?.status) {
      case 'pending':
        return (
          <div className="space-y-3">
            <Button className="w-full" onClick={() => updateStatus('confirmed', 15)} disabled={updating}>
              <FiCheck className="mr-2" /> Confirm Order
            </Button>
            <Button variant="danger" className="w-full" onClick={() => updateStatus('cancelled')} disabled={updating}>
              <FiX className="mr-2" /> Cancel Order
            </Button>
          </div>
        )
      case 'confirmed':
        return (
          <div className="space-y-3">
            <Button className="w-full" onClick={() => updateStatus('preparing')} disabled={updating}>
              Start Preparing
            </Button>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Update Wait Time</label>
              <div className="flex gap-2">
                {[10, 15, 20, 30, 45].map(mins => (
                  <button
                    key={mins}
                    onClick={() => updateStatus('confirmed', mins)}
                    className="px-3 py-1 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm"
                  >
                    {mins} min
                  </button>
                ))}
              </div>
            </div>
          </div>
        )
      case 'preparing':
        return (
          <Button className="w-full" variant="success" onClick={() => updateStatus('ready')} disabled={updating}>
            Mark Ready
          </Button>
        )
      case 'ready':
        return (
          <Button className="w-full" variant="success" onClick={() => updateStatus('served')} disabled={updating}>
            Serve Order
          </Button>
        )
      default:
        return null
    }
  }

  const getStatusBadge = () => {
    const config = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      preparing: 'bg-purple-100 text-purple-800',
      ready: 'bg-green-100 text-green-800',
      served: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
    }
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${config[order?.status] || config.pending}`}>
        {order?.status?.toUpperCase()}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!order) return null

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <button onClick={() => navigate(backPath)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <FiArrowLeft /> Back to Orders
        </button>
        <Button variant="secondary" onClick={printReceipt}>
          <FiPrinter className="mr-2" /> Print Receipt
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Info - Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <Card title="Order Information">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Order Number</p>
                  <p className="font-medium text-lg">#{order.orderNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  {getStatusBadge()}
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date & Time</p>
                  <p className="font-medium">{new Date(order.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Estimated Wait Time</p>
                  <p className="font-medium">{order.estimatedWaitTime || 'Not set'} minutes</p>
                </div>
              </div>

              {order.specialRequests && (
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-500">Special Requests</p>
                  <p className="mt-1">{order.specialRequests}</p>
                </div>
              )}
            </div>
          </Card>

          <Card title="Order Items">
            <div className="space-y-3">
              {order.items?.map((item, idx) => (
                <div key={idx} className="flex justify-between py-3 border-b last:border-0">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                    {item.specialInstructions && (
                      <p className="text-sm text-gray-500 mt-1">Note: {item.specialInstructions}</p>
                    )}
                  </div>
                  <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 mt-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span>${order.totalAmount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax:</span>
                <span>${order.taxAmount}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>Total:</span>
                <span className="text-primary-600">${order.grandTotal}</span>
              </div>
            </div>
          </Card>

          <Card title="Order Timeline">
            <div className="space-y-4">
              {order.statusHistory?.map((history, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="w-24 text-sm text-gray-500">
                    {new Date(history.timestamp).toLocaleTimeString()}
                  </div>
                  <div className="flex-1">
                    <span className="font-medium capitalize">{history.status}</span>
                    {history.note && <p className="text-sm text-gray-500">{history.note}</p>}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Actions - Right Column */}
        <div className="space-y-6">
          <Card title="Actions">
            {getStatusActions()}
          </Card>

          <Card title="Customer Information">
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium">{order.customerName}</p>
              </div>
              {order.customerPhone && (
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium">{order.customerPhone}</p>
                </div>
              )}
              {order.customerEmail && (
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{order.customerEmail}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">Table Number</p>
                <p className="font-medium">{order.table?.tableNumber || 'N/A'}</p>
              </div>
            </div>
          </Card>

          {order.paymentStatus && (
            <Card title="Payment Information">
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Payment Status</p>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    order.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {order.paymentStatus.toUpperCase()}
                  </span>
                </div>
                {order.paymentMethod && (
                  <div>
                    <p className="text-sm text-gray-500">Payment Method</p>
                    <p className="font-medium capitalize">{order.paymentMethod}</p>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default OrderDetail