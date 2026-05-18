import React, { useEffect, useState } from 'react'
import toast from '@utils/toast'
import { FiAlertTriangle, FiClock, FiMapPin, FiMonitor, FiRefreshCw, FiShield, FiSlash } from 'react-icons/fi'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import {
  getRestaurantLoginHistory,
  getRestaurantSessions,
  revokeOtherRestaurantSessions,
  revokeRestaurantSession,
} from '../../services/api'

const formatDate = (value) => {
  if (!value) return 'Unknown'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Unknown' : date.toLocaleString()
}

const formatLocation = (location = {}) => {
  const parts = [location.city, location.region, location.country].filter(Boolean)
  if (parts.length) return parts.join(', ')
  if (Number.isFinite(location.latitude) && Number.isFinite(location.longitude)) {
    return `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`
  }
  return 'Location not shared'
}

function AlertBadges({ alerts = {} }) {
  const activeAlerts = [
    alerts.unknownDevice && 'Unknown device',
    alerts.impossibleTravel && 'Impossible travel',
    alerts.suspiciousConcurrentSessions && 'Many sessions',
  ].filter(Boolean)

  if (!activeAlerts.length) {
    return <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-bold text-green-700 dark:bg-green-900/25 dark:text-green-300">Trusted</span>
  }

  return (
    <div className="flex flex-wrap gap-2">
      {activeAlerts.map((label) => (
        <span key={label} className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800 dark:bg-amber-900/25 dark:text-amber-200">
          <FiAlertTriangle className="h-3 w-3" />
          {label}
        </span>
      ))}
    </div>
  )
}

function SessionRow({ session, onRevoke, revoking }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary-700 dark:bg-gray-800 dark:text-primary-300">
              <FiMonitor className="h-5 w-5" />
            </span>
            <div>
              <p className="font-black text-gray-950 dark:text-gray-100">
                {session.browser} on {session.operatingSystem}
                {session.isCurrent && <span className="ml-2 text-xs font-bold text-primary-700 dark:text-primary-300">Current</span>}
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Device ID: {session.deviceId}</p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {session.deviceType || 'Device'} {session.screenResolution ? `- ${session.screenResolution}` : ''} {session.timezone ? `- ${session.timezone}` : ''}
              </p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 text-sm text-gray-600 dark:text-gray-300 md:grid-cols-3">
            <span className="inline-flex items-center gap-2"><FiMapPin className="h-4 w-4" />{formatLocation(session.loginLocation)}</span>
            <span className="inline-flex items-center gap-2"><FiShield className="h-4 w-4" />{session.ipAddress || 'Unknown IP'}</span>
            <span className="inline-flex items-center gap-2"><FiClock className="h-4 w-4" />{formatDate(session.lastActiveAt)}</span>
          </div>
          <div className="mt-3">
            <AlertBadges alerts={session.alerts} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {!session.isCurrent && (
            <Button type="button" variant="outline" size="sm" onClick={() => onRevoke(session.id)} loading={revoking === session.id}>
              <FiSlash className="mr-2 h-4 w-4" />
              Revoke
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

const ActiveDevices = () => {
  const [sessions, setSessions] = useState([])
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [revoking, setRevoking] = useState('')

  const loadSessions = async () => {
    try {
      setLoading(true)
      const [activeRes, historyRes] = await Promise.all([
        getRestaurantSessions(),
        getRestaurantLoginHistory(),
      ])
      setSessions(activeRes.data?.data || [])
      setHistory(historyRes.data?.data || [])
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load devices')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSessions()
  }, [])

  const revokeOne = async (sessionId) => {
    try {
      setRevoking(sessionId)
      await revokeRestaurantSession(sessionId)
      toast.success('Session revoked')
      await loadSessions()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to revoke session')
    } finally {
      setRevoking('')
    }
  }

  const revokeOthers = async () => {
    try {
      setRevoking('others')
      const response = await revokeOtherRestaurantSessions()
      toast.success(`${response.data?.data?.revokedCount || 0} other device sessions logged out`)
      await loadSessions()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to revoke other sessions')
    } finally {
      setRevoking('')
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Active Devices</h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">Review browser sessions, revoke access, and inspect recent login alerts.</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={loadSessions} disabled={loading}>
            <FiRefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button type="button" variant="danger" onClick={revokeOthers} loading={revoking === 'others'}>
            Force Logout Others
          </Button>
        </div>
      </div>

      <Card title="Active sessions">
        {loading ? (
          <div className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">Loading devices...</div>
        ) : sessions.length ? (
          <div className="space-y-3">
            {sessions.map((session) => (
              <SessionRow
                key={session.id}
                session={session}
                onRevoke={revokeOne}
                revoking={revoking}
              />
            ))}
          </div>
        ) : (
          <div className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">No active sessions found.</div>
        )}
      </Card>

      <Card title="Login history">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 text-sm dark:divide-gray-800">
            <thead>
              <tr className="text-left text-xs font-black uppercase tracking-wider text-gray-400">
                <th className="px-3 py-3">Device</th>
                <th className="px-3 py-3">IP</th>
                <th className="px-3 py-3">Location</th>
                <th className="px-3 py-3">Login</th>
                <th className="px-3 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {history.slice(0, 20).map((item) => (
                <tr key={item.id} className="text-gray-700 dark:text-gray-200">
                  <td className="px-3 py-3">
                    {item.browser} on {item.operatingSystem}
                    <div className="text-xs text-gray-400">{item.deviceType || 'Device'} {item.timezone ? `- ${item.timezone}` : ''}</div>
                  </td>
                  <td className="px-3 py-3">{item.ipAddress || 'Unknown'}</td>
                  <td className="px-3 py-3">{formatLocation(item.loginLocation)}</td>
                  <td className="px-3 py-3">{formatDate(item.createdAt)}</td>
                  <td className="px-3 py-3">
                    {item.revokedAt ? `Revoked: ${item.revokedReason || 'ended'}` : 'Active'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

export default ActiveDevices
