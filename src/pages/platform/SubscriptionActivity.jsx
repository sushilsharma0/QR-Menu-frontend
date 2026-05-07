import React, { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../../services/api'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Table from '../../components/common/Table'
import Pagination from '../../components/common/Pagination'
import { formatters } from '../../utils/formatters'
import { DEFAULT_CURRENCY_SYMBOL } from '../../utils/currency'

function defaultToDate() {
  const d = new Date()
  return d.toISOString().slice(0, 10)
}

function defaultFromDate() {
  const d = new Date()
  d.setDate(d.getDate() - 30)
  return d.toISOString().slice(0, 10)
}

export default function SubscriptionActivity() {
  const [from, setFrom] = useState(defaultFromDate)
  const [to, setTo] = useState(defaultToDate)
  const [restaurantId, setRestaurantId] = useState('')
  const [appliedRestaurantId, setAppliedRestaurantId] = useState('')
  const [rows, setRows] = useState([])
  const [summary, setSummary] = useState(null)
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, pages: 1 })
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const params = { page, limit: 25, from, to }
      if (appliedRestaurantId.trim()) params.restaurantId = appliedRestaurantId.trim()
      const res = await api.get('/platform/billing/activity-report', { params })
      const data = res.data.data
      setRows(data.rows || [])
      setSummary(data.summary || null)
      setPagination(data.pagination || pagination)
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load activity report')
    } finally {
      setLoading(false)
    }
  }, [page, from, to, appliedRestaurantId])

  useEffect(() => {
    load()
  }, [load])

  const applyRestaurantFilter = () => {
    setAppliedRestaurantId(restaurantId.trim())
    setPage(1)
  }

  const sym = (row) => row.currencySymbol || DEFAULT_CURRENCY_SYMBOL

  const columns = [
    {
      header: 'Issued',
      render: (row) => formatters.datetime(row.issuedAt),
    },
    {
      header: 'Restaurant',
      render: (row) => row.restaurant?.name || '—',
    },
    {
      header: 'Plan',
      render: (row) => row.planName || '—',
    },
    {
      header: 'Duration',
      render: (row) =>
        row.durationLabel
          ? `${row.durationLabel}${row.durationDays != null ? ` (${row.durationDays}d)` : ''}`
          : row.durationDays != null
            ? `${row.durationDays} days`
            : '—',
    },
    {
      header: 'Actual (ex VAT)',
      render: (row) => `${sym(row)}${Number(row.actualAmountExclVat || 0).toFixed(2)}`,
    },
    {
      header: 'Tax (VAT)',
      render: (row) => `${sym(row)}${Number(row.taxAmount || 0).toFixed(2)}`,
    },
    {
      header: 'Grand total',
      render: (row) => `${sym(row)}${Number(row.grandTotal || 0).toFixed(2)}`,
    },
    {
      header: 'Type',
      render: (row) => <span className="capitalize">{row.transactionType}</span>,
    },
    {
      header: 'Invoice',
      render: (row) => (
        <Link to={`/platform/invoices/${row.invoiceId}`} className="text-primary-600 font-medium hover:underline">
          {row.invoiceNumber}
        </Link>
      ),
    },
  ]

  const s = summary || {}

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Subscription activity report</h1>
        <p className="text-gray-500 mt-1">
          Packages billed per restaurant: actual amount (ex VAT), tax, and invoice — filter by date range.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card title="Invoices in range">
          <p className="text-2xl font-bold text-gray-900">{s.invoiceCount ?? 0}</p>
        </Card>
        <Card title="Subtotal (ex VAT)">
          <p className="text-2xl font-bold text-gray-900">
            {DEFAULT_CURRENCY_SYMBOL}{Number(s.subtotalExclVat || 0).toFixed(2)}
          </p>
        </Card>
        <Card title="Total tax (VAT)">
          <p className="text-2xl font-bold text-gray-900">
            {DEFAULT_CURRENCY_SYMBOL}{Number(s.vatAmount || 0).toFixed(2)}
          </p>
        </Card>
        <Card title="Grand total collected">
          <p className="text-2xl font-bold text-primary-600">
            {DEFAULT_CURRENCY_SYMBOL}{Number(s.totalInclVat || 0).toFixed(2)}
          </p>
        </Card>
      </div>

      <Card title="Filters">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
            <input
              type="date"
              value={from}
              onChange={(e) => {
                setFrom(e.target.value)
                setPage(1)
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
            <input
              type="date"
              value={to}
              onChange={(e) => {
                setTo(e.target.value)
                setPage(1)
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="w-56">
            <Input
              label="Restaurant ID (optional)"
              value={restaurantId}
              onChange={(e) => setRestaurantId(e.target.value)}
              placeholder="Mongo ObjectId"
            />
          </div>
          <Button type="button" onClick={applyRestaurantFilter}>
            Apply restaurant
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setRestaurantId('')
              setAppliedRestaurantId('')
              setPage(1)
            }}
          >
            Clear restaurant
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setFrom(defaultFromDate())
              setTo(defaultToDate())
              setPage(1)
            }}
          >
            Last 30 days
          </Button>
        </div>
      </Card>

      <Card title="Activity list">
        <Table columns={columns} data={rows} loading={loading} />
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.pages}
          onPageChange={setPage}
        />
      </Card>
    </div>
  )
}
