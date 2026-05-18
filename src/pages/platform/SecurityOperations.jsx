import React, { useEffect, useMemo, useState } from 'react'
import {
  FiAlertTriangle,
  FiActivity,
  FiClock,
  FiLock,
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
import Button from '../../components/common/Button'
import Card from '../../components/common/Card'
import { PlatformEmptyState, PlatformMetric, PlatformPageHeader, PlatformPill } from '../../components/platform/PlatformUI'

const severityStyle = {
  critical: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200',
  low: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
}

const formatType = (value) => String(value || '').replace(/_/g, ' ')

export default function SecurityOperations() {
  const [loading, setLoading] = useState(true)
  const [hours, setHours] = useState(24)
  const [data, setData] = useState(null)
  const [ipBlocks, setIpBlocks] = useState([])
  const [blockIp, setBlockIp] = useState('')
  const [blockReason, setBlockReason] = useState('')
  const [actionBusy, setActionBusy] = useState(false)

  const load = async () => {
    try {
      setLoading(true)
      const [overviewRes, blocksRes] = await Promise.all([
        api.get('/platform/security/overview', { params: { hours } }),
        api.get('/platform/security/ip-blocks'),
      ])
      setData(overviewRes.data?.data || {})
      setIpBlocks(blocksRes.data?.data || [])
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load security dashboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [hours])

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
      await load()
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
      await load()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to unblock IP')
    } finally {
      setActionBusy(false)
    }
  }

  const forceLogout = async (restaurantId) => {
    if (!restaurantId) return toast.error('Restaurant ID missing')
    if (!window.confirm('Force logout all active sessions for this restaurant?')) return
    try {
      setActionBusy(true)
      await api.post('/platform/security/force-logout', { restaurantId })
      toast.success('Sessions revoked')
      await load()
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
      await load()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to suspend restaurant')
    } finally {
      setActionBusy(false)
    }
  }

  const metrics = data?.metrics || {}

  return (
    <div className="space-y-6">
      <PlatformPageHeader
        badge="Security Ops"
        title="Security Monitoring"
        description="Monitor active attacks, failed login bursts, blocked requests, payment anomalies, suspicious IPs, and audit activity across tenants."
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

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <PlatformMetric label="Failed logins" value={metrics.failedLoginCount || 0} sub="Authentication failures" icon={FiLock} accent="from-red-500 to-rose-600" />
        <PlatformMetric label="Suspicious IPs" value={data?.topSuspiciousIps?.length || 0} sub="Highest risk sources" icon={FiSlash} accent="from-orange-500 to-red-500" />
        <PlatformMetric label="Active attacks" value={metrics.openCriticalAlerts || 0} sub="High / critical alerts" icon={FiAlertTriangle} accent="from-amber-500 to-orange-600" />
        <PlatformMetric label="Blocked requests" value={metrics.blockedRequestCount || 0} sub="Rejected or forbidden" icon={FiShield} accent="from-indigo-500 to-blue-600" />
        <PlatformMetric label="Failed payments" value={metrics.failedPaymentCount || 0} sub="Payment anomalies" icon={FiActivity} accent="from-fuchsia-500 to-pink-600" />
        <PlatformMetric label="Active sessions" value={metrics.activeSessionCount || 0} sub={`${metrics.activeIpBlocks || 0} IP blocks`} icon={FiClock} accent="from-emerald-500 to-teal-600" />
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
                    <th className="px-4 py-3">Last seen</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {data.topSuspiciousIps.map((row) => (
                    <tr key={row._id}>
                      <td className="px-4 py-3 font-bold text-gray-900 dark:text-gray-100">{row._id}</td>
                      <td className="px-4 py-3">{row.count}</td>
                      <td className="px-4 py-3 text-gray-500">{new Date(row.lastSeen).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">
                        <button type="button" onClick={() => submitBlockIp(row._id, 'Blocked from suspicious IP tracking')} className="text-xs font-bold text-red-600">
                          Block
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card title="Active Attacks" icon={FiAlertTriangle}>
          {(data?.activeAttacks || []).length === 0 ? (
            <PlatformEmptyState title="No active attacks" description="No high severity open alerts in this time window." icon={FiShield} />
          ) : (
            <div className="space-y-3">
              {data.activeAttacks.map((alert) => {
                const restaurantId = alert.restaurantId?._id || alert.restaurantId
                return (
                  <div key={alert._id} className="rounded-2xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-bold text-gray-950 dark:text-gray-100">{alert.title}</p>
                          <PlatformPill className={severityStyle[alert.severity] || severityStyle.medium}>{alert.severity}</PlatformPill>
                        </div>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{alert.message}</p>
                        <p className="mt-2 text-xs text-gray-400">
                          {alert.restaurantId?.name || 'Unknown restaurant'} - {formatType(alert.type)}
                        </p>
                      </div>
                    </div>
                    {restaurantId && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button type="button" size="sm" variant="outline" onClick={() => forceLogout(restaurantId)} disabled={actionBusy}>
                          <FiUserX className="mr-1" /> Force logout
                        </Button>
                        <Button type="button" size="sm" variant="danger" onClick={() => suspendRestaurant(restaurantId)} disabled={actionBusy}>
                          Suspend
                        </Button>
                      </div>
                    )}
                  </div>
                )
              })}
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
    </div>
  )
}
