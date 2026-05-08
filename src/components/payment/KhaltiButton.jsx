import React, { useState } from 'react'
import { FiZap } from 'react-icons/fi'
import toast from 'react-hot-toast'
import api from '../../services/api'
import Button from '../common/Button'

const KhaltiButton = ({ planId, disabled, onStarted }) => {
  const [loading, setLoading] = useState(false)

  const handlePay = async () => {
    if (loading) return
    try {
      setLoading(true)
      const res = await api.post('/restaurant/subscription/pay/khalti', { planId })
      const data = res.data?.data || {}
      const { gateway, payment } = data
      onStarted?.(payment)
      if (!gateway?.payment_url) {
        throw new Error('Khalti did not return a payment URL')
      }
      window.location.href = gateway.payment_url
      // navigation triggered; safety reset in case it gets blocked
      setTimeout(() => setLoading(false), 8000)
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Could not start Khalti payment'
      toast.error(msg)
      setLoading(false)
    }
  }

  return (
    <Button
      type="button"
      variant="secondary"
      className="w-full"
      disabled={disabled || loading}
      loading={loading}
      onClick={handlePay}
    >
      <FiZap className="mr-2" />
      Pay with Khalti
    </Button>
  )
}

export default KhaltiButton
