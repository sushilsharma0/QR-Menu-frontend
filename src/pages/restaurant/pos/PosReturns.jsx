import React, { useState } from 'react'
import { Navigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiRotateCcw } from 'react-icons/fi'
import { postPosRefund } from '../../../services/posApi'
import { usePosAccess } from '../../../hooks/usePosAccess'

export default function PosReturns() {
  const { canManager } = usePosAccess()
  const [customerOrderId, setCustomerOrderId] = useState('')
  const [amount, setAmount] = useState('')
  const [kind, setKind] = useState('partial')
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)

  if (!canManager) return <Navigate to=".." replace />

  const submit = async (e) => {
    e.preventDefault()
    if (!customerOrderId || !amount) {
      toast.error('Order id and amount required')
      return
    }
    setBusy(true)
    try {
      await postPosRefund({ customerOrderId, amount: Number(amount), kind, reason })
      toast.success('Refund recorded')
      setCustomerOrderId('')
      setAmount('')
      setReason('')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="mx-auto max-w-xl rounded-3xl border border-surface-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <span className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-red-700">
          <FiRotateCcw className="h-4 w-4" />
          Manager control
        </span>
        <h1 className="mt-3 text-3xl font-black text-gray-950 dark:text-gray-100">Returns and voids</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Creates an audit record and marks payment failed on the order.
        </p>
        <form onSubmit={submit} className="mt-5 space-y-3">
          <input placeholder="Customer order ID" value={customerOrderId} onChange={(e) => setCustomerOrderId(e.target.value)} className="w-full rounded-xl border border-surface-200 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800" />
          <input type="number" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full rounded-xl border border-surface-200 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800" />
          <select value={kind} onChange={(e) => setKind(e.target.value)} className="w-full rounded-xl border border-surface-200 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800">
            <option value="partial">Partial</option>
            <option value="full">Full</option>
            <option value="void">Void</option>
          </select>
          <textarea placeholder="Reason" value={reason} onChange={(e) => setReason(e.target.value)} className="w-full rounded-xl border border-surface-200 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800" rows={3} />
          <button type="submit" disabled={busy} className="w-full rounded-xl bg-primary-600 py-3 text-sm font-bold text-white hover:bg-primary-700 disabled:opacity-50">
            Submit refund
          </button>
        </form>
      </div>
    </div>
  )
}
