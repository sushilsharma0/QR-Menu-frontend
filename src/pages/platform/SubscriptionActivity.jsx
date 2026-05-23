import React, { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiBarChart2, FiCalendar, FiCreditCard, FiRefreshCw, FiSearch } from 'react-icons/fi'
import toast from '@utils/toast'
import api from '../../services/api'
import { usePlatformPageLoad } from '../../hooks/usePlatformPageLoad'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Table from '../../components/common/Table'
import Pagination from '../../components/common/Pagination'
import { formatters } from '../../utils/formatters'
import { DEFAULT_CURRENCY_SYMBOL } from '../../utils/currency'
import { PlatformMetric, PlatformPageHeader } from '../../components/platform/PlatformUI'

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
      setPagination(data.pagination || { page: 1, limit: 25, total: 0, pages: 1 })
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load activity report')
    } finally {
      setLoading(false)
    }
  }, [page, from, to, appliedRestaurantId])

  usePlatformPageLoad(() => {
    load()
  }, [load])

  const applyRestaurantFilter = () => {
    setAppliedRestaurantId(restaurantId.trim())
    setPage(1)
  }

  const resetRange = () => {
    setFrom(defaultFromDate())
    setTo(defaultToDate())
    setPage(1)
  }

  const sym = (row) => row.currencySymbol || DEFAULT_CURRENCY_SYMBOL

  const columns = [
    { header: 'Issued', render: (row) => formatters.datetime(row.issuedAt) },
    { header: 'Restaurant', render: (row) => row.restaurant?.name || 'N/A' },
    { header: 'Plan', render: (row) => row.planName || 'N/A' },
    {
      header: 'Duration',
      render: (row) =>
        row.durationLabel
          ? `${row.durationLabel}${row.durationDays != null ? ` (${row.durationDays}d)` : ''}`
          : row.durationDays != null
            ? `${row.durationDays} days`
            : 'N/A',
    },
    { header: 'Actual ex VAT', render: (row) => `${sym(row)}${Number(row.actualAmountExclVat || 0).toFixed(2)}` },
    { header: 'Tax VAT', render: (row) => `${sym(row)}${Number(row.taxAmount || 0).toFixed(2)}` },
    { header: 'Grand total', render: (row) => `${sym(row)}${Number(row.grandTotal || 0).toFixed(2)}` },
    { header: 'Type', render: (row) => <span className="capitalize">{row.transactionType}</span> },
    {
      header: 'Invoice',
      render: (row) => (
        <Link to={`/platform/invoices/${row.invoiceId}`} className="font-medium text-primary-600 hover:underline">
          {row.invoiceNumber}
        </Link>
      ),
    },
  ]

  const s = summary || {}

  return (
    <div className="space-y-6">
      <PlatformPageHeader
        badge="Billing Analytics"
        title="Subscription Activity"
        description="Packages billed per restaurant: actual amount excluding VAT, tax, and invoice history by date range."
        icon={FiBarChart2}
        actions={
          <Button type="button" variant="secondary" onClick={load} disabled={loading}>
            <FiRefreshCw className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <PlatformMetric label="Invoices in range" value={s.invoiceCount ?? 0} sub="Generated billing docs" icon={FiCalendar} accent="from-blue-500 to-indigo-500" />
        <PlatformMetric label="Subtotal ex VAT" value={`${DEFAULT_CURRENCY_SYMBOL}${Number(s.subtotalExclVat || 0).toFixed(2)}`} sub="Base subscription amount" icon={FiCreditCard} accent="from-emerald-500 to-teal-500" />
        <PlatformMetric label="Total tax" value={`${DEFAULT_CURRENCY_SYMBOL}${Number(s.vatAmount || 0).toFixed(2)}`} sub="VAT collected" icon={FiBarChart2} accent="from-amber-500 to-orange-500" />
        <PlatformMetric label="Grand total" value={`${DEFAULT_CURRENCY_SYMBOL}${Number(s.totalInclVat || 0).toFixed(2)}`} sub="Total collected" icon={FiCreditCard} accent="from-primary-600 to-secondary-500" />
      </div>

      <Card title="Filters">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[minmax(280px,1fr)_minmax(280px,1fr)_1fr_auto_auto_auto] xl:items-end">
          <Input
            label="From"
            type="date"
            value={from}
            onChange={(e) => { setFrom(e.target.value); setPage(1) }}
          />
          <Input
            label="To"
            type="date"
            value={to}
            onChange={(e) => { setTo(e.target.value); setPage(1) }}
          />
          <Input
            label="Restaurant ID (optional)"
            icon={FiSearch}
            value={restaurantId}
            onChange={(e) => setRestaurantId(e.target.value)}
            placeholder="Mongo ObjectId"
          />
          <Button type="button" onClick={applyRestaurantFilter}>Apply</Button>
          <Button type="button" variant="secondary" onClick={() => { setRestaurantId(''); setAppliedRestaurantId(''); setPage(1) }}>Clear</Button>
          <Button type="button" variant="secondary" onClick={resetRange}>Last 30 days</Button>
        </div>
      </Card>

      <Card title={`Activity List (${pagination.total || rows.length})`}>
        <Table columns={columns} data={rows} loading={loading} />
        <Pagination currentPage={pagination.page} totalPages={pagination.pages} onPageChange={setPage} />
      </Card>
    </div>
  )
}
