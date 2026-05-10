import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiCreditCard, FiRefreshCw, FiShoppingCart } from 'react-icons/fi'
import { fetchPosOrders } from '../../../services/posApi'
import { useSocket } from '../../../hooks/useSocket'

export default function PosOrdersList() {
  const { posBase } = useOutletContext()
  const { socket } = useSocket()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const refreshTimerRef = useRef(null)

  const load = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true)
      const data = await fetchPosOrders({ limit: 60 })
      setOrders(data.orders || [])
    } catch {
      if (!silent) toast.error('Failed to load POS orders')
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!socket) return undefined

    const refreshRealtime = () => {
      window.clearTimeout(refreshTimerRef.current)
      refreshTimerRef.current = window.setTimeout(() => {
        load({ silent: true })
      }, 250)
    }

    const events = [
      'new_order',
      'pos:new_order',
      'order_updated',
      'payment_updated',
      'pos:payment_success',
    ]
    events.forEach((event) => socket.on(event, refreshRealtime))

    return () => {
      window.clearTimeout(refreshTimerRef.current)
      events.forEach((event) => socket.off(event, refreshRealtime))
    }
  }, [load, socket])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-primary-700">
        Loading orders...
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="mx-auto max-w-6xl space-y-4">
        <section className="rounded-3xl border border-surface-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-primary-700">
                <FiShoppingCart className="h-4 w-4" />
                POS Orders
              </span>
              <h1 className="mt-3 text-3xl font-black text-gray-950">Order queue</h1>
              <p className="mt-1 text-sm text-gray-500">Review recent POS orders and jump into billing when payment is due.</p>
            </div>
            <button
              type="button"
              onClick={load}
              className="inline-flex items-center gap-2 rounded-xl border border-surface-200 bg-white px-4 py-2 text-sm font-bold text-gray-700 hover:bg-surface-50"
            >
              <FiRefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </section>

        {!orders.length && (
          <div className="rounded-3xl border border-dashed border-surface-300 bg-white p-10 text-center text-sm text-gray-500">
            No POS orders yet.
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {orders.map((row) => {
            const o = row.customerOrder
            if (!o) return null
            const isPayable = o.paymentStatus === 'pending' || o.paymentStatus === 'partial'
            return (
              <article
                key={row._id}
                className="rounded-3xl border border-surface-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-black text-gray-950">#{o.orderNumber}</p>
                    <p className="mt-1 text-sm text-gray-500">
                      {o.status} - {o.paymentStatus} - {o.orderChannel}
                    </p>
                  </div>
                  <p className="text-xl font-black text-primary-700">Rs. {o.grandTotal}</p>
                </div>
                <div className="mt-4 flex justify-end">
                  {isPayable ? (
                    <Link
                      to={`${posBase}/billing?orderId=${o._id}`}
                      className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-bold text-white hover:bg-primary-700"
                    >
                      <FiCreditCard className="h-4 w-4" />
                      Pay
                    </Link>
                  ) : (
                    <span className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700">
                      <FiCreditCard className="h-4 w-4" />
                      Paid
                    </span>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </div>
  )
}
