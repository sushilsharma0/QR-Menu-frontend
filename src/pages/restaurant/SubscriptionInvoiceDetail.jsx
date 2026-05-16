import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from '@utils/toast'
import { getSubscriptionInvoice } from '../../services/restaurant'
import InvoiceDocument from '../../components/billing/InvoiceDocument'
import { useTenantRoutes } from '../../hooks/useTenantRoutes'

export default function SubscriptionInvoiceDetail() {
  const { invoiceId } = useParams()
  const navigate = useNavigate()
  const { restaurantBase } = useTenantRoutes()
  const [invoice, setInvoice] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setLoading(true)
        const res = await getSubscriptionInvoice(invoiceId)
        const payload = res.data ?? res
        if (!cancelled) setInvoice(payload)
      } catch (e) {
        toast.error(e.response?.data?.message || 'Invoice not found')
        if (!cancelled) navigate(`${restaurantBase}/subscription`)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [invoiceId, navigate, restaurantBase])

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <InvoiceDocument
        invoice={invoice}
        onBack={() => navigate(`${restaurantBase}/subscription`)}
      />
    </div>
  )
}
