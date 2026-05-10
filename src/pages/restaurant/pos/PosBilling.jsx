import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiCreditCard, FiPlus, FiPrinter } from 'react-icons/fi'
import api from '../../../services/api'
import { postPosPayment } from '../../../services/posApi'
import { usePosAccess } from '../../../hooks/usePosAccess'
import { useSocket } from '../../../hooks/useSocket'
import { posSounds } from '../../../utils/posSounds'

const METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'esewa', label: 'eSewa' },
  { value: 'khalti', label: 'Khalti' },
  { value: 'fonepay', label: 'FonePay' },
  { value: 'wallet', label: 'Wallet' },
]

export default function PosBilling() {
  const { canBilling, isOwner, employeeRole } = usePosAccess()
  const { socket } = useSocket()
  const [searchParams] = useSearchParams()
  const orderIdParam = searchParams.get('orderId')
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [lines, setLines] = useState([{ method: 'cash', amount: '' }])
  const refreshTimerRef = useRef(null)

  const balance = (o) => {
    const paid = Number(o.amountPaidTotal) || 0
    return Math.round((Number(o.grandTotal) - paid) * 100) / 100
  }

  const load = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true)
      const res = await api.get('/restaurant/customer-orders', {
        params: { paymentStatus: 'pending,partial', limit: 40 },
      })
      const nextOrders = res.data?.data?.orders || []
      setOrders(nextOrders)
      if (orderIdParam) {
        const nextSelected = nextOrders.find((order) => order._id === orderIdParam)
        if (nextSelected) {
          setSelected(nextSelected)
          setLines([{ method: 'cash', amount: String(balance(nextSelected)) }])
        } else {
          if (!silent) toast('That order is already paid or no longer payable.')
          setSelected(null)
        }
      } else if (selected?._id) {
        const nextSelected = nextOrders.find((order) => order._id === selected._id)
        setSelected(nextSelected || null)
      }
    } catch {
      if (!silent) toast.error('Failed to load bills')
    } finally {
      if (!silent) setLoading(false)
    }
  }, [orderIdParam, selected?._id])

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

  if (!canBilling) return <Navigate to=".." replace />

  const submitPay = async () => {
    if (!selected) return
    const payments = lines
      .filter((l) => l.amount && Number(l.amount) > 0)
      .map((l) => ({ method: l.method, amount: Number(l.amount) }))
    if (!payments.length) {
      toast.error('Enter at least one payment amount')
      return
    }
    try {
      await postPosPayment({ customerOrderId: selected._id, payments })
      posSounds.paymentOk()
      toast.success('Payment saved')
      setSelected(null)
      setLines([{ method: 'cash', amount: '' }])
      load()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Payment failed')
    }
  }

  if (loading) {
    return <div className="flex h-full items-center justify-center text-primary-700">Loading...</div>
  }

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="mx-auto grid max-w-6xl gap-4 lg:grid-cols-[1fr_420px]">
        <section className="space-y-3">
          <div className="rounded-3xl border border-surface-200 bg-white p-5 shadow-sm">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-primary-700">
              <FiCreditCard className="h-4 w-4" />
              Billing
            </span>
            <h1 className="mt-3 text-3xl font-black text-gray-950">Open bills</h1>
            <p className="mt-1 text-sm text-gray-500">Select an unpaid order, split tender, then print the receipt.</p>
          </div>

          {orders.map((o) => (
            <button
              key={o._id}
              type="button"
              onClick={() => {
                setSelected(o)
                setLines([{ method: 'cash', amount: String(balance(o)) }])
              }}
              className={`flex w-full items-center justify-between gap-3 rounded-3xl border p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${
                selected?._id === o._id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-surface-200 bg-white dark:border-gray-700 dark:bg-gray-900'
              }`}
            >
              <div>
                <p className="text-lg font-black text-gray-950 dark:text-gray-100">#{o.orderNumber}</p>
                <p className="text-sm text-gray-500">Payment: {o.paymentStatus}</p>
              </div>
              <p className="text-xl font-black text-primary-700">Rs. {balance(o)}</p>
            </button>
          ))}
          {!orders.length && (
            <div className="rounded-3xl border border-dashed border-surface-300 bg-white p-10 text-center text-sm text-gray-500">
              No pending payments.
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-surface-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <h2 className="text-xl font-black text-gray-950 dark:text-gray-100">Split payment</h2>
          {!selected && <p className="mt-4 text-sm text-gray-500">Select an order to start payment.</p>}
          {selected && (
            <>
              <div className="mt-4 rounded-2xl bg-primary-50 p-4">
                <p className="text-sm font-semibold text-primary-800">Order #{selected.orderNumber}</p>
                <p className="mt-1 text-3xl font-black text-primary-700">Rs. {balance(selected)}</p>
              </div>
              <div className="mt-4 space-y-2">
                {lines.map((line, idx) => (
                  <div key={idx} className="flex gap-2">
                    <select
                      value={line.method}
                      onChange={(e) => {
                        const next = [...lines]
                        next[idx] = { ...next[idx], method: e.target.value }
                        setLines(next)
                      }}
                      className="flex-1 rounded-xl border border-surface-200 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
                    >
                      {METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                    <input
                      type="number"
                      value={line.amount}
                      onChange={(e) => {
                        const next = [...lines]
                        next[idx] = { ...next[idx], amount: e.target.value }
                        setLines(next)
                      }}
                      className="w-32 rounded-xl border border-surface-200 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
                      placeholder="Rs."
                    />
                  </div>
                ))}
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-sm font-bold text-primary-700"
                  onClick={() => setLines([...lines, { method: 'cash', amount: '' }])}
                >
                  <FiPlus className="h-4 w-4" />
                  Add tender
                </button>
              </div>
              <button type="button" onClick={submitPay} className="mt-6 w-full rounded-xl bg-primary-600 py-3 text-sm font-bold text-white hover:bg-primary-700">
                Confirm payment
              </button>
              <button type="button" onClick={() => window.print()} className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-primary-600 py-2 text-sm font-bold text-primary-700">
                <FiPrinter className="h-4 w-4" />
                Print receipt
              </button>
              <div className="print-only mt-4 hidden text-xs">
                <pre className="whitespace-pre-wrap">
                  {JSON.stringify({ order: selected.orderNumber, paid: lines, staff: isOwner ? 'owner' : employeeRole }, null, 2)}
                </pre>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  )
}
