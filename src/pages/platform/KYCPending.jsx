import React, { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { FiCheckCircle, FiClock, FiFileText, FiRefreshCw, FiShield, FiXCircle } from 'react-icons/fi'
import api from '../../services/api'
import Card from '../../components/common/Card'
import KYCTable from '../../components/platform/KYCTable'
import Button from '../../components/common/Button'
import { PlatformMetric, PlatformPageHeader } from '../../components/platform/PlatformUI'

const KYCPending = () => {
  const [applications, setApplications] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchApplications()
  }, [])

  const fetchApplications = async (quiet = false) => {
    try {
      if (quiet) setRefreshing(true)
      else setLoading(true)
      const [appsRes, statsRes] = await Promise.all([
        api.get('/platform/kyc', { params: { status: 'pending' } }),
        api.get('/platform/kyc/stats').catch(() => null),
      ])
      setApplications(appsRes.data.data.applications)
      setStats(statsRes?.data?.data || null)
    } catch (error) {
      toast.error('Failed to fetch KYC applications')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  return (
    <div className="space-y-6">
      <PlatformPageHeader
        badge="Compliance Queue"
        title="KYC Verification"
        description="Review restaurant identity, ownership, and tax documents before enabling full platform access."
        icon={FiShield}
        actions={
          <Button type="button" variant="secondary" onClick={() => fetchApplications(true)} disabled={refreshing}>
            <FiRefreshCw className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <PlatformMetric label="Pending" value={stats?.pending || applications.length} sub="Awaiting review" icon={FiClock} accent="from-yellow-500 to-amber-500" />
        <PlatformMetric label="Approved" value={stats?.approved || 0} sub="Verified restaurants" icon={FiCheckCircle} accent="from-emerald-500 to-teal-500" />
        <PlatformMetric label="Rejected" value={stats?.rejected || 0} sub="Needs resubmission" icon={FiXCircle} accent="from-rose-500 to-red-500" />
        <PlatformMetric label="In queue" value={applications.length} sub="Visible in this view" icon={FiFileText} accent="from-blue-500 to-indigo-500" />
      </div>

      <Card title={`Pending Applications (${applications.length})`}>
        <KYCTable applications={applications} loading={loading} />
      </Card>
    </div>
  )
}

export default KYCPending
