import React, { useEffect, useState } from 'react'
import { FiActivity, FiAlertCircle, FiCheckCircle, FiRefreshCw } from 'react-icons/fi'
import toast from 'react-hot-toast'
import api from '../../services/api'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import { PlatformEmptyState, PlatformMetric, PlatformPageHeader } from '../../components/platform/PlatformUI'

const SystemLogs = () => {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')

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
        <PlatformMetric label="Successful" value={logs.filter((log) => log.status === 'success' || log.details?.status === 'success').length} sub="Successful activity" icon={FiCheckCircle} accent="from-emerald-500 to-teal-500" />
        <PlatformMetric label="Blocked / failed" value={logs.filter((log) => log.status === 'failed' || log.details?.status === 'failed').length} sub="Needs attention" icon={FiAlertCircle} accent="from-rose-500 to-red-500" />
      </div>

      <Card title="Activity Timeline">
        {loading ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading logs...</p>
        ) : logs.length === 0 ? (
          <PlatformEmptyState title="No logs found" description="Try changing the event filter or refreshing later." icon={FiActivity} />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-surface-200 dark:border-gray-800">
            <table className="min-w-full divide-y divide-surface-200 text-sm dark:divide-gray-800">
              <thead className="bg-surface-50 dark:bg-gray-800/70">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Actor</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Restaurant</th>
                  <th className="px-4 py-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white dark:divide-gray-800 dark:bg-gray-900">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/70">
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600 dark:text-gray-300">
                      {new Date(log.timestamp || log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {log.user?.name || log.user?.username || 'Unknown'}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{log.userModel}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {log.details?.restaurantId || '-'}
                    </td>
                    <td className="max-w-md break-words px-4 py-3 text-gray-600 dark:text-gray-300">
                      {log.details?.message || log.details?.reason || '-'}
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
