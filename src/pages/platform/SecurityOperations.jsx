import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  FiAlertTriangle,
  FiActivity,
  FiCheck,
  FiClock,
  FiEye,
  FiLock,
  FiMonitor,
  FiRefreshCw,
  FiShield,
  FiSlash,
  FiUserX,
} from 'react-icons/fi'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import toast from '@utils/toast'
import api from '../../services/api'
import { useAuth } from '../../hooks/useAuth'
import Button from '../../components/common/Button'
import Card from '../../components/common/Card'
import { PlatformEmptyState, PlatformMetric, PlatformPageHeader, PlatformPill } from '../../components/platform/PlatformUI'

const severityStyle = {
  critical: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200',
  low: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
}

const statusStyle = {
  open: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-200',
  investigating: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-200',
  resolved: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200',
  dismissed: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
}

const formatType = (value) => String(value || '').replace(/_/g, ' ')
const formatAction = (value) => String(value || '').replace(/_/g, ' ')

const ALERT_TYPES = [
  'multiple_failed_login_attempts',
  'multiple_failed_payments',
  'suspicious_discount',
  'excessive_void_bills',
  'fake_refund',
  'duplicate_orders',
  'suspicious_payroll_edits',
  'unusual_sales_spike',
]

function extractIpFromAlert(alert) {
  const evidence = alert?.evidence || {}
  return evidence.ipAddress || evidence.ip || evidence.clientIp || null
}

const formatLocation = (location = {}) => {
  const parts = [location.city, location.region, location.country].filter(Boolean)
  if (parts.length) return parts.join(', ')
  if (Number.isFinite(location.latitude) && Number.isFinite(location.longitude)) {
    return `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`
  }
  return 'Unknown location'
}

const sessionAlertLabels = (alerts = {}) => [
  alerts.unknownDevice && 'Unknown device',
  alerts.impossibleTravel && 'Impossible travel',
  alerts.suspiciousConcurrentSessions && 'Many sessions',
].filter(Boolean)

export default function SecurityOperations() {
  const { user } = useAuth()
  const isSuperAdmin = user?.role === 'super_admin'
  const [loading, setLoading] = useState(true)
  const [hours, setHours] = useState(24)
  const [data, setData] = useState(null)
  const [ipBlocks, setIpBlocks] = useState([])
  const [activeLocks, setActiveLocks] = useState([])
  const [blockIp, setBlockIp] = useState('')
  const [blockReason, setBlockReason] = useState('')
  const [actionBusy, setActionBusy] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  const [alertFilter, setAlertFilter] = useState({ status: 'open', severity: '', type: '' })
  const [alerts, setAlerts] = useState([])
  const [alertsLoading, setAlertsLoading] = useState(false)
  const [activeSessions, setActiveSessions] = useState([])
  const [sessionsFilter, setSessionsFilter] = useState({ suspiciousOnly: false })
  const [sessionsLoading, setSessionsLoading] = useState(false)

  const loadOverview = useCallback(async () => {
    const results = await Promise.allSettled([
      api.get('/platform/security/overview', { params: { hours } }),
      api.get('/platform/security/ip-blocks'),
      api.get('/platform/security/locks'),
    ])

    const [overviewRes, blocksRes, locksRes] = results
    if (overviewRes.status === 'fulfilled') {
      setData(overviewRes.value.data?.data || {})
    } else {
      console.error(overviewRes.reason)
      toast.error(overviewRes.reason?.response?.data?.message || 'Failed to load security overview')
    }
    if (blocksRes.status === 'fulfilled') {
      setIpBlocks(blocksRes.value.data?.data || [])
    } else {
      toast.error(blocksRes.reason?.response?.data?.message || 'Failed to load IP blocks')
    }
    if (locksRes.status === 'fulfilled') {
      setActiveLocks(locksRes.value.data?.data || [])
    } else {
      toast.error(locksRes.reason?.response?.data?.message || 'Failed to load account locks')
    }
  }, [hours])

  const loadAlerts = useCallback(async () => {
    try {
      setAlertsLoading(true)
      const params = { limit: 50, page: 1 }
      if (alertFilter.status) params.status = alertFilter.status
      if (alertFilter.severity) params.severity = alertFilter.severity
      if (alertFilter.type) params.type = alertFilter.type
      const res = await api.get('/platform/fraud/alerts', { params })
      setAlerts(res.data?.data?.alerts || [])
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load suspicious activity alerts')
    } finally {
      setAlertsLoading(false)
    }
  }, [alertFilter])

  const loadActiveSessions = useCallback(async () => {
    try {
      setSessionsLoading(true)
      const params = { limit: 100, page: 1 }
      if (sessionsFilter.suspiciousOnly) params.suspiciousOnly = 'true'
      const res = await api.get('/platform/security/active-sessions', { params })
      setActiveSessions(res.data?.data?.sessions || [])
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load active login sessions')
    } finally {
      setSessionsLoading(false)
    }
  }, [sessionsFilter])

  const load = async () => {
    try {
      setLoading(true)
      await loadOverview()
      await Promise.all([loadAlerts(), loadActiveSessions()])
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load security dashboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [hours])

  useEffect(() => {
    if (!loading) loadAlerts()
  }, [alertFilter, loadAlerts, loading])

  useEffect(() => {
    if (!loading) loadActiveSessions()
  }, [sessionsFilter, loadActiveSessions, loading])

  const trend = useMemo(
    () => (data?.failedLoginsByHour || []).map((row) => ({ time: row._id?.slice(11) || row._id, failed: row.count })),
    [data],
  )

  const submitBlockIp = async (ipAddress = blockIp, reason = blockReason) => {
    if (!ipAddress) return toast.error('Enter an IP address')
    try {
      setActionBusy(true)
      await api.post('/platform/security/ip-blocks', { ipAddress, reason: reason || 'Suspicious activity from security dashboard' })
      toast.success('IP blocked')
      setBlockIp('')
      setBlockReason('')
      await loadOverview()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to block IP')
    } finally {
      setActionBusy(false)
    }
  }

  const unblockIp = async (id) => {
    try {
      setActionBusy(true)
      await api.patch(`/platform/security/ip-blocks/${id}/unblock`, {})
      toast.success('IP unblocked')
      await loadOverview()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to unblock IP')
    } finally {
      setActionBusy(false)
    }
  }

  const createLock = async ({ subjectType, subjectId, restaurantId, reason, lockMinutes = 30, blockIpAlso = false }) => {
    try {
      setActionBusy(true)
      await api.post('/platform/security/locks', {
        subjectType,
        subjectId: String(subjectId),
        restaurantId: restaurantId || undefined,
        reason,
        lockMinutes,
        blockIpAlso,
      })
      toast.success('Activity blocked (lock applied)')
      await loadOverview()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to apply security lock')
    } finally {
      setActionBusy(false)
    }
  }

  const releaseLock = async (lock) => {
    const id = lock._id
    const needsSuperAdmin = ['Restaurant', 'Employee'].includes(lock.subjectType)
    if (needsSuperAdmin && !isSuperAdmin) {
      toast.error('Only super admin can unlock restaurant or staff accounts')
      return
    }
    if (needsSuperAdmin && !window.confirm(`Unlock ${lock.subjectType} account for ${lock.restaurantDisplay?.name || lock.subjectId}?`)) {
      return
    }
    try {
      setActionBusy(true)
      await api.patch(`/platform/security/locks/${id}/release`, {})
      toast.success('Account unlocked')
      await loadOverview()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to release lock')
    } finally {
      setActionBusy(false)
    }
  }

  const revokeSession = async (sessionId) => {
    if (!window.confirm('Revoke this login session? The user will be signed out on that device.')) return
    try {
      setActionBusy(true)
      await api.post(`/platform/security/sessions/${sessionId}/revoke`, {})
      toast.success('Login session revoked')
      await Promise.all([loadActiveSessions(), loadOverview()])
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to revoke session')
    } finally {
      setActionBusy(false)
    }
  }

  const updateAlertStatus = async (alertId, status, notes = '') => {
    try {
      setActionBusy(true)
      await api.patch(`/platform/fraud/alerts/${alertId}`, { status, notes })
      toast.success(`Alert marked as ${status}`)
      await Promise.all([loadOverview(), loadAlerts()])
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update alert')
    } finally {
      setActionBusy(false)
    }
  }

  const blockAlertActivity = async (alert) => {
    const restaurantId = alert.restaurantId?._id || alert.restaurantId
    const ip = extractIpFromAlert(alert)

    if (alert.type === 'multiple_failed_login_attempts' && ip) {
      await submitBlockIp(ip, `Blocked after alert: ${alert.title}`)
      if (alert.status === 'open') await updateAlertStatus(alert._id, 'investigating', `IP ${ip} blocked`)
      return
    }

    if (restaurantId) {
      if (!window.confirm('Lock this restaurant for 30 minutes and revoke active sessions?')) return
      await createLock({
        subjectType: 'Restaurant',
        subjectId: restaurantId,
        restaurantId,
        reason: `Blocked from alert: ${alert.title}`,
        lockMinutes: 30,
      })
      try {
        await api.post('/platform/security/force-logout', { restaurantId })
      } catch {
        /* non-fatal */
      }
      if (alert.status === 'open') await updateAlertStatus(alert._id, 'investigating', 'Restaurant locked by admin')
      return
    }

    if (ip) {
      await submitBlockIp(ip, `Blocked after alert: ${alert.title}`)
      return
    }

    toast.error('No blockable target found for this alert')
  }

  const forceLogout = async (restaurantId) => {
    if (!restaurantId) return toast.error('Restaurant ID missing')
    if (!window.confirm('Force logout all active sessions for this restaurant?')) return
    try {
      setActionBusy(true)
      await api.post('/platform/security/force-logout', { restaurantId })
      toast.success('Sessions revoked')
      await loadOverview()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to force logout')
    } finally {
      setActionBusy(false)
    }
  }

  const suspendRestaurant = async (restaurantId) => {
    if (!restaurantId) return toast.error('Restaurant ID missing')
    if (!window.confirm('Suspend this restaurant and revoke active sessions?')) return
    try {
      setActionBusy(true)
      await api.post(`/platform/security/restaurants/${restaurantId}/suspend`, { reason: 'Suspended from security operations dashboard' })
      toast.success('Restaurant suspended')
      await loadOverview()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to suspend restaurant')
    } finally {
      setActionBusy(false)
    }
  }

  const metrics = data?.metrics || {}

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'suspicious', label: 'Suspicious Activities' },
    { id: 'logins', label: 'Active Logins' },
    { id: 'locks', label: 'Active Blocks' },
  ]

  const renderAlertActions = (alert) => {
    const restaurantId = alert.restaurantId?._id || alert.restaurantId
    const isOpen = ['open', 'investigating'].includes(alert.status)

    return (
      <div className="flex flex-wrap gap-1.5">
        {isOpen && (
          <>
            <button
              type="button"
              disabled={actionBusy}
              onClick={() => blockAlertActivity(alert)}
              className="rounded-lg bg-red-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
            >
              Block activity
            </button>
            <button
              type="button"
              disabled={actionBusy}
              onClick={() => updateAlertStatus(alert._id, 'investigating')}
              className="rounded-lg bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-200"
            >
              <FiEye className="mr-1 inline" />
              Investigate
            </button>
          </>
        )}
        {isOpen && (
          <button
            type="button"
            disabled={actionBusy}
            onClick={() => updateAlertStatus(alert._id, 'dismissed', 'Dismissed by admin')}
            className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-700 dark:bg-gray-800 dark:text-gray-300"
          >
            Dismiss
          </button>
        )}
        {alert.status !== 'resolved' && (
          <button
            type="button"
            disabled={actionBusy}
            onClick={() => updateAlertStatus(alert._id, 'resolved', 'Resolved by admin')}
            className="rounded-lg bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
          >
            <FiCheck className="mr-1 inline" />
            Resolve
          </button>
        )}
        {restaurantId && isOpen && (
          <>
            <button
              type="button"
              disabled={actionBusy}
              onClick={() => forceLogout(restaurantId)}
              className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-bold text-gray-700 dark:border-gray-700 dark:text-gray-300"
            >
              Force logout
            </button>
            <button
              type="button"
              disabled={actionBusy}
              onClick={() => suspendRestaurant(restaurantId)}
              className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-bold text-red-700 dark:border-red-900 dark:text-red-300"
            >
              Suspend
            </button>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PlatformPageHeader
        badge="Security Ops"
        title="Security Monitoring"
        description="View suspicious activities across tenants, investigate fraud alerts, and block malicious IPs, sessions, or restaurants."
        icon={FiShield}
        actions={
          <>
            <select
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            >
              <option value={24}>Last 24 hours</option>
              <option value={72}>Last 3 days</option>
              <option value={168}>Last 7 days</option>
              <option value={720}>Last 30 days</option>
            </select>
            <Button type="button" variant="secondary" onClick={load} disabled={loading}>
              <FiRefreshCw className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-800">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`border-b-2 px-4 py-2 text-sm font-bold transition ${
              activeTab === tab.id
                ? 'border-primary-600 text-primary-700 dark:border-primary-400 dark:text-primary-300'
                : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <PlatformMetric label="Failed logins" value={metrics.failedLoginCount || 0} sub="Authentication failures" icon={FiLock} accent="from-red-500 to-rose-600" />
            <PlatformMetric label="Suspicious IPs" value={data?.topSuspiciousIps?.length || 0} sub="Highest risk sources" icon={FiSlash} accent="from-orange-500 to-red-500" />
            <PlatformMetric label="Open alerts" value={data?.recentAlerts?.length || 0} sub="Needs review" icon={FiAlertTriangle} accent="from-amber-500 to-orange-600" />
            <PlatformMetric label="Blocked requests" value={metrics.blockedRequestCount || 0} sub="Rejected or forbidden" icon={FiShield} accent="from-indigo-500 to-blue-600" />
            <PlatformMetric label="Failed payments" value={metrics.failedPaymentCount || 0} sub="Payment anomalies" icon={FiActivity} accent="from-fuchsia-500 to-pink-600" />
            <PlatformMetric label="Active locks" value={activeLocks.length} sub={`${metrics.activeIpBlocks || 0} IP blocks`} icon={FiClock} accent="from-emerald-500 to-teal-600" />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
            <Card title="Failed Login Trend" icon={FiActivity}>
              {trend.length === 0 ? (
                <PlatformEmptyState title="No failed login trend" description="No failed login events in this window." icon={FiLock} />
              ) : (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="failed" stroke="#b33b19" strokeWidth={3} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

            <Card title="Block IP" icon={FiSlash}>
              <div className="space-y-3">
                <input
                  value={blockIp}
                  onChange={(e) => setBlockIp(e.target.value)}
                  placeholder="IP address"
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                />
                <textarea
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="Reason"
                  rows={3}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                />
                <Button type="button" onClick={() => submitBlockIp()} disabled={actionBusy} className="w-full">
                  Block IP
                </Button>
                <div className="max-h-48 space-y-2 overflow-y-auto pt-2">
                  {ipBlocks.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No active IP blocks.</p>
                  ) : ipBlocks.map((block) => (
                    <div key={block._id} className="flex items-center justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm dark:bg-gray-950">
                      <div className="min-w-0">
                        <p className="truncate font-bold text-gray-900 dark:text-gray-100">{block.ipAddress}</p>
                        <p className="truncate text-xs text-gray-500">{block.reason || 'Blocked'}</p>
                      </div>
                      <button type="button" onClick={() => unblockIp(block._id)} className="text-xs font-bold text-primary-700 dark:text-primary-300">
                        Unblock
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card title="Suspicious IP Tracking" icon={FiSlash}>
              {(data?.topSuspiciousIps || []).length === 0 ? (
                <PlatformEmptyState title="No suspicious IPs" icon={FiShield} />
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-surface-200 dark:border-gray-800">
                  <table className="min-w-full text-sm">
                    <thead className="bg-surface-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                      <tr>
                        <th className="px-4 py-3">IP</th>
                        <th className="px-4 py-3">Events</th>
                        <th className="px-4 py-3">Actions seen</th>
                        <th className="px-4 py-3">Last seen</th>
                        <th className="px-4 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {data.topSuspiciousIps.map((row) => (
                        <tr key={row._id}>
                          <td className="px-4 py-3 font-bold text-gray-900 dark:text-gray-100">{row._id}</td>
                          <td className="px-4 py-3">{row.count}</td>
                          <td className="px-4 py-3 text-xs text-gray-500">{(row.actions || []).map(formatAction).join(', ')}</td>
                          <td className="px-4 py-3 text-gray-500">{new Date(row.lastSeen).toLocaleString()}</td>
                          <td className="px-4 py-3 text-right space-x-2">
                            <button
                              type="button"
                              onClick={() => createLock({ subjectType: 'ip', subjectId: row._id, reason: 'Suspicious IP lock', lockMinutes: 60, blockIpAlso: true })}
                              disabled={actionBusy}
                              className="text-xs font-bold text-amber-700"
                            >
                              Lock
                            </button>
                            <button
                              type="button"
                              onClick={() => submitBlockIp(row._id, 'Blocked from suspicious IP tracking')}
                              className="text-xs font-bold text-red-600"
                            >
                              Block IP
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            <Card title="Alert Types (window)" icon={FiAlertTriangle}>
              {(data?.alertsByType || []).length === 0 ? (
                <PlatformEmptyState title="No alert breakdown" icon={FiShield} />
              ) : (
                <div className="space-y-2">
                  {data.alertsByType.map((row) => (
                    <div key={row._id} className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3 dark:bg-gray-950">
                      <p className="text-sm font-bold capitalize text-gray-800 dark:text-gray-100">{formatType(row._id)}</p>
                      <div className="text-right">
                        <p className="font-black text-gray-900 dark:text-gray-100">{row.count}</p>
                        {row.critical > 0 && <p className="text-xs text-red-600">{row.critical} critical</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card title="Payment Anomaly Tracking" icon={FiActivity}>
              {(data?.failedPaymentsByRestaurant || []).length === 0 ? (
                <PlatformEmptyState title="No payment anomalies" icon={FiActivity} />
              ) : (
                <div className="space-y-2">
                  {data.failedPaymentsByRestaurant.map((row) => (
                    <div key={row._id} className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3 dark:bg-gray-950">
                      <div>
                        <p className="font-bold text-gray-900 dark:text-gray-100">{row.restaurantName || 'Unknown restaurant'}</p>
                        <p className="text-xs text-gray-500">{row.restaurantEmail || row._id}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-red-600">{row.count}</p>
                        <p className="text-xs text-gray-500">failed</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card title="Blocked Request Analytics" icon={FiShield}>
              {(data?.blockedByPath || []).length === 0 ? (
                <PlatformEmptyState title="No blocked requests" icon={FiShield} />
              ) : (
                <div className="space-y-2">
                  {data.blockedByPath.map((row) => (
                    <div key={row._id} className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 px-4 py-3 dark:bg-gray-950">
                      <p className="truncate text-sm font-bold text-gray-800 dark:text-gray-100">{row._id}</p>
                      <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-black text-primary-700 dark:bg-gray-800 dark:text-primary-300">{row.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </>
      )}

      {activeTab === 'suspicious' && (
        <>
          <Card title="Fraud & Suspicious Activity Alerts" icon={FiAlertTriangle}>
            <div className="mb-4 flex flex-wrap gap-2">
              <select
                value={alertFilter.status}
                onChange={(e) => setAlertFilter((f) => ({ ...f, status: e.target.value }))}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              >
                <option value="open">Open</option>
                <option value="investigating">Investigating</option>
                <option value="resolved">Resolved</option>
                <option value="dismissed">Dismissed</option>
                <option value="all">All statuses</option>
              </select>
              <select
                value={alertFilter.severity}
                onChange={(e) => setAlertFilter((f) => ({ ...f, severity: e.target.value }))}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              >
                <option value="">All severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <select
                value={alertFilter.type}
                onChange={(e) => setAlertFilter((f) => ({ ...f, type: e.target.value }))}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              >
                <option value="">All types</option>
                {ALERT_TYPES.map((t) => (
                  <option key={t} value={t}>{formatType(t)}</option>
                ))}
              </select>
            </div>

            {alertsLoading ? (
              <p className="text-sm text-gray-500">Loading alerts...</p>
            ) : alerts.length === 0 ? (
              <PlatformEmptyState title="No suspicious activities" description="No fraud alerts match your filters." icon={FiShield} />
            ) : (
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div key={alert._id} className="rounded-2xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-bold text-gray-950 dark:text-gray-100">{alert.title}</p>
                          <PlatformPill className={severityStyle[alert.severity] || severityStyle.medium}>{alert.severity}</PlatformPill>
                          <PlatformPill className={statusStyle[alert.status] || statusStyle.open}>{alert.status}</PlatformPill>
                        </div>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{alert.message}</p>
                        <p className="mt-2 text-xs text-gray-400">
                          {alert.restaurantId?.name || 'Platform-wide'} · {formatType(alert.type)} · {new Date(alert.createdAt).toLocaleString()}
                        </p>
                        {extractIpFromAlert(alert) && (
                          <p className="mt-1 text-xs font-mono text-gray-500">IP: {extractIpFromAlert(alert)}</p>
                        )}
                      </div>
                    </div>
                    <div className="mt-3">{renderAlertActions(alert)}</div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card title="Recent Security Events (audit)" icon={FiActivity}>
            {(data?.recentAudit || []).length === 0 ? (
              <PlatformEmptyState title="No recent security events" icon={FiActivity} />
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-surface-200 dark:border-gray-800">
                <table className="min-w-full text-sm">
                  <thead className="bg-surface-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                    <tr>
                      <th className="px-4 py-3">Time</th>
                      <th className="px-4 py-3">Action</th>
                      <th className="px-4 py-3">IP</th>
                      <th className="px-4 py-3">Details</th>
                      <th className="px-4 py-3 text-right">Block</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {data.recentAudit.map((log) => (
                      <tr key={log._id}>
                        <td className="px-4 py-3 text-gray-500">{new Date(log.timestamp).toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium dark:bg-gray-800">{formatAction(log.action)}</span>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">{log.ipAddress || '-'}</td>
                        <td className="max-w-xs truncate px-4 py-3 text-gray-500">
                          {log.details?.path || log.details?.message || log.details?.reason || '-'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {log.ipAddress ? (
                            <button
                              type="button"
                              disabled={actionBusy}
                              onClick={() => submitBlockIp(log.ipAddress, `Blocked from audit: ${log.action}`)}
                              className="text-xs font-bold text-red-600"
                            >
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

          <Card title="High-Priority Active Attacks" icon={FiAlertTriangle}>
            {(data?.activeAttacks || []).length === 0 ? (
              <PlatformEmptyState title="No active attacks" description="No high severity open alerts in this time window." icon={FiShield} />
            ) : (
              <div className="space-y-3">
                {data.activeAttacks.map((alert) => (
                  <div key={alert._id} className="rounded-2xl border border-red-100 bg-red-50/50 p-4 dark:border-red-900 dark:bg-red-950/20">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold text-gray-950 dark:text-gray-100">{alert.title}</p>
                      <PlatformPill className={severityStyle[alert.severity] || severityStyle.medium}>{alert.severity}</PlatformPill>
                    </div>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{alert.message}</p>
                    <div className="mt-3">{renderAlertActions(alert)}</div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}

      {activeTab === 'logins' && (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <PlatformMetric
              label="Active logins"
              value={activeSessions.length}
              sub="Restaurant vendor sessions"
              icon={FiMonitor}
              accent="from-blue-500 to-indigo-600"
            />
            <PlatformMetric
              label="Flagged sessions"
              value={activeSessions.filter((s) => s.hasAlerts).length}
              sub="Unknown device or travel alerts"
              icon={FiAlertTriangle}
              accent="from-amber-500 to-orange-600"
            />
            <PlatformMetric
              label="Unique restaurants"
              value={new Set(activeSessions.map((s) => String(s.restaurantId))).size}
              sub="Currently signed in"
              icon={FiShield}
              accent="from-emerald-500 to-teal-600"
            />
          </div>

          <Card title="Restaurant Active Logins" icon={FiMonitor}>
            <div className="mb-4 flex flex-wrap gap-2">
              <label className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700">
                <input
                  type="checkbox"
                  checked={sessionsFilter.suspiciousOnly}
                  onChange={(e) => setSessionsFilter({ suspiciousOnly: e.target.checked })}
                />
                Show suspicious sessions only
              </label>
              <Button type="button" variant="secondary" size="sm" onClick={loadActiveSessions} disabled={sessionsLoading}>
                <FiRefreshCw className={`mr-2 ${sessionsLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            {sessionsLoading ? (
              <p className="text-sm text-gray-500">Loading active sessions...</p>
            ) : activeSessions.length === 0 ? (
              <PlatformEmptyState
                title="No active logins"
                description={sessionsFilter.suspiciousOnly ? 'No suspicious sessions right now.' : 'No restaurant vendor sessions are currently active.'}
                icon={FiMonitor}
              />
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-surface-200 dark:border-gray-800">
                <table className="min-w-full text-sm">
                  <thead className="bg-surface-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                    <tr>
                      <th className="px-4 py-3">Restaurant</th>
                      <th className="px-4 py-3">Device</th>
                      <th className="px-4 py-3">IP / Location</th>
                      <th className="px-4 py-3">Last active</th>
                      <th className="px-4 py-3">Alerts</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {activeSessions.map((session) => {
                      const labels = sessionAlertLabels(session.alerts)
                      return (
                        <tr key={session.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <td className="px-4 py-3">
                            <p className="font-bold text-gray-900 dark:text-gray-100">{session.restaurantName}</p>
                            <p className="text-xs text-gray-500">{session.restaurantEmail}</p>
                            {!session.restaurantActive && (
                              <span className="mt-1 inline-block rounded-full bg-red-50 px-2 py-0.5 text-xs font-bold text-red-700 dark:bg-red-950 dark:text-red-200">
                                Suspended
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-800 dark:text-gray-200">
                              {session.browser} on {session.operatingSystem}
                            </p>
                            <p className="text-xs text-gray-500">
                              {session.deviceType || 'Device'}
                              {session.timezone ? ` · ${session.timezone}` : ''}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-mono text-xs text-gray-700 dark:text-gray-300">{session.ipAddress || '-'}</p>
                            <p className="text-xs text-gray-500">{formatLocation(session.loginLocation)}</p>
                          </td>
                          <td className="px-4 py-3 text-gray-500">
                            <p>{new Date(session.lastActiveAt).toLocaleString()}</p>
                            <p className="text-xs">Since {new Date(session.createdAt).toLocaleString()}</p>
                          </td>
                          <td className="px-4 py-3">
                            {labels.length === 0 ? (
                              <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200">
                                Trusted
                              </span>
                            ) : (
                              <div className="flex flex-wrap gap-1">
                                {labels.map((label) => (
                                  <span
                                    key={label}
                                    className="rounded-full bg-amber-50 px-2 py-1 text-xs font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-200"
                                  >
                                    {label}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex flex-wrap justify-end gap-2">
                              <button
                                type="button"
                                disabled={actionBusy}
                                onClick={() => revokeSession(session.id)}
                                className="text-xs font-bold text-red-600"
                              >
                                Revoke
                              </button>
                              {session.ipAddress && (
                                <button
                                  type="button"
                                  disabled={actionBusy}
                                  onClick={() => submitBlockIp(session.ipAddress, `Blocked from active login (${session.restaurantEmail})`)}
                                  className="text-xs font-bold text-orange-700"
                                >
                                  Block IP
                                </button>
                              )}
                              <button
                                type="button"
                                disabled={actionBusy}
                                onClick={() => forceLogout(session.restaurantId)}
                                className="text-xs font-bold text-gray-600 dark:text-gray-300"
                              >
                                Logout all
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}

      {activeTab === 'locks' && (
        <>
          {!isSuperAdmin && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/90 p-4 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
              Restaurant and staff unlocks require <strong>super admin</strong>. You can still view locks and manage IP blocks.
            </div>
          )}
          <Card title="Locked restaurants & accounts" icon={FiLock}>
            {activeLocks.length === 0 ? (
              <PlatformEmptyState title="No active locks" description="Accounts locked after repeated failed logins or manual security actions appear here." icon={FiLock} />
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-surface-200 dark:border-gray-800">
                <table className="min-w-full text-sm">
                  <thead className="bg-surface-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                    <tr>
                      <th className="px-4 py-3">Subject</th>
                      <th className="px-4 py-3">Restaurant</th>
                      <th className="px-4 py-3">Reason</th>
                      <th className="px-4 py-3">Until</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {activeLocks.map((lock) => (
                      <tr key={lock._id}>
                        <td className="px-4 py-3">
                          <p className="font-bold text-gray-900 dark:text-gray-100">{lock.subjectType}</p>
                          <p className="font-mono text-xs text-gray-500">{lock.subjectId}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {lock.restaurantDisplay?.name || lock.restaurantId?.name || '-'}
                          {lock.restaurantDisplay?.email && (
                            <p className="text-xs text-gray-500">{lock.restaurantDisplay.email}</p>
                          )}
                        </td>
                        <td className="max-w-xs truncate px-4 py-3 text-gray-500">{lock.reason}</td>
                        <td className="px-4 py-3 text-gray-500">{new Date(lock.lockedUntil).toLocaleString()}</td>
                        <td className="px-4 py-3 text-right">
                          {['Restaurant', 'Employee'].includes(lock.subjectType) && !isSuperAdmin ? (
                            <span className="text-xs text-gray-400">Super admin only</span>
                          ) : (
                            <button
                              type="button"
                              disabled={actionBusy}
                              onClick={() => releaseLock(lock)}
                              className="text-xs font-bold text-primary-700 dark:text-primary-300"
                            >
                              {lock.subjectType === 'Restaurant' ? 'Unlock restaurant' : 'Release'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card title="Blocked IP Addresses" icon={FiSlash}>
            {ipBlocks.length === 0 ? (
              <PlatformEmptyState title="No IP blocks" icon={FiSlash} />
            ) : (
              <div className="space-y-2">
                {ipBlocks.map((block) => (
                  <div key={block._id} className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3 dark:bg-gray-950">
                    <div>
                      <p className="font-bold text-gray-900 dark:text-gray-100">{block.ipAddress}</p>
                      <p className="text-xs text-gray-500">{block.reason}</p>
                    </div>
                    <button type="button" onClick={() => unblockIp(block._id)} disabled={actionBusy} className="text-xs font-bold text-primary-700">
                      Unblock
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  )
}
