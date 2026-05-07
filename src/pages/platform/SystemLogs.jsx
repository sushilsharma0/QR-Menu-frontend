import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import Card from '../../components/common/Card'

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
      <div className="flex justify-between items-center gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">System Logs</h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">Track restaurant and employee authentication / validation events</p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        >
          <option value="">All Events</option>
          <option value="success">Successful events</option>
          <option value="failed">Failed / blocked events</option>
        </select>
      </div>

      <Card>
        {loading ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading logs...</p>
        ) : logs.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No logs found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-800">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr className="text-left text-gray-500 dark:text-gray-400">
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
