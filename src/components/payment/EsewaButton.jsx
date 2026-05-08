import React, { useState } from 'react'
import { FiCreditCard } from 'react-icons/fi'
import toast from 'react-hot-toast'
import api from '../../services/api'
import Button from '../common/Button'

const EsewaButton = ({ planId, disabled, onStarted }) => {
  const [loading, setLoading] = useState(false)

  const submitGatewayForm = (gateway) => {
    if (!gateway?.paymentUrl || !gateway?.payload) {
      throw new Error('eSewa gateway response is missing the payment URL or payload')
    }

    const form = document.createElement('form')
    form.method = (gateway.method || 'POST').toUpperCase()
    form.action = gateway.paymentUrl
    form.style.display = 'none'

    Object.entries(gateway.payload).forEach(([key, value]) => {
      if (value === undefined || value === null) return
      const input = document.createElement('input')
      input.type = 'hidden'
      input.name = key
      input.value = String(value)
      form.appendChild(input)
    })

    document.body.appendChild(form)
    form.submit()
  }

  const handlePay = async () => {
    if (loading) return
    try {
      setLoading(true)
      const res = await api.post('/restaurant/subscription/pay/esewa', { planId })
      const data = res.data?.data || {}
      onStarted?.(data.payment)
      submitGatewayForm(data.gateway)
      // Form submit triggers a full navigation; if for some reason it doesn't
      // (e.g. blocked by browser), reset loading after a short timeout.
      setTimeout(() => setLoading(false), 8000)
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Could not start eSewa payment'
      toast.error(msg)
      setLoading(false)
    }
  }

  return (
    <Button
      type="button"
      variant="primary"
      className="w-full"
      disabled={disabled || loading}
      loading={loading}
      onClick={handlePay}
    >
      <FiCreditCard className="mr-2" />
      Pay with eSewa
    </Button>
  )
}

export default EsewaButton
