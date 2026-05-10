import React, { useEffect, useState } from 'react'
import { Navigate, useOutletContext } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiClock } from 'react-icons/fi'
import { closePosShift, fetchPosShift, openPosShift } from '../../../services/posApi'
import { fetchPosMeta } from '../../../services/posApi'
import { usePosAccess } from '../../../hooks/usePosAccess'

export default function PosShift() {
  const { canShift } = usePosAccess()
  const { setMeta } = useOutletContext()
  const [data, setData] = useState(null)
  const [opening, setOpening] = useState('')
  const [closing, setClosing] = useState('')
  const [busy, setBusy] = useState(false)

  const refresh = async () => {
    const next = await fetchPosShift()
    setData(next)
    fetchPosMeta().then(setMeta).catch(() => {})
    return next
  }

  useEffect(() => {
    refresh().catch(() => {})
  }, [])

  if (!canShift) return <Navigate to=".." replace />

  const open = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      await openPosShift({ openingCash: Number(opening) || 0 })
      toast.success('Shift opened')
      setOpening('')
      await refresh()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed')
    } finally {
      setBusy(false)
    }
  }

  const close = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      await closePosShift({ closingCash: Number(closing) || 0 })
      toast.success('Shift closed')
      setClosing('')
      await refresh()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="mx-auto max-w-xl space-y-4">
        <section className="rounded-3xl border border-surface-200 bg-white p-6 shadow-sm">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-primary-700">
            <FiClock className="h-4 w-4" />
            Shift
          </span>
          <h1 className="mt-3 text-3xl font-black text-gray-950">Cash shift</h1>
          <p className="mt-1 text-sm text-gray-500">Open and close cashier float for the current POS session.</p>
        </section>

        {data?.open && data?.shift ? (
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm dark:border-emerald-900 dark:bg-emerald-950/40">
            <p className="text-lg font-black text-emerald-950 dark:text-emerald-100">
              Shift open
            </p>
            <p className="mt-1 text-sm text-emerald-800 dark:text-emerald-200">
              Started {new Date(data.shift.openedAt).toLocaleString()} - Opening float Rs. {data.shift.openingCash}
            </p>
            <form onSubmit={close} className="mt-4 space-y-3">
              <input type="number" placeholder="Closing cash count" value={closing} onChange={(e) => setClosing(e.target.value)} className="w-full rounded-xl border border-surface-200 px-3 py-2 dark:border-gray-600 dark:bg-gray-800" />
              <button type="submit" disabled={busy} className="w-full rounded-xl bg-primary-600 py-3 text-sm font-bold text-white hover:bg-primary-700 disabled:opacity-50">
                Close shift
              </button>
            </form>
          </div>
        ) : (
          <form onSubmit={open} className="rounded-3xl border border-surface-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">No open shift</p>
            <input type="number" placeholder="Opening cash" value={opening} onChange={(e) => setOpening(e.target.value)} className="mt-3 w-full rounded-xl border border-surface-200 px-3 py-2 dark:border-gray-600 dark:bg-gray-800" />
            <button type="submit" disabled={busy} className="mt-3 w-full rounded-xl bg-primary-600 py-3 text-sm font-bold text-white hover:bg-primary-700 disabled:opacity-50">
              Open shift
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
