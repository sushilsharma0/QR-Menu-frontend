import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import Card from '../../components/common/Card'
import Table from '../../components/common/Table'
import Pagination from '../../components/common/Pagination'
import { getPackageHistory, getSubscriptionInvoices } from '../../services/restaurant'
import { useTenantRoutes } from '../../hooks/useTenantRoutes'
import { formatters } from '../../utils/formatters'
import { DEFAULT_CURRENCY_SYMBOL } from '../../utils/currency'

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
    {
      header: 'Plan',
      render: (row) => row.subscriptionPlan?.name || '—',
    },
    {
      header: 'Type',
      render: (row) => <span className="capitalize">{row.transactionType}</span>,
    },
    {
      header: 'Ex VAT',
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
      render: (row) => formatters.date(row.issuedAt),
    },
    {
      header: '',
      render: (row) => (
        <Link
          to={`${restaurantBase}/subscription/invoice/${row._id}`}
          className="text-primary-600 font-medium hover:underline"
        >
          View bill
        </Link>
      ),
    },
  ]

  const historyColumns = [
    {
      header: 'Date',
      render: (row) => formatters.datetime(row.createdAt),
    },
    {
      header: 'Action',
      render: (row) => <span className="capitalize">{row.action}</span>,
    },
    {
      header: 'Package',
      render: (row) => row.package?.name || '—',
    },
    {
      header: 'Period',
      render: (row) =>
        `${formatters.date(row.startDate)} → ${formatters.date(row.endDate)}`,
    },
    {
      header: 'Amount',
      render: (row) => {
        const p = row.package?.price
        const amt = row.amount ?? p
        return amt != null ? `${DEFAULT_CURRENCY_SYMBOL}${Number(amt).toFixed(2)}` : '—'
      },
    },
    {
      header: 'Invoice',
      render: (row) =>
        row.invoice ? (
          <Link
            to={`${restaurantBase}/subscription/invoice/${row.invoice._id}`}
            className="text-primary-600 font-medium hover:underline"
          >
            {row.invoice.invoiceNumber}
          </Link>
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
  ]

  return (
    <div className="space-y-8">
      <Card title="Your tax invoices">
        <p className="text-sm text-gray-600 mb-4">
          Official bills for subscription charges (VAT breakdown included). Use print to save a PDF for your records.
        </p>
        <Table columns={invoiceColumns} data={invoices} loading={loadingInv} />
        <Pagination
          currentPage={invPagination.page}
          totalPages={invPagination.pages}
          onPageChange={setInvPage}
        />
      </Card>

      <Card title="Package activity history">
        <p className="text-sm text-gray-600 mb-4">
          Timeline of plan assignments and changes — similar to an ISP billing history. New rows appear when the platform
          approves a plan.
        </p>
        <Table columns={historyColumns} data={history} loading={loadingHist} />
        <Pagination
          currentPage={histPagination.page}
          totalPages={histPagination.pages}
          onPageChange={setHistPage}
        />
      </Card>
    </div>
  )
}
