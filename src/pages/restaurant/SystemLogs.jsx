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
      const res = await api.get('/restaurant/logs/employee-activities', {
        params: { page: 1, limit: 100, status: statusFilter || undefined }
      })
      setLogs(res.data?.data?.logs || [])
    } catch (error) {
      toast.error('Failed to fetch employee logs')
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
          <h1 className="text-2xl font-bold text-gray-900">Employee System Logs</h1>
          <p className="text-gray-500 mt-1">Track employee login/logout and blocked actions</p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">All Events</option>
          <option value="success">Successful events</option>
          <option value="failed">Failed / blocked events</option>
        </select>
      </div>

      <Card>
        {loading ? (
          <p className="text-sm text-gray-500">Loading logs...</p>
        ) : logs.length === 0 ? (
          <p className="text-sm text-gray-500">No employee logs found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left text-gray-500">
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Details</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {logs.map((log) => (
                  <tr key={log._id}>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {new Date(log.timestamp || log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">
                        {log.user?.name || log.user?.username || 'Unknown'}
                      </div>
                      <div className="text-xs text-gray-500">{log.user?.username || '-'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {log.details?.role || log.user?.role || '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-md break-words">
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
