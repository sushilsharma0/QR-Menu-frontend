import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiDownload,
  FiFilter,
  FiLock,
  FiRefreshCw,
  FiSearch,
  FiShield,
  FiUser,
} from 'react-icons/fi'
import api from '../../services/api'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'

const STATUS_OPTIONS = [
  { value: '', label: 'All events' },
  { value: 'success', label: 'Successful events' },
  { value: 'failed', label: 'Failed / blocked events' },
  { value: 'operation', label: 'Orders & payments' },
]

const ACTION_OPTIONS = [
  { value: '', label: 'All actions' },
  { value: 'login', label: 'Login' },
  { value: 'logout', label: 'Logout' },
  { value: 'login_failed', label: 'Login failed' },
  { value: 'validation_failed', label: 'Validation failed' },
  { value: 'forbidden_action', label: 'Forbidden action' },
  { value: 'request_rejected', label: 'Request rejected' },
  { value: 'order_status_update', label: 'Order status update' },
  { value: 'order_cancelled', label: 'Order cancelled' },
  { value: 'payment_received', label: 'Payment received' },
  { value: 'payment_refunded', label: 'Payment refunded' },
]

const failedActions = new Set(['login_failed', 'validation_failed', 'forbidden_action', 'request_rejected'])
const operationActions = new Set(['order_status_update', 'order_cancelled', 'payment_received', 'payment_refunded'])

const actionMeta = {
  login: { label: 'Login', icon: FiCheckCircle, pill: 'bg-emerald-100 text-emerald-800', accent: 'bg-emerald-50 text-emerald-700' },
  logout: { label: 'Logout', icon: FiClock, pill: 'bg-blue-100 text-blue-800', accent: 'bg-blue-50 text-blue-700' },
  login_failed: { label: 'Login failed', icon: FiAlertCircle, pill: 'bg-red-100 text-red-800', accent: 'bg-red-50 text-red-700' },
  validation_failed: { label: 'Validation failed', icon: FiLock, pill: 'bg-amber-100 text-amber-800', accent: 'bg-amber-50 text-amber-700' },
  forbidden_action: { label: 'Forbidden action', icon: FiLock, pill: 'bg-red-100 text-red-800', accent: 'bg-red-50 text-red-700' },
  request_rejected: { label: 'Request rejected', icon: FiShield, pill: 'bg-orange-100 text-orange-800', accent: 'bg-orange-50 text-orange-700' },
  order_status_update: { label: 'Order updated', icon: FiClock, pill: 'bg-indigo-100 text-indigo-800', accent: 'bg-indigo-50 text-indigo-700' },
  order_cancelled: { label: 'Order cancelled', icon: FiAlertCircle, pill: 'bg-red-100 text-red-800', accent: 'bg-red-50 text-red-700' },
  payment_received: { label: 'Payment received', icon: FiCheckCircle, pill: 'bg-emerald-100 text-emerald-800', accent: 'bg-emerald-50 text-emerald-700' },
  payment_refunded: { label: 'Payment refunded', icon: FiAlertCircle, pill: 'bg-orange-100 text-orange-800', accent: 'bg-orange-50 text-orange-700' },
}

const formatAction = (action) => actionMeta[action]?.label || String(action || 'Unknown').replace(/_/g, ' ')

const formatDate = (value) => {
  if (!value) return 'N/A'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'N/A'
  return date.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
}

const getActorName = (log) => log?.user?.name || log?.details?.actorName || log?.user?.username || log?.details?.username || 'Unknown user'

const getActorSubtext = (log) => {
  const username = log?.user?.username || log?.user?.email || log?.details?.username
  const role = log?.details?.actorRole || log?.details?.role || log?.user?.role || log?.userModel
  return [username, role].filter(Boolean).join(' - ') || 'User activity'
}

const getLogMessage = (log) => {
  const details = log?.details || {}
  return details.message || details.reason || details.error || details.path || 'No additional details recorded.'
}

const getOperationSummary = (log) => {
  const details = log?.details || {}
  if (log.action === 'order_status_update') {
    return `Order ${details.orderNumber || '-'}: ${details.previousStatus || '-'} to ${details.status || '-'}`
  }
  if (log.action === 'payment_received') {
    return `${details.receiptNo || 'Receipt'} - ${details.paymentMethod || 'payment'} - ${details.amount || 0}`
  }
  if (log.action === 'payment_refunded') {
    return `${details.receiptNo || 'Receipt'} refunded - ${details.amount || 0}`
  }
  if (log.action === 'order_cancelled') {
    return `Order ${details.orderNumber || '-'} cancelled`
  }
  return details.orderNumber || details.receiptNo || log.resource || 'System'
}

const ActionPill = ({ action }) => {
  const meta = actionMeta[action] || actionMeta.request_rejected
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${meta.pill}`}>{formatAction(action)}</span>
}

const MetricTile = ({ label, value, sub, icon: Icon, accent }) => (
  <motion.div whileHover={{ y: -3 }} className="rounded-2xl border border-surface-200 bg-white p-4 shadow-sm">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
        <p className="mt-2 text-2xl font-bold text-gray-950">{value}</p>
        {sub && <p className="mt-1 text-xs text-gray-500">{sub}</p>}
      </div>
      <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${accent} text-white shadow-md`}>
        <Icon className="h-5 w-5" />
      </div>
    </div>
  </motion.div>
)

const LogCard = ({ log, index }) => {
  const meta = actionMeta[log.action] || actionMeta.request_rejected
  const Icon = meta.icon
  const failed = failedActions.has(log.action)
  const operation = operationActions.has(log.action)

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: Math.min(index * 0.025, 0.15) }}
      className="rounded-3xl border border-surface-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 gap-3">
          <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${meta.accent}`}>
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <ActionPill action={log.action} />
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                failed ? 'bg-red-50 text-red-700' : operation ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700'
              }`}>
                {failed ? 'Attention' : operation ? 'Operation' : 'Success'}
              </span>
            </div>
            <h2 className="mt-3 text-lg font-bold text-gray-950">{getActorName(log)}</h2>
            <p className="mt-1 text-sm text-gray-500">{getActorSubtext(log)}</p>
          </div>
        </div>
        <div className="text-left lg:text-right">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Time</p>
          <p className="mt-1 text-sm font-bold text-gray-950">{formatDate(log.timestamp || log.createdAt)}</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 rounded-2xl bg-surface-50/70 p-4 md:grid-cols-3">
        <div>
          <p className="text-xs text-gray-500">Role</p>
          <p className="mt-1 font-bold capitalize text-gray-950">{log.details?.actorRole || log.details?.role || log.user?.role || 'N/A'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Order / Receipt</p>
          <p className="mt-1 font-bold text-gray-950">{getOperationSummary(log)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">IP address</p>
          <p className="mt-1 font-bold text-gray-950">{log.ipAddress || log.details?.ipAddress || 'N/A'}</p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-surface-200 bg-white px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Details</p>
        <p className="mt-2 break-words text-sm leading-6 text-gray-700">{getLogMessage(log)}</p>
      </div>
    </motion.article>
  )
}

const SystemLogs = () => {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState('table')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 20 })

  const fetchLogs = async (quiet = false) => {
    try {
      if (quiet) setRefreshing(true)
      else setLoading(true)

      const res = await api.get('/restaurant/logs/employee-activities', {
        params: {
          page,
          limit: 20,
          status: statusFilter || undefined,
          action: actionFilter || undefined,
        },
      })
      setLogs(res.data?.data?.logs || [])
      setPagination(res.data?.data?.pagination || { page, pages: 1, total: 0, limit: 20 })
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch employee logs')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [statusFilter, actionFilter, page])

  const filteredLogs = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return logs
    return logs.filter((log) => {
      const haystack = [
        getActorName(log),
        getActorSubtext(log),
        formatAction(log.action),
        getLogMessage(log),
        log.resource,
        log.ipAddress,
      ].filter(Boolean).join(' ').toLowerCase()
      return haystack.includes(q)
    })
  }, [logs, search])

  const counts = useMemo(() => {
    return logs.reduce(
      (acc, log) => {
        if (failedActions.has(log.action)) acc.failed += 1
        else if (operationActions.has(log.action)) acc.operations += 1
        else acc.success += 1
        if (log.action === 'login') acc.login += 1
        if (log.action === 'logout') acc.logout += 1
        return acc
      },
      { success: 0, failed: 0, login: 0, logout: 0, operations: 0 },
    )
  }, [logs])

  const resetFilters = () => {
    setStatusFilter('')
    setActionFilter('')
    setSearch('')
    setPage(1)
  }

  const exportCSV = () => {
    if (filteredLogs.length === 0) {
      toast.error('No logs to export')
      return
    }

    const header = ['Time', 'User', 'Username / Role', 'Action', 'Order / Receipt', 'IP Address', 'Details']
    const rows = filteredLogs.map((log) => [
      formatDate(log.timestamp || log.createdAt),
      getActorName(log),
      getActorSubtext(log),
      formatAction(log.action),
      getOperationSummary(log),
      log.ipAddress || log.details?.ipAddress || 'N/A',
      getLogMessage(log),
    ])
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell || '').replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `employee-system-logs-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="relative overflow-hidden rounded-3xl border border-surface-200 bg-white shadow-sm"
      >
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-r from-primary-50 via-surface-50 to-emerald-50" />
        <div className="relative p-5 md:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary-100 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-700 shadow-sm">
                <FiShield className="h-4 w-4" />
                Audit Console
              </div>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-950">Employee System Logs</h1>
              <p className="mt-2 max-w-3xl text-sm text-gray-500">
                Monitor logins, blocked access, order acceptance/status changes, payment collection, and refunds.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => fetchLogs(true)} disabled={refreshing}>
                <FiRefreshCw className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button variant="secondary" onClick={exportCSV}>
                <FiDownload className="mr-2" />
                Export
              </Button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricTile label="Matched logs" value={pagination.total || 0} sub={`${filteredLogs.length} visible on page`} icon={FiShield} accent="from-primary-600 to-secondary-500" />
            <MetricTile label="Operations" value={counts.operations} sub="Orders and payments on page" icon={FiClock} accent="from-indigo-500 to-violet-500" />
            <MetricTile label="Needs attention" value={counts.failed} sub="Failed or blocked events" icon={FiAlertCircle} accent="from-red-500 to-orange-500" />
            <MetricTile label="Sessions" value={counts.login + counts.logout} sub={`${counts.login} login / ${counts.logout} logout`} icon={FiUser} accent="from-blue-500 to-indigo-500" />
          </div>
        </div>
      </motion.section>

      <Card
        title="Filters"
        icon={FiFilter}
        actions={
          <button type="button" onClick={resetFilters} className="text-sm font-semibold text-primary-700 hover:underline">
            Reset
          </button>
        }
      >
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_220px_220px_auto] lg:items-end">
          <Input
            icon={FiSearch}
            label="Search current page"
            placeholder="Employee, role, action, detail, or IP"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Event type</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setActionFilter('')
                setPage(1)
              }}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
            >
              {STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Action</label>
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value)
                setStatusFilter('')
                setPage(1)
              }}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
            >
              {ACTION_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>
          <div className="flex overflow-hidden rounded-xl border border-surface-200 bg-white">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`px-3 py-2 text-sm font-semibold transition ${viewMode === 'cards' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-surface-50'}`}
            >
              Cards
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-3 py-2 text-sm font-semibold transition ${viewMode === 'table' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-surface-50'}`}
            >
              Table
            </button>
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-3xl border border-surface-200 bg-white shadow-sm">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600" />
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="flex min-h-80 flex-col items-center justify-center rounded-3xl border border-surface-200 bg-white px-4 text-center shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-50 text-primary-600">
            <FiShield className="h-7 w-7" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-gray-950">No logs found</h3>
          <p className="mt-1 max-w-md text-sm text-gray-500">Try changing the event type, action, search, or page.</p>
        </div>
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 gap-4">
          {filteredLogs.map((log, index) => <LogCard key={log._id || index} log={log} index={index} />)}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-surface-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-surface-200 text-sm">
            <thead className="bg-surface-50">
              <tr>
                {['Time', 'User', 'Action', 'Role', 'Order / Receipt', 'Details'].map((header) => (
                  <th key={header} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-200 bg-white">
              {filteredLogs.map((log, index) => (
                <tr key={log._id || index} className="transition hover:bg-surface-50">
                  <td className="whitespace-nowrap px-5 py-4 text-gray-600">{formatDate(log.timestamp || log.createdAt)}</td>
                  <td className="px-5 py-4">
                    <p className="font-bold text-gray-950">{getActorName(log)}</p>
                    <p className="text-xs text-gray-500">{getActorSubtext(log)}</p>
                  </td>
                  <td className="px-5 py-4"><ActionPill action={log.action} /></td>
                  <td className="px-5 py-4 capitalize text-gray-600">{log.details?.actorRole || log.details?.role || log.user?.role || 'N/A'}</td>
                  <td className="px-5 py-4 text-gray-600">{getOperationSummary(log)}</td>
                  <td className="max-w-md px-5 py-4 text-gray-600">{getLogMessage(log)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && pagination.pages > 1 && (
        <div className="flex flex-col gap-3 rounded-2xl border border-surface-200 bg-white px-4 py-3 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-gray-500">
            Page <span className="font-semibold text-gray-900">{pagination.page}</span> of{' '}
            <span className="font-semibold text-gray-900">{pagination.pages}</span> -{' '}
            <span className="font-semibold text-gray-900">{pagination.total}</span> total logs
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>
              Previous
            </Button>
            <Button variant="secondary" disabled={page >= pagination.pages} onClick={() => setPage((current) => current + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default SystemLogs
