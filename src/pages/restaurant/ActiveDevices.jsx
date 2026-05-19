import React, { useEffect, useState } from 'react'
import toast from '@utils/toast'
import {
  getRestaurantLoginHistory,
  getRestaurantSessions,
  revokeOtherRestaurantSessions,
  revokeRestaurantSession,
} from '../../services/api'
import DevicesPageHeader from '../../components/restaurant/devices/DevicesPageHeader'
import DevicesSummarySection from '../../components/restaurant/devices/DevicesSummarySection'
import ActiveSessionsSection from '../../components/restaurant/devices/ActiveSessionsSection'
import LoginHistorySection from '../../components/restaurant/devices/LoginHistorySection'

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
      toast.success(
        `${response.data?.data?.revokedCount || 0} other device sessions logged out`,
      )
      await loadSessions()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to revoke other sessions')
    } finally {
      setRevoking('')
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <DevicesPageHeader
        onRefresh={loadSessions}
        onRevokeOthers={revokeOthers}
        loading={loading}
        revokingOthers={revoking === 'others'}
      />
      <DevicesSummarySection sessions={sessions} history={history} loading={loading} />
      <ActiveSessionsSection
        sessions={sessions}
        loading={loading}
        revoking={revoking}
        onRevoke={revokeOne}
      />
      <LoginHistorySection history={history} loading={loading} />
    </div>
  )
}

export default ActiveDevices
