import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../../services/api'
import Button from '../../components/common/Button'

const OrderSuccess = () => {
  const { orderId } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOrder()
  }, [orderId])

  const fetchOrder = async () => {
    try {
      const res = await api.get(`/restaurant/customer-orders/${orderId}`)
      setOrder(res.data.data)
    } catch (error) {
      console.error('Failed to fetch order')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
          <p className="text-gray-600 mb-4">Thank you for your order</p>
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-500">Order Number</p>
            <p className="text-xl font-bold text-primary-600">#{order?.orderNumber}</p>
          </div>
          <div className="space-y-2 text-left mb-6">
            <p className="text-sm text-gray-600">We'll notify you when your order is ready.</p>
            <p className="text-sm text-gray-600">Estimated wait time: {order?.estimatedWaitTime || 15} minutes</p>
          </div>
          <div className="flex gap-3">
            <Link to="/" className="flex-1">
              <Button variant="secondary" className="w-full">Back to Home</Button>
            </Link>
            <Link to={`/order/track/${order?.qrToken}`} className="flex-1">
              <Button className="w-full">Track Order</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OrderSuccess