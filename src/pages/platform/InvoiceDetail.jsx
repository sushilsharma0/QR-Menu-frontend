import React, { useCallback, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from '@utils/toast'
import api from '../../services/api'
import InvoiceDocument from '../../components/billing/InvoiceDocument'
import { usePlatformPageLoad } from '../../hooks/usePlatformPageLoad'

export default function PlatformInvoiceDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [invoice, setInvoice] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadInvoice = useCallback(async () => {
    try {
      setLoading(true)
      const res = await api.get(`/platform/billing/invoices/${id}`)
      setInvoice(res.data?.data ?? res.data)
    } catch (e) {
      toast.error(e.response?.data?.message || 'Invoice not found')
      navigate('/platform/invoices')
    } finally {
      setLoading(false)
    }
  }, [id, navigate])

  usePlatformPageLoad(() => {
    loadInvoice()
  }, [loadInvoice])

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
        onBack={() => navigate('/platform/invoices')}
      />
    </div>
  )
}
