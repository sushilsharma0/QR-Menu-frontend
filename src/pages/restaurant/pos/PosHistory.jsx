import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { FiClock } from 'react-icons/fi'
import api from '../../../services/api'

export default function PosHistory() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let ok = true
    ;(async () => {
      try {
        const res = await api.get('/restaurant/customer-orders', {
          params: { status: 'completed,served', limit: 80 },
        })
        if (ok) setOrders(res.data?.data?.orders || [])
      } catch {
        if (ok) toast.error('Failed to load history')
      } finally {
        if (ok) setLoading(false)
      }
    })()
    return () => {
      ok = false
    }
  }, [])

  if (loading) return <div className="flex h-full items-center justify-center text-primary-700">Loading...</div>

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="mx-auto max-w-5xl space-y-4">
        <section className="rounded-3xl border border-surface-200 bg-white p-5 shadow-sm">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-primary-700">
            <FiClock className="h-4 w-4" />
            History
          </span>
          <h1 className="mt-3 text-3xl font-black text-gray-950">Customer history</h1>
          <p className="mt-1 text-sm text-gray-500">Completed and served POS orders for quick lookup.</p>
        </section>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {orders.map((o) => (
            <article key={o._id} className="rounded-3xl border border-surface-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap justify-between gap-2">
                <span className="text-lg font-black text-gray-950">#{o.orderNumber}</span>
                <span className="text-lg font-black text-primary-700">Rs. {o.grandTotal}</span>
              </div>
              <div className="mt-2 text-sm text-gray-500">
                {o.customerName || 'Guest'} - {o.customerPhone || '-'} - {o.orderChannel} - {o.status}
              </div>
            </article>
          ))}
        </div>
        {!orders.length && (
          <div className="rounded-3xl border border-dashed border-surface-300 bg-white p-10 text-center text-sm text-gray-500">
            No completed orders in this view.
          </div>
        )}
      </div>
    </div>
  )
}
