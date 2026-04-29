import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../../services/api'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Modal from '../../components/common/Modal'

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
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">KYC Review</h1>
          <p className="text-gray-500 mt-1">{kyc?.restaurant?.name}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="success" onClick={handleApprove}>Approve</Button>
          <Button variant="danger" onClick={() => setRejectModal(true)}>Reject</Button>
          <Button variant="secondary" onClick={() => navigate('/platform/kyc')}>Back</Button>
        </div>
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
                  View Document
                </a>
              </div>
            )}
            {kyc?.panDocument && (
              <div>
                <p className="text-sm text-gray-500 mb-1">PAN Document</p>
                <a href={kyc.panDocument} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                  View Document
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
          <label className="block text-sm font-medium text-gray-700 mb-2">Rejection Reason</label>
          <textarea
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
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