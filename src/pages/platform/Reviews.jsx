import React, { useCallback, useEffect, useState } from 'react'
import toast from '@utils/toast'
import { FiRefreshCw, FiStar } from 'react-icons/fi'
import api from '../../services/api'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Table from '../../components/common/Table'
import { PlatformMetric, PlatformPageHeader, PlatformPill, platformStatusStyles } from '../../components/platform/PlatformUI'

const serviceLabel = (v) => ({ great: 'Great', average: 'Average', poor: 'Poor' }[v] || v)

const PlatformReviews = () => {
  const [items, setItems] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 })
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ isActive: '', isPublic: '' })
  const [page, setPage] = useState(1)
  const [updatingId, setUpdatingId] = useState(null)

  const fetchList = useCallback(async () => {
    try {
      setLoading(true)
      const params = { page, limit: 20 }
      if (filters.isActive === 'true' || filters.isActive === 'false') params.isActive = filters.isActive
      if (filters.isPublic === 'true' || filters.isPublic === 'false') params.isPublic = filters.isPublic
      const res = await api.get('/platform/feedback', { params })
      const body = res.data?.data || {}
      setItems(body.items || [])
      setPagination(body.pagination || { page: 1, limit: 20, total: 0, pages: 0 })
    } catch {
      toast.error('Failed to load reviews')
    } finally {
      setLoading(false)
    }
  }, [page, filters.isActive, filters.isPublic])

  useEffect(() => {
    fetchList()
  }, [fetchList])

  const patchFlags = async (row, next) => {
    try {
      setUpdatingId(row._id)
      await api.patch(`/platform/feedback/${row._id}`, next)
      toast.success('Review updated')
      setItems((prev) =>
        prev.map((r) => (r._id === row._id ? { ...r, ...next } : r)),
      )
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed')
    } finally {
      setUpdatingId(null)
    }
  }

  const activeCount = items.filter((r) => r.isActive).length
  const publicCount = items.filter((r) => r.isPublic && r.isActive).length

  const columns = [
    {
      header: 'Restaurant',
      accessor: 'restaurant',
      render: (row) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-gray-100">{row.restaurant?.name || '—'}</p>
          {row.restaurant?.slug ? (
            <p className="text-xs text-gray-500 dark:text-gray-400">{row.restaurant.slug}</p>
          ) : null}
        </div>
      ),
    },
    {
      header: 'Guest',
      accessor: 'customerName',
      render: (row) => (
        <div>
          <p className="font-medium">{row.customerName || 'Guest'}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {row.systemRating != null ? `${row.systemRating}/5 stars` : '—'} · {serviceLabel(row.serviceRating)}
          </p>
        </div>
      ),
    },
    {
      header: 'Comment',
      accessor: 'comment',
      render: (row) => (
        <p className="max-w-md whitespace-normal text-gray-700 dark:text-gray-300">
          {row.comment ? (row.comment.length > 160 ? `${row.comment.slice(0, 160)}…` : row.comment) : '—'}
        </p>
      ),
    },
    {
      header: 'Active',
      accessor: 'isActive',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={updatingId === row._id}
            onClick={(e) => {
              e.stopPropagation()
              patchFlags(row, { isActive: !row.isActive })
            }}
            className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
              row.isActive ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
            }`}
            title={row.isActive ? 'Deactivate review' : 'Activate review'}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                row.isActive ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <PlatformPill className={row.isActive ? platformStatusStyles.active : platformStatusStyles.inactive}>
            {row.isActive ? 'On' : 'Off'}
          </PlatformPill>
        </div>
      ),
    },
    {
      header: 'Landing',
      accessor: 'isPublic',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={updatingId === row._id || !row.isActive}
            onClick={(e) => {
              e.stopPropagation()
              patchFlags(row, { isPublic: !row.isPublic })
            }}
            className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
              row.isPublic && row.isActive ? 'bg-emerald-600' : 'bg-gray-300 dark:bg-gray-600'
            }`}
            title={
              !row.isActive
                ? 'Activate the review first'
                : row.isPublic
                  ? 'Hide from public landing'
                  : 'Allow on public landing (still needs 4+ stars)'
            }
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                row.isPublic && row.isActive ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <span className="text-xs text-gray-500 dark:text-gray-400">Public</span>
        </div>
      ),
    },
    {
      header: 'Date',
      accessor: 'createdAt',
      render: (row) => (
        <span className="text-gray-600 dark:text-gray-400">
          {row.createdAt ? new Date(row.createdAt).toLocaleString() : '—'}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PlatformPageHeader
        badge="Moderation"
        title="Customer reviews"
        description="Turn individual feedback on or off, and control whether it may appear on the public landing page. Inactive reviews are hidden everywhere."
        icon={FiStar}
        actions={
          <Button type="button" variant="secondary" onClick={() => fetchList()} disabled={loading}>
            <FiRefreshCw className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <PlatformMetric
          label="Matching filter"
          value={pagination.total}
          sub={`Page ${pagination.page} of ${Math.max(1, pagination.pages)} · ${items.length} shown`}
          icon={FiStar}
          accent="from-violet-500 to-purple-500"
        />
        <PlatformMetric
          label="Active (page)"
          value={activeCount}
          sub="Reviews counting toward totals"
          icon={FiStar}
          accent="from-emerald-500 to-teal-500"
        />
        <PlatformMetric
          label="Public-ready (page)"
          value={publicCount}
          sub="Eligible for landing when rating ≥ 4"
          icon={FiStar}
          accent="from-amber-500 to-orange-500"
        />
      </div>

      <Card title="Filters">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Active status</label>
            <select
              value={filters.isActive}
              onChange={(e) => {
                setFilters((f) => ({ ...f, isActive: e.target.value }))
                setPage(1)
              }}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            >
              <option value="">All</option>
              <option value="true">Active only</option>
              <option value="false">Inactive only</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Landing visibility</label>
            <select
              value={filters.isPublic}
              onChange={(e) => {
                setFilters((f) => ({ ...f, isPublic: e.target.value }))
                setPage(1)
              }}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            >
              <option value="">All</option>
              <option value="true">Public on landing</option>
              <option value="false">Hidden from landing</option>
            </select>
          </div>
        </div>
      </Card>

      <Card title="All feedback">
        <Table columns={columns} data={items} loading={loading} />
        {pagination.pages > 1 ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {pagination.total} total · showing {(page - 1) * pagination.limit + 1}–
              {Math.min(page * pagination.limit, pagination.total)}
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={page >= pagination.pages || loading}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        ) : null}
      </Card>
    </div>
  )
}

export default PlatformReviews
