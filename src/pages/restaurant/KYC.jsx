import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTenantRoutes } from '../../hooks/useTenantRoutes'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { useAuth } from '../../hooks/useAuth'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Card from '../../components/common/Card'

const KYC = () => {
  const navigate = useNavigate()
  const { restaurantBase } = useTenantRoutes()
  const { mergeUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [kycStatus, setKycStatus] = useState(null)
  const [files, setFiles] = useState({
    idDocument: null,
    panDocument: null,
    profilePhoto: null
  })
  const { register, handleSubmit, setValue, formState: { errors } } = useForm()

  useEffect(() => {
    fetchKYCStatus()
  }, [])

  const fetchKYCStatus = async () => {
    try {
      const res = await api.get('/restaurant/kyc/status')
      setKycStatus(res.data.data)
      mergeUser({
        isKYCVerified: res.data.data.status === 'approved',
      })
      if (res.data.data.status !== 'not_submitted') {
        setValue('ownerName', res.data.data.ownerName)
        setValue('ownerEmail', res.data.data.ownerEmail)
        setValue('ownerPhone', res.data.data.ownerPhone)
        setValue('idType', res.data.data.idType)
        setValue('idNumber', res.data.data.idNumber)
        setValue('panNumber', res.data.data.panNumber)
      }
    } catch (error) {
      console.error('Failed to fetch KYC status')
    }
  }

  const onSubmit = async (data) => {
    try {
      setLoading(true)
      const formData = new FormData()
      Object.keys(data).forEach(key => {
        if (data[key] !== undefined) formData.append(key, data[key])
      })
      if (files.idDocument) formData.append('idDocument', files.idDocument)
      if (files.panDocument) formData.append('panDocument', files.panDocument)
      if (files.profilePhoto) formData.append('profilePhoto', files.profilePhoto)

      await api.post('/restaurant/kyc/submit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      toast.success('KYC submitted successfully')
      fetchKYCStatus()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Submission failed')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = () => {
    const status = kycStatus?.status
    const styles = {
      approved: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      rejected: 'bg-red-100 text-red-800',
      not_submitted: 'bg-gray-100 text-gray-800'
    }
    const labels = {
      approved: 'Approved',
      pending: 'Under Review',
      rejected: 'Rejected',
      not_submitted: 'Not Submitted'
    }
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    )
  }

  if (kycStatus?.status === 'approved') {
    return (
      <div className="max-w-md mx-auto text-center">
        <div className="bg-green-50 rounded-xl p-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">KYC Verified!</h2>
          <p className="text-gray-600 mb-6">Your KYC has been approved. You can now access all features.</p>
          <Button onClick={() => navigate(`${restaurantBase}/dashboard`)}>Go to Dashboard</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">KYC Verification</h1>
            <p className="text-gray-500 mt-1">Submit your documents for verification</p>
          </div>
          {getStatusBadge()}
        </div>
        {kycStatus?.status === 'rejected' && (
          <div className="mt-4 p-4 bg-red-50 rounded-lg">
            <p className="text-red-800 font-medium">Rejection Reason:</p>
            <p className="text-red-600">{kycStatus.rejectionReason}</p>
            <p className="text-sm text-red-500 mt-2">Please resubmit with correct documents.</p>
          </div>
        )}
      </div>

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            label="Owner Name"
            placeholder="Enter full name as per ID"
            {...register('ownerName', { required: 'Owner name is required' })}
            error={errors.ownerName?.message}
          />

          <Input
            label="Owner Email"
            type="email"
            placeholder="Enter email"
            {...register('ownerEmail')}
            error={errors.ownerEmail?.message}
          />

          <Input
            label="Owner Phone"
            placeholder="Enter phone number"
            {...register('ownerPhone')}
            error={errors.ownerPhone?.message}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ID Type</label>
            <select
              {...register('idType', { required: 'ID type is required' })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select ID Type</option>
              <option value="passport">Passport</option>
              <option value="national_id">National ID</option>
              <option value="driving_license">Driving License</option>
              <option value="pan">PAN Card</option>
            </select>
            {errors.idType && <p className="mt-1 text-sm text-red-600">{errors.idType.message}</p>}
          </div>

          <Input
            label="ID Number"
            placeholder="Enter ID number"
            {...register('idNumber', { required: 'ID number is required' })}
            error={errors.idNumber?.message}
          />

          <Input
            label="PAN Number (Optional)"
            placeholder="Enter PAN number"
            {...register('panNumber')}
            error={errors.panNumber?.message}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ID Document (Front)</label>
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => setFiles({ ...files, idDocument: e.target.files[0] })}
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">Upload clear copy of ID (JPG, PNG, PDF)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">PAN Document</label>
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => setFiles({ ...files, panDocument: e.target.files[0] })}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Profile Photo</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFiles({ ...files, profilePhoto: e.target.files[0] })}
              className="w-full"
            />
          </div>

          <Button type="submit" loading={loading} className="w-full">
            Submit KYC
          </Button>
        </form>
      </Card>
    </div>
  )
}

export default KYC