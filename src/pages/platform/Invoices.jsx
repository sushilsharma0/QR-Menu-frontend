import React, { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import Card from '../../components/common/Card'
import Table from '../../components/common/Table'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'
import Pagination from '../../components/common/Pagination'
import api from '../../services/api'
import { formatters } from '../../utils/formatters'
import { DEFAULT_CURRENCY_SYMBOL } from '../../utils/currency'

export default function PlatformInvoices() {
  const [invoices, setInvoices] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 })
  const [summary, setSummary] = useState([])
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [restaurantFilter, setRestaurantFilter] = useState('')
  const [appliedRestaurantId, setAppliedRestaurantId] = useState('')
  const [page, setPage] = useState(1)

  const loadInvoices = useCallback(async () => {
    try {
      setLoading(true)
      const params = { page, limit: 20 }
      if (appliedRestaurantId.trim()) params.restaurantId = appliedRestaurantId.trim()
      const res = await api.get('/platform/billing/invoices', { params })
      const data = res.data.data
      setInvoices(data.invoices || [])
      setPagination(data.pagination || { page, limit: 20, total: 0, pages: 1 })
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load invoices')
    } finally {
      setLoading(false)
    }
  }, [page, appliedRestaurantId])

  useEffect(() => {
    loadInvoices()
  }, [loadInvoices])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setStatsLoading(true)
        const res = await api.get('/platform/billing/stats/by-restaurant')
        if (!cancelled) setSummary(res.data.data?.summary || [])
      } catch (e) {
        toast.error(e.response?.data?.message || 'Failed to load billing stats')
      } finally {
        if (!cancelled) setStatsLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  const applyFilter = () => {
    setAppliedRestaurantId(restaurantFilter.trim())
    setPage(1)
  }

  const clearFilter = () => {
    setRestaurantFilter('')
    setAppliedRestaurantId('')
    setPage(1)
  }

  const columns = [
    { header: 'Invoice', accessor: 'invoiceNumber' },
    {
      header: 'Restaurant',
      render: (row) => row.restaurant?.name || '—',
    },
    {
      header: 'Plan',
      render: (row) => row.subscriptionPlan?.name || '—',
    },
    {
      header: 'Type',
      render: (row) => <span className="capitalize">{row.transactionType}</span>,
    },
    {
      header: 'Subtotal (ex VAT)',
      render: (row) => {
        const sym = row.issuerSnapshot?.currencySymbol || DEFAULT_CURRENCY_SYMBOL
        return `${sym}${Number(row.subtotalExclVat || 0).toFixed(2)}`
      },
    },
    {
      header: 'VAT',
      render: (row) => {
        const sym = row.issuerSnapshot?.currencySymbol || DEFAULT_CURRENCY_SYMBOL
        return `${sym}${Number(row.vatAmount || 0).toFixed(2)}`
      },
    },
    {
      header: 'Grand total',
      render: (row) => {
        const sym = row.issuerSnapshot?.currencySymbol || DEFAULT_CURRENCY_SYMBOL
        return `${sym}${Number(row.totalInclVat || 0).toFixed(2)}`
      },
    },
    {
      header: 'Issued',
      render: (row) => formatters.datetime(row.issuedAt),
    },
    {
      header: '',
      render: (row) => (
        <Link
          to={`/platform/invoices/${row._id}`}
          className="text-primary-600 font-medium hover:underline"
        >
          View / Print
        </Link>
      ),
    },
  ]

  const summaryColumns = [
    {
      header: 'Restaurant',
      render: (row) => row.restaurant?.name || '—',
    },
    { header: 'Invoices', render: (row) => row.invoiceCount },
    { header: 'Renewals', render: (row) => row.renewalCount },
    {
      header: 'Last invoice',
      render: (row) => (row.lastIssuedAt ? formatters.datetime(row.lastIssuedAt) : '—'),
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Subscription invoices</h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">
          Track billing per restaurant, renewal counts, and open printable tax documents for compliance.
        </p>
      </div>

      <Card title="Renewals & billing volume (by restaurant)">
        <Table
          columns={summaryColumns}
          data={summary}
          loading={statsLoading}
        />
      </Card>

      <Card title="All invoices">
        <div className="flex flex-wrap gap-3 mb-4 items-end">
          <div className="w-64">
            <Input
              label="Restaurant ID (optional)"
              value={restaurantFilter}
              onChange={(e) => setRestaurantFilter(e.target.value)}
              placeholder="Mongo ObjectId"
            />
          </div>
          <Button type="button" onClick={applyFilter}>
            Apply filter
          </Button>
          <Button type="button" variant="secondary" onClick={clearFilter}>
            Clear
          </Button>
        </div>
        <Table columns={columns} data={invoices} loading={loading} />
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.pages}
          onPageChange={setPage}
        />
      </Card>
    </div>
  )
}
