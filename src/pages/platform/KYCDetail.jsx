import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FiArrowLeft, FiCheckCircle, FiExternalLink, FiFileText, FiShield, FiXCircle } from 'react-icons/fi'
import toast from '@utils/toast'
import api from '../../services/api'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Modal from '../../components/common/Modal'
import { RestaurantPageLoader } from '../../components/restaurant/RestaurantUI'
import { PlatformMetric, PlatformPageHeader, PlatformPill, platformStatusStyles } from '../../components/platform/PlatformUI'

const KYCDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [kyc, setKyc] = useState(null)
  const [loading, setLoading] = useState(true)
  const [rejectModal, setRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  useEffect(() => {
    fetchKYC()
  }, [id])

  const fetchKYC = async () => {
    try {
      const res = await api.get(`/platform/kyc/${id}`)
      setKyc(res.data.data)
    } catch (error) {
      toast.error('Failed to fetch KYC details')
      navigate('/platform/kyc')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async () => {
    try {
      await api.patch(`/platform/kyc/${id}/approve`, { notes: 'KYC approved' })
      toast.success('KYC approved successfully')
      navigate('/platform/kyc')
    } catch (error) {
      toast.error('Failed to approve KYC')
    }
  }

  const handleReject = async () => {
    if (!rejectReason) {
      toast.error('Please provide a rejection reason')
      return
    }
    try {
      await api.patch(`/platform/kyc/${id}/reject`, { reason: rejectReason })
      toast.success('KYC rejected')
      setRejectModal(false)
      navigate('/platform/kyc')
    } catch (error) {
      toast.error('Failed to reject KYC')
    }
  }

  if (loading) {
    return <RestaurantPageLoader />
  }

  return (
    <div className="space-y-6">
      <PlatformPageHeader
        badge="KYC Review"
        title={kyc?.restaurant?.name || 'Restaurant KYC'}
        description="Validate restaurant, owner, and document details before approving platform access."
        icon={FiShield}
        actions={
          <>
            <Button variant="success" onClick={handleApprove}><FiCheckCircle className="mr-2" />Approve</Button>
            <Button variant="danger" onClick={() => setRejectModal(true)}><FiXCircle className="mr-2" />Reject</Button>
            <Button variant="secondary" onClick={() => navigate('/platform/kyc')}><FiArrowLeft className="mr-2" />Back</Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <PlatformMetric label="Status" value={kyc?.status || 'Pending'} sub="Current KYC state" icon={FiShield} accent="from-blue-500 to-indigo-500" />
        <PlatformMetric label="Owner" value={kyc?.ownerName || 'N/A'} sub={kyc?.idType || 'Identity document'} icon={FiFileText} accent="from-emerald-500 to-teal-500" />
        <PlatformMetric label="Submitted" value={kyc?.createdAt ? new Date(kyc.createdAt).toLocaleDateString() : 'N/A'} sub="Application date" icon={FiCheckCircle} accent="from-amber-500 to-orange-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Restaurant Information">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="font-medium">{kyc?.restaurant?.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{kyc?.restaurant?.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="font-medium">{kyc?.restaurant?.phone}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Address</p>
              <p className="font-medium">{kyc?.restaurant?.address}</p>
            </div>
          </div>
        </Card>

        <Card title="Owner Information">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <PlatformPill className={platformStatusStyles[kyc?.status] || platformStatusStyles.pending}>
                {kyc?.status || 'pending'}
              </PlatformPill>
            </div>
            <div>
              <p className="text-sm text-gray-500">Owner Name</p>
              <p className="font-medium">{kyc?.ownerName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">ID Type</p>
              <p className="font-medium">{kyc?.idType}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">ID Number</p>
              <p className="font-medium">{kyc?.idNumber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">PAN Number</p>
              <p className="font-medium">{kyc?.panNumber || 'N/A'}</p>
            </div>
          </div>
        </Card>

        <Card title="Documents">
          <div className="space-y-4">
            {kyc?.idDocument && (
              <div>
                <p className="text-sm text-gray-500 mb-1">ID Document</p>
                <a href={kyc.idDocument} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                  <span className="inline-flex items-center gap-1">View Document <FiExternalLink className="h-3 w-3" /></span>
                </a>
              </div>
            )}
            {kyc?.panDocument && (
              <div>
                <p className="text-sm text-gray-500 mb-1">PAN Document</p>
                <a href={kyc.panDocument} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                  <span className="inline-flex items-center gap-1">View Document <FiExternalLink className="h-3 w-3" /></span>
                </a>
              </div>
            )}
            {kyc?.profilePhoto && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Profile Photo</p>
                <img src={kyc.profilePhoto} alt="Profile" className="w-32 h-32 rounded-lg object-cover" />
              </div>
            )}
          </div>
        </Card>
      </div>

      <Modal isOpen={rejectModal} onClose={() => setRejectModal(false)} title="Reject KYC">
        <div className="p-6">
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Rejection Reason</label>
          <textarea
            rows={4}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:ring-2 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            placeholder="Enter reason for rejection..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <div className="flex gap-3 mt-6">
            <Button onClick={handleReject}>Confirm Reject</Button>
            <Button variant="secondary" onClick={() => setRejectModal(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default KYCDetail
