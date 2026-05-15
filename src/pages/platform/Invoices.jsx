import React, { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { FiClipboard, FiCreditCard, FiFileText, FiRefreshCw, FiSearch } from 'react-icons/fi'
import toast from '@utils/toast'
import Card from '../../components/common/Card'
import Table from '../../components/common/Table'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'
import Pagination from '../../components/common/Pagination'
import api from '../../services/api'
import { formatters } from '../../utils/formatters'
import { DEFAULT_CURRENCY_SYMBOL } from '../../utils/currency'
import { PlatformMetric, PlatformPageHeader } from '../../components/platform/PlatformUI'

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

  const totalSummaryInvoices = summary.reduce((sum, row) => sum + Number(row.invoiceCount || 0), 0)
  const totalRenewals = summary.reduce((sum, row) => sum + Number(row.renewalCount || 0), 0)

  return (
    <div className="space-y-6">
      <PlatformPageHeader
        badge="Billing Documents"
        title="Subscription Invoices"
        description="Track billing per restaurant, renewal counts, and printable tax documents for compliance."
        icon={FiFileText}
        actions={
          <Button type="button" variant="secondary" onClick={loadInvoices} disabled={loading}>
            <FiRefreshCw className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <PlatformMetric label="Invoices loaded" value={pagination.total || invoices.length} sub="Matching current filters" icon={FiClipboard} accent="from-blue-500 to-indigo-500" />
        <PlatformMetric label="Summary invoices" value={totalSummaryInvoices} sub="Across restaurant billing stats" icon={FiFileText} accent="from-emerald-500 to-teal-500" />
        <PlatformMetric label="Renewals" value={totalRenewals} sub="Renewal invoices tracked" icon={FiCreditCard} accent="from-amber-500 to-orange-500" />
      </div>

      <Card title="Renewals & billing volume (by restaurant)">
        <Table
          columns={summaryColumns}
          data={summary}
          loading={statsLoading}
        />
      </Card>

      <Card title="All invoices">
        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-[260px_auto_auto] md:items-end">
          <div className="w-64">
            <Input
              label="Restaurant ID (optional)"
              icon={FiSearch}
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
