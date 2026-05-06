import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { useCart } from '../../hooks/useCart'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'

const Checkout = () => {
  const navigate = useNavigate()
  const { cart, clearCart } = useCart()
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm()
  const currency = cart.items?.[0]?.currency || 'Rs.'

  if (!cart.items.length) {
    navigate('/cart')
    return null
  }

  const onSubmit = async (data) => {
    try {
      setLoading(true)
      const orderData = {
        tableId: localStorage.getItem('tableId'),
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerEmail: data.customerEmail,
        items: cart.items.map(item => ({
          menuItemId: item._id,
          quantity: item.quantity,
          specialInstructions: item.specialInstructions || ''
        })),
        specialRequests: data.specialRequests
      }

      const res = await api.post('/restaurant/customer-orders', orderData)
      clearCart()
      navigate(`/order/success/${res.data.data.orderId}`)
      toast.success('Order placed successfully!')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to place order')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Checkout</h1>

        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
          <div className="space-y-2 mb-4">
            {cart.items.map((item) => (
              <div key={item._id} className="flex justify-between">
                <span>{item.quantity}x {item.name}</span>
                <span>{currency}{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="border-t pt-4">
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span className="text-primary-600">{currency}{cart.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Customer Information</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Name *"
              placeholder="Enter your name"
              {...register('customerName', { required: 'Name is required' })}
              error={errors.customerName?.message}
            />
            <Input
              label="Phone *"
              placeholder="Enter phone number"
              {...register('customerPhone', { required: 'Phone is required' })}
              error={errors.customerPhone?.message}
            />
            <Input
              label="Email (Optional)"
              type="email"
              placeholder="Enter email for updates"
              {...register('customerEmail')}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Special Requests</label>
              <textarea
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="Any special instructions?"
                {...register('specialRequests')}
              />
            </div>
            <Button type="submit" loading={loading} className="w-full">
              Place Order
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Checkout