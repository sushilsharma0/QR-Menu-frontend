import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../../services/api'
import Card from '../../components/common/Card'
import KYCTable from '../../components/platform/KYCTable'

const KYCPending = () => {
  const navigate = useNavigate()
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchApplications()
  }, [])

  const fetchApplications = async () => {
    try {
      const res = await api.get('/platform/kyc', { params: { status: 'pending' } })
      setApplications(res.data.data.applications)
    } catch (error) {
      toast.error('Failed to fetch KYC applications')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">KYC Verification</h1>
        <p className="text-gray-500 mt-1">Review and verify restaurant KYC applications</p>
      </div>

      <Card title={`Pending Applications (${applications.length})`}>
        <KYCTable applications={applications} loading={loading} />
      </Card>
    </div>
  )
}

export default KYCPending