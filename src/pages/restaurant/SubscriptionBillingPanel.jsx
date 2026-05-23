import React, { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiFileText, FiClock, FiExternalLink } from 'react-icons/fi'
import toast from '@utils/toast'
import Table from '../../components/common/Table'
import Pagination from '../../components/common/Pagination'
import { getPackageHistory, getSubscriptionInvoices } from '../../services/restaurant'
import { useTenantRoutes } from '../../hooks/useTenantRoutes'
import { formatters } from '../../utils/formatters'
import { DEFAULT_CURRENCY_SYMBOL } from '../../utils/currency'
import { formatRestaurantCurrency } from '../../components/restaurant/RestaurantUI'
import { REALTIME_TOPICS } from '../../config/realtimeTopics'
import { useRealtimeRefresh } from '../../hooks/useRealtimeRefresh'

function BillingSection({ title, subtitle, icon: Icon, children }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border border-surface-200 bg-white shadow-sm"
    >
      <div className="flex items-center gap-3 border-b border-surface-200 px-5 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-950">{title}</h2>
          <p className="text-sm text-gray-500">{subtitle}</p>
        </div>
      </div>
      <div className="p-5">{children}</div>
    </motion.section>
  )
}

export default function SubscriptionBillingPanel() {
  const { restaurantBase } = useTenantRoutes()
  const [invoices, setInvoices] = useState([])
  const [invPage, setInvPage] = useState(1)
  const [invPagination, setInvPagination] = useState({ page: 1, pages: 1 })
  const [history, setHistory] = useState([])
  const [histPage, setHistPage] = useState(1)
  const [histPagination, setHistPagination] = useState({ page: 1, pages: 1 })
  const [loadingInv, setLoadingInv] = useState(true)
  const [loadingHist, setLoadingHist] = useState(true)

  const reloadInvoices = useCallback(async () => {
    try {
      setLoadingInv(true)
      const res = await getSubscriptionInvoices({ page: invPage, limit: 10 })
      const payload = res.data ?? res
      setInvoices(payload.invoices || [])
      setInvPagination(payload.pagination || { page: invPage, pages: 1 })
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load invoices')
    } finally {
      setLoadingInv(false)
    }
  }, [invPage])

  const reloadHistory = useCallback(async () => {
    try {
      setLoadingHist(true)
      const res = await getPackageHistory({ page: histPage, limit: 10 })
      const payload = res.data ?? res
      setHistory(payload.history || [])
      setHistPagination(payload.pagination || { page: histPage, pages: 1 })
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load package history')
    } finally {
      setLoadingHist(false)
    }
  }, [histPage])

  useRealtimeRefresh(() => {
    reloadInvoices()
    reloadHistory()
  }, [REALTIME_TOPICS.SUBSCRIPTION, REALTIME_TOPICS.ALL])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setLoadingInv(true)
        const res = await getSubscriptionInvoices({ page: invPage, limit: 10 })
        if (cancelled) return
        const payload = res.data ?? res
        setInvoices(payload.invoices || [])
        setInvPagination(payload.pagination || { page: invPage, pages: 1 })
      } catch (e) {
        toast.error(e.response?.data?.message || 'Failed to load invoices')
      } finally {
        if (!cancelled) setLoadingInv(false)
      }
    })()
    return () => { cancelled = true }
  }, [invPage])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setLoadingHist(true)
        const res = await getPackageHistory({ page: histPage, limit: 10 })
        if (cancelled) return
        const payload = res.data ?? res
        setHistory(payload.history || [])
        setHistPagination(payload.pagination || { page: histPage, pages: 1 })
      } catch (e) {
        toast.error(e.response?.data?.message || 'Failed to load package history')
      } finally {
        if (!cancelled) setLoadingHist(false)
      }
    })()
    return () => { cancelled = true }
  }, [histPage])

  const invoiceColumns = [
    { header: 'Invoice #', accessor: 'invoiceNumber' },
    { header: 'Plan', render: (row) => row.subscriptionPlan?.name || 'N/A' },
    { header: 'Type', render: (row) => <span className="capitalize">{row.transactionType}</span> },
    {
      header: 'Ex VAT',
      render: (row) => formatRestaurantCurrency(row.subtotalExclVat, row.issuerSnapshot?.currencySymbol || DEFAULT_CURRENCY_SYMBOL),
    },
    {
      header: 'VAT',
      render: (row) => formatRestaurantCurrency(row.vatAmount, row.issuerSnapshot?.currencySymbol || DEFAULT_CURRENCY_SYMBOL),
    },
    {
      header: 'Grand total',
      render: (row) => (
        <span className="font-semibold text-primary-700">
          {formatRestaurantCurrency(row.totalInclVat, row.issuerSnapshot?.currencySymbol || DEFAULT_CURRENCY_SYMBOL)}
        </span>
      ),
    },
    { header: 'Issued', render: (row) => formatters.date(row.issuedAt) },
    {
      header: '',
      render: (row) => (
        <Link to={`${restaurantBase}/subscription/invoice/${row._id}`} className="inline-flex items-center gap-1 font-semibold text-primary-600 hover:underline">
          View <FiExternalLink className="h-3.5 w-3.5" />
        </Link>
      ),
    },
  ]

  const historyColumns = [
    { header: 'Date', render: (row) => formatters.datetime(row.createdAt) },
    { header: 'Action', render: (row) => <span className="capitalize">{row.action}</span> },
    { header: 'Package', render: (row) => row.package?.name || 'N/A' },
    {
      header: 'Period',
      render: (row) => `${formatters.date(row.startDate)} -> ${formatters.date(row.endDate)}`,
    },
    {
      header: 'Amount',
      render: (row) => {
        const amt = row.amount ?? row.package?.price
        return amt != null ? formatRestaurantCurrency(amt, DEFAULT_CURRENCY_SYMBOL) : 'N/A'
      },
    },
    {
      header: 'Invoice',
      render: (row) =>
        row.invoice ? (
          <Link to={`${restaurantBase}/subscription/invoice/${row.invoice._id}`} className="font-semibold text-primary-600 hover:underline">
            {row.invoice.invoiceNumber}
          </Link>
        ) : (
          <span className="text-gray-400">N/A</span>
        ),
    },
  ]

  return (
    <div className="space-y-6">
      <BillingSection
        title="Tax invoices"
        subtitle="Official bills with VAT breakdown for your accounting records."
        icon={FiFileText}
      >
        <Table columns={invoiceColumns} data={invoices} loading={loadingInv} />
        <Pagination currentPage={invPagination.page} totalPages={invPagination.pages} onPageChange={setInvPage} />
      </BillingSection>

      <BillingSection
        title="Package activity"
        subtitle="A timeline of plan requests, approvals, renewals, and changes."
        icon={FiClock}
      >
        <Table columns={historyColumns} data={history} loading={loadingHist} />
        <Pagination currentPage={histPagination.page} totalPages={histPagination.pages} onPageChange={setHistPage} />
      </BillingSection>
    </div>
  )
}
