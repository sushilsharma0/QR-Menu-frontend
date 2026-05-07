import React, { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Table from '../../components/common/Table'
import Pagination from '../../components/common/Pagination'
import { getOrderActivityReport } from '../../services/restaurant'
import { useTenantRoutes } from '../../hooks/useTenantRoutes'
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

export default function OrderActivityReport() {
  const { restaurantBase } = useTenantRoutes()
  const [from, setFrom] = useState(defaultFromDate)
  const [to, setTo] = useState(defaultToDate)
  const [orderNumberQ, setOrderNumberQ] = useState('')
  const [appliedQ, setAppliedQ] = useState('')
  const [rows, setRows] = useState([])
  const [daily, setDaily] = useState([])
  const [totals, setTotals] = useState(null)
  const [pagination, setPagination] = useState({ page: 1, limit: 40, total: 0, pages: 1 })
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const params = { page, limit: 40, from, to }
      if (appliedQ.trim()) params.orderNumber = appliedQ.trim()
      const envelope = await getOrderActivityReport(params)
      const data = envelope.data
      setRows(data.rows || [])
      setDaily(data.daily || [])
      setTotals(data.totals || null)
      setPagination(data.pagination || pagination)
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load sales activity')
    } finally {
      setLoading(false)
    }
  }, [page, from, to, appliedQ])

  useEffect(() => {
    load()
  }, [load])

  const applySearch = () => {
    setAppliedQ(orderNumberQ.trim())
    setPage(1)
  }

  const t = totals || {}

  const orderColumns = [
    {
      header: 'Order #',
      render: (row) => (
        <Link
          to={`${restaurantBase}/orders/${row._id}`}
          className="text-primary-600 font-semibold hover:underline"
        >
          {row.orderNumber}
        </Link>
      ),
    },
    {
      header: 'Date',
      render: (row) => formatters.datetime(row.createdAt),
    },
    {
      header: 'Customer',
      render: (row) => row.customerName || '—',
    },
    {
      header: 'Table',
      render: (row) => row.tableNumber || '—',
    },
    {
      header: 'Items',
      render: (row) => (
        <span className="text-gray-700 max-w-xs block truncate" title={row.itemsLabel}>
          {row.itemsLabel || '—'}
        </span>
      ),
    },
    {
      header: 'Subtotal',
      render: (row) => `${DEFAULT_CURRENCY_SYMBOL}${Number(row.subtotalExclTax || 0).toFixed(2)}`,
    },
    {
      header: 'Tax',
      render: (row) => `${DEFAULT_CURRENCY_SYMBOL}${Number(row.taxAmount || 0).toFixed(2)}`,
    },
    {
      header: 'Total',
      render: (row) => `${DEFAULT_CURRENCY_SYMBOL}${Number(row.grandTotal || 0).toFixed(2)}`,
    },
    {
      header: 'Payment',
      render: (row) => (
        <span className="text-xs capitalize">
          {(row.paymentStatus || '—') + (row.paymentMethod ? ` / ${row.paymentMethod}` : '')}
        </span>
      ),
    },
  ]

  const dailyColumns = [
    { header: 'Date', accessor: 'date' },
    { header: 'Orders', render: (r) => r.orderCount },
    {
      header: 'Subtotal',
      render: (r) => `${DEFAULT_CURRENCY_SYMBOL}${Number(r.subtotal || 0).toFixed(2)}`,
    },
    {
      header: 'Tax',
      render: (r) => `${DEFAULT_CURRENCY_SYMBOL}${Number(r.tax || 0).toFixed(2)}`,
    },
    {
      header: 'Income (total)',
      render: (r) => `${DEFAULT_CURRENCY_SYMBOL}${Number(r.grandTotal || 0).toFixed(2)}`,
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Sales activity report</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Filter orders by date, search by order number, and review daily income with subtotal and tax for accounts.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card title="Orders in range">
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t.orderCount ?? 0}</p>
        </Card>
        <Card title="Subtotal (pre-tax)">
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {DEFAULT_CURRENCY_SYMBOL}{Number(t.subtotal || 0).toFixed(2)}
          </p>
        </Card>
        <Card title="Tax collected">
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {DEFAULT_CURRENCY_SYMBOL}{Number(t.tax || 0).toFixed(2)}
          </p>
        </Card>
        <Card title="Gross sales">
          <p className="text-2xl font-bold text-primary-600">
            {DEFAULT_CURRENCY_SYMBOL}{Number(t.grandTotal || 0).toFixed(2)}
          </p>
        </Card>
      </div>

      <Card title="Filters">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">From</label>
            <input
              type="date"
              value={from}
              onChange={(e) => {
                setFrom(e.target.value)
                setPage(1)
              }}
              className="px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">To</label>
            <input
              type="date"
              value={to}
              onChange={(e) => {
                setTo(e.target.value)
                setPage(1)
              }}
              className="px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg"
            />
          </div>
          <div className="w-56">
            <Input
              label="Order number contains"
              value={orderNumberQ}
              onChange={(e) => setOrderNumberQ(e.target.value)}
              placeholder="e.g. ORD-2026"
            />
          </div>
          <Button type="button" onClick={applySearch}>
            Search
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setOrderNumberQ('')
              setAppliedQ('')
              setPage(1)
            }}
          >
            Clear search
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

      <Card title="Daily income">
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">Totals grouped by calendar day (all orders in filter).</p>
        <Table columns={dailyColumns} data={daily} loading={loading && daily.length === 0} />
      </Card>

      <Card title="Orders list">
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
          Click an order number to open full order details.
        </p>
        <Table columns={orderColumns} data={rows} loading={loading} />
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.pages}
          onPageChange={setPage}
        />
      </Card>
    </div>
  )
}
