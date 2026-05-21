import React, { useEffect, useMemo, useState } from 'react'
import { FiActivity, FiAlertCircle, FiCheckCircle, FiRefreshCw, FiSlash } from 'react-icons/fi'
import toast from '@utils/toast'
import api from '../../services/api'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import { PlatformEmptyState, PlatformMetric, PlatformPageHeader } from '../../components/platform/PlatformUI'

const isFailedLog = (log) => /failed|rejected|forbidden/i.test(String(log?.action || ''))
const formatAction = (action) => String(action || 'Unknown').replace(/_/g, ' ')
const getActorName = (log) => log.user?.name || log.details?.actorName || log.user?.username || log.details?.username || 'Unknown user'
const getActorMeta = (log) => [log.user?.email || log.user?.username || log.details?.username, log.details?.actorRole || log.user?.role || log.userModel].filter(Boolean).join(' - ') || 'System activity'
const getDetails = (log) => log.details?.message || log.details?.reason || log.details?.error || log.details?.path || log.resource || '-'

function ClientDateTime({ value }) {
  const [label, setLabel] = useState('')

  useEffect(() => {
    if (!value) return
    setLabel(new Date(value).toLocaleString())
  }, [value])

  return <span suppressHydrationWarning>{label}</span>
}

function OutcomePill({ log }) {
  const failed = isFailedLog(log)
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
      failed
        ? 'bg-red-50 text-red-700 ring-1 ring-red-100 dark:bg-red-950/30 dark:text-red-300 dark:ring-red-900'
        : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-300 dark:ring-emerald-900'
    }`}>
      {failed ? <FiAlertCircle className="h-3.5 w-3.5" /> : <FiCheckCircle className="h-3.5 w-3.5" />}
      {failed ? 'Failed' : 'Success'}
    </span>
  )
}

const SystemLogs = () => {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [blockingIp, setBlockingIp] = useState(null)

  const fetchLogs = async () => {
    try {
      setLoading(true)
      const res = await api.get('/platform/logs/restaurant-activities', {
        params: { page: 1, limit: 100, status: statusFilter || undefined }
      })
      setLogs(res.data?.data?.logs || [])
    } catch (error) {
      toast.error('Failed to fetch system logs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [statusFilter])

  const counts = useMemo(() => logs.reduce(
    (acc, log) => {
      if (isFailedLog(log)) acc.failed += 1
      else acc.success += 1
      return acc
    },
    { success: 0, failed: 0 },
  ), [logs])

  const blockIp = async (ipAddress, action) => {
    if (!ipAddress) return
    if (!window.confirm(`Block IP ${ipAddress}?`)) return
    try {
      setBlockingIp(ipAddress)
      await api.post('/platform/security/ip-blocks', {
        ipAddress,
        reason: `Blocked from system logs (${action || 'suspicious activity'})`,
      })
      toast.success('IP blocked')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to block IP')
    } finally {
      setBlockingIp(null)
    }
  }

  return (
    <div className="space-y-6">
      <PlatformPageHeader
        badge="Audit Trail"
        title="System Logs"
        description="Track restaurant and employee authentication, validation, and blocked access events."
        icon={FiActivity}
        actions={
          <>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            >
              <option value="">All Events</option>
              <option value="success">Successful events</option>
              <option value="failed">Failed / blocked events</option>
            </select>
            <Button type="button" variant="secondary" onClick={fetchLogs} disabled={loading}>
              <FiRefreshCw className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <PlatformMetric label="Loaded events" value={logs.length} sub="Most recent records" icon={FiActivity} accent="from-blue-500 to-indigo-500" />
        <PlatformMetric label="Successful" value={counts.success} sub="Completed activity" icon={FiCheckCircle} accent="from-emerald-500 to-teal-500" />
        <PlatformMetric label="Blocked / failed" value={counts.failed} sub="Needs attention" icon={FiAlertCircle} accent="from-rose-500 to-red-500" />
      </div>

      <Card title="Activity Timeline">
        {loading ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading logs…</p>
        ) : logs.length === 0 ? (
          <PlatformEmptyState title="No logs found" description="Try changing the event filter or refreshing later." icon={FiActivity} />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-surface-200 dark:border-gray-800">
            <table className="min-w-full divide-y divide-surface-200 text-sm dark:divide-gray-800">
              <thead className="bg-surface-50 dark:bg-gray-800/70">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Actor</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">IP</th>
                  <th className="px-4 py-3">Restaurant</th>
                  <th className="px-4 py-3">Details</th>
                  <th className="px-4 py-3 text-right">Security</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white dark:divide-gray-800 dark:bg-gray-900">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/70">
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600 dark:text-gray-300">
                      <ClientDateTime value={log.timestamp || log.createdAt} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {getActorName(log)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{getActorMeta(log)}</div>
                    </td>
                    <td className="px-4 py-3"><OutcomePill log={log} /></td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                        {formatAction(log.action)}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600 dark:text-gray-300">
                      {log.ipAddress || '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {log.details?.restaurantId || '-'}
                    </td>
                    <td className="max-w-md break-words px-4 py-3 text-gray-600 dark:text-gray-300">
                      {getDetails(log)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {log.ipAddress && isFailedLog(log) ? (
                        <button
                          type="button"
                          disabled={blockingIp === log.ipAddress}
                          onClick={() => blockIp(log.ipAddress, log.action)}
                          className="inline-flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-700 disabled:opacity-50"
                        >
                          <FiSlash className="h-3.5 w-3.5" />
                          Block IP
                        </button>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

export default SystemLogs
