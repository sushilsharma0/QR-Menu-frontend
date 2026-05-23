import React, { useEffect, useState } from 'react'
import { FiMessageSquare, FiRefreshCw, FiStar } from 'react-icons/fi'
import toast from '@utils/toast'
import api from '../../services/api'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import { RestaurantPageLoader } from '../../components/restaurant/RestaurantUI'

const ratingStyles = {
  great: 'bg-emerald-100 text-emerald-800',
  average: 'bg-amber-100 text-amber-800',
  poor: 'bg-red-100 text-red-800',
}

export default function FeedbackInbox() {
  const [rows, setRows] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [serviceRating, setServiceRating] = useState('')
  const [page, setPage] = useState(1)

  const load = async (p = page) => {
    setLoading(true)
    try {
      const res = await api.get('/restaurant/crm/feedback', {
        params: { page: p, limit: 20, search: search || undefined, serviceRating: serviceRating || undefined },
      })
      setRows(res.data?.data?.feedback || [])
      setSummary(res.data?.data?.summary || null)
      setPage(res.data?.data?.pagination?.page || 1)
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load feedback')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load(1)
  }, [search, serviceRating])

  const togglePublic = async (id, isPublic) => {
    try {
      await api.patch(`/restaurant/crm/feedback/${id}`, { isPublic })
      load(page)
    } catch (e) {
      toast.error(e.response?.data?.message || 'Update failed')
    }
  }

  if (loading && !rows.length) return <RestaurantPageLoader label="Loading feedback…" />

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-950 dark:text-gray-100">Feedback inbox</h1>
          <p className="text-sm text-gray-500">Reviews from your QR customers</p>
        </div>
        <Button variant="secondary" onClick={() => load(page)}>
          <FiRefreshCw className="mr-1 inline" /> Refresh
        </Button>
      </div>

      {summary && (
        <div className="grid gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <p className="text-xs uppercase text-gray-500">Total</p>
            <p className="text-2xl font-bold">{summary.count}</p>
          </div>
          <div className="rounded-2xl border bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <p className="text-xs uppercase text-gray-500">Avg rating</p>
            <p className="text-2xl font-bold flex items-center gap-1">
              <FiStar className="text-amber-500" />
              {Number(summary.avgSystem || 0).toFixed(1)}
            </p>
          </div>
          <div className="rounded-2xl border bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <p className="text-xs uppercase text-gray-500">Great</p>
            <p className="text-2xl font-bold text-emerald-700">{summary.great}</p>
          </div>
          <div className="rounded-2xl border bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <p className="text-xs uppercase text-gray-500">Needs attention</p>
            <p className="text-2xl font-bold text-red-700">{summary.poor}</p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <Input className="max-w-xs" placeholder="Search name or comment" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select
          className="rounded-xl border border-surface-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
          value={serviceRating}
          onChange={(e) => setServiceRating(e.target.value)}
        >
          <option value="">All service ratings</option>
          <option value="great">Great</option>
          <option value="average">Average</option>
          <option value="poor">Poor</option>
        </select>
      </div>

      <div className="space-y-3">
        {rows.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-12 text-center text-gray-500">
            <FiMessageSquare className="mx-auto h-10 w-10 opacity-40" />
            <p className="mt-2 font-medium">No feedback yet</p>
          </div>
        ) : (
          rows.map((row) => (
            <article key={row._id} className="rounded-2xl border bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{row.customerName}</p>
                  <p className="text-xs text-gray-500">
                    Table {row.table?.tableNumber || '—'} · {new Date(row.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-primary-50 px-2 py-1 text-xs font-semibold text-primary-800">
                    {row.systemRating}/5
                  </span>
                  <span className={`rounded-full px-2 py-1 text-xs font-semibold capitalize ${ratingStyles[row.serviceRating] || ''}`}>
                    {row.serviceRating}
                  </span>
                </div>
              </div>
              {row.comment && <p className="mt-3 text-sm text-gray-700 dark:text-gray-300">{row.comment}</p>}
              <label className="mt-3 flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={row.isPublic !== false}
                  onChange={(e) => togglePublic(row._id, e.target.checked)}
                />
                Show on public profile
              </label>
            </article>
          ))
        )}
      </div>
    </div>
  )
}
