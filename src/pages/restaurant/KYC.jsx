import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTenantRoutes } from '../../hooks/useTenantRoutes'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import toast from '@utils/toast'
import {
  FiAlertCircle,
  FiArrowUpRight,
  FiCheckCircle,
  FiClock,
  FiFileText,
  FiImage,
  FiShield,
  FiUploadCloud,
  FiUser,
} from 'react-icons/fi'
import api from '../../services/api'
import { useAuth } from '../../hooks/useAuth'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Card from '../../components/common/Card'

const FILE_MAX_BYTES = 1 * 1024 * 1024

const statusMeta = {
  approved: {
    label: 'Verified',
    description: 'Your KYC has been approved. Details are locked and available for read-only tracking.',
    pill: 'bg-emerald-100 text-emerald-800',
    icon: FiCheckCircle,
    accent: 'from-emerald-500 to-teal-500',
  },
  pending: {
    label: 'Under Review',
    description: 'Your documents are with the verification team. Editing is locked while review is in progress.',
    pill: 'bg-amber-100 text-amber-800',
    icon: FiClock,
    accent: 'from-amber-500 to-orange-500',
  },
  rejected: {
    label: 'Needs Resubmission',
    description: 'Review the reason, update the requested information, and submit again.',
    pill: 'bg-red-100 text-red-800',
    icon: FiAlertCircle,
    accent: 'from-red-500 to-orange-500',
  },
  not_submitted: {
    label: 'Not Submitted',
    description: 'Submit owner details and identity documents to unlock full restaurant access.',
    pill: 'bg-gray-100 text-gray-700',
    icon: FiShield,
    accent: 'from-primary-600 to-secondary-500',
  },
}

const idTypeLabels = {
  passport: 'Passport',
  national_id: 'National ID',
  driving_license: 'Driving License',
  pan: 'PAN Card',
}

const documentLabels = {
  idDocument: 'Identity document',
  panDocument: 'PAN document',
  profilePhoto: 'Profile photo',
  businessRegistrationDoc: 'Business registration',
  addressProof: 'Address proof',
}

const formatDate = (value) => {
  if (!value) return 'N/A'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'N/A'
  return date.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
}

const StatusPill = ({ status }) => {
  const meta = statusMeta[status] || statusMeta.not_submitted
  return <span className={`rounded-full px-3 py-1 text-sm font-semibold ${meta.pill}`}>{meta.label}</span>
}

const DetailRow = ({ label, value, icon: Icon }) => (
  <div className="rounded-2xl bg-surface-50/70 px-4 py-3">
    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
      {Icon && <Icon className="h-4 w-4 text-primary-600" />}
      {label}
    </div>
    <p className="mt-2 break-words text-sm font-bold text-gray-950">{value || 'N/A'}</p>
  </div>
)

const DocumentCard = ({ label, type, url }) => {
  const isImage = /\.(png|jpe?g|webp|gif)$/i.test(String(url || '').split('?')[0])

  return (
    <div className="rounded-2xl border border-surface-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
            {isImage ? <FiImage className="h-5 w-5" /> : <FiFileText className="h-5 w-5" />}
          </span>
          <div>
            <p className="font-bold text-gray-950">{label}</p>
            <p className="mt-1 text-xs capitalize text-gray-500">{type || 'Uploaded document'}</p>
          </div>
        </div>
        {url ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-lg bg-surface-50 px-3 py-2 text-sm font-semibold text-primary-700 transition hover:bg-surface-100"
          >
            View
            <FiArrowUpRight className="h-4 w-4" />
          </a>
        ) : (
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-500">Not uploaded</span>
        )}
      </div>
    </div>
  )
}

const FilePicker = ({ label, hint, accept, onChange }) => {
  const handleChange = (event) => {
    const file = event.target.files?.[0] || null
    if (file && file.size > FILE_MAX_BYTES) {
      toast.error('File must be less than 1 MB')
      event.target.value = ''
      onChange(null)
      return
    }
    onChange(file)
  }

  return (
    <div className="rounded-2xl border border-dashed border-surface-300 bg-surface-50/50 p-4">
      <label className="block text-sm font-semibold text-gray-800">{label}</label>
      <input
        type="file"
        accept={accept}
        onChange={handleChange}
        className="mt-3 w-full text-sm text-gray-600 file:mr-4 file:rounded-lg file:border-0 file:bg-primary-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-primary-700"
      />
      {hint && <p className="mt-2 text-xs text-gray-500">{hint}</p>}
      <p className="mt-1 text-xs font-semibold text-gray-500">Max 1 MB.</p>
    </div>
  )
}

const KYC = () => {
  const navigate = useNavigate()
  const { restaurantBase } = useTenantRoutes()
  const { mergeUser, user: authUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [statusLoading, setStatusLoading] = useState(true)
  const [kycStatus, setKycStatus] = useState({ status: 'not_submitted' })
  const [files, setFiles] = useState({
    idDocument: null,
    panDocument: null,
    profilePhoto: null,
    businessRegistrationDoc: null,
    addressProof: null,
  })
  const { register, handleSubmit, setValue, formState: { errors } } = useForm()

  useEffect(() => {
    fetchKYCStatus()
  }, [])

  const fetchKYCStatus = async () => {
    try {
      setStatusLoading(true)
      const res = await api.get('/restaurant/kyc/status')
      const data = res.data.data || { status: 'not_submitted' }
      setKycStatus(data)
      mergeUser({ isKYCVerified: data.status === 'approved' })

      if (data.status !== 'not_submitted') {
        setValue('ownerName', data.ownerName || '')
        setValue('ownerEmail', data.ownerEmail || '')
        setValue('ownerPhone', data.ownerPhone || '')
        setValue('idType', data.idType || '')
        setValue('idNumber', data.idNumber || '')
        setValue('panNumber', data.panNumber || '')
        setValue('businessRegistrationNo', data.businessRegistrationNo || '')
      }
    } catch (error) {
      toast.error('Failed to fetch KYC status')
    } finally {
      setStatusLoading(false)
    }
  }

  const onSubmit = async (data) => {
    try {
      setLoading(true)
      const formData = new FormData()
      Object.keys(data).forEach((key) => {
        if (data[key] !== undefined && data[key] !== '') formData.append(key, data[key])
      })
      Object.entries(files).forEach(([key, file]) => {
        if (file) formData.append(key, file)
      })

      // Let the browser set multipart boundary — a manual Content-Type breaks field parsing on the server.
      await api.post('/restaurant/kyc/submit', formData)
      toast.success('KYC submitted successfully')
      fetchKYCStatus()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Submission failed')
    } finally {
      setLoading(false)
    }
  }

  const status = kycStatus?.status || 'not_submitted'
  const meta = statusMeta[status] || statusMeta.not_submitted
  const StatusIcon = meta.icon
  const canSubmit = status === 'not_submitted' || status === 'rejected'
  const isReadOnlyTracking = status === 'approved' || status === 'pending'

  const documents = useMemo(() => ([
    {
      key: 'idDocument',
      label: `${documentLabels.idDocument}${kycStatus?.idType ? ` (${idTypeLabels[kycStatus.idType] || kycStatus.idType})` : ''}`,
      type: kycStatus?.idNumber ? `ID No. ${kycStatus.idNumber}` : 'Identity proof',
      url: kycStatus?.idDocument,
    },
    { key: 'panDocument', label: documentLabels.panDocument, type: kycStatus?.panNumber ? `PAN ${kycStatus.panNumber}` : 'Tax document', url: kycStatus?.panDocument },
    { key: 'profilePhoto', label: documentLabels.profilePhoto, type: 'Owner photo', url: kycStatus?.profilePhoto },
    { key: 'businessRegistrationDoc', label: documentLabels.businessRegistrationDoc, type: kycStatus?.businessRegistrationNo ? `Reg. ${kycStatus.businessRegistrationNo}` : 'Business proof', url: kycStatus?.businessRegistrationDoc },
    { key: 'addressProof', label: documentLabels.addressProof, type: 'Restaurant address proof', url: kycStatus?.addressProof },
  ]), [kycStatus])

  if (statusLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-fit space-y-6">
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="relative overflow-hidden rounded-3xl border border-surface-200 bg-white shadow-sm"
      >
        <div className="absolute inset-x-0 top-0 h-44 bg-gradient-to-r from-primary-50 via-surface-50 to-emerald-50" />
        <div className="relative p-5 md:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary-100 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-700 shadow-sm">
                <FiShield className="h-4 w-4" />
                Restaurant Verification
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight text-gray-950">KYC Verification</h1>
                <StatusPill status={status} />
              </div>
              <p className="mt-2 max-w-3xl text-sm text-gray-500">{meta.description}</p>
            </div>
            <div className="rounded-2xl border border-white/80 bg-white/90 px-5 py-4 shadow-sm">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${meta.accent} text-white shadow-md`}>
                <StatusIcon className="h-6 w-6" />
              </div>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Current status</p>
              <p className="mt-1 text-xl font-bold text-gray-950">{meta.label}</p>
            </div>
          </div>
        </div>
      </motion.section>

      {status === 'rejected' && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4">
          <p className="font-bold text-red-900">Rejection reason</p>
          <p className="mt-1 text-sm text-red-700">{kycStatus.rejectionReason || 'No reason provided.'}</p>
          <p className="mt-2 text-sm text-red-600">Please update the requested details and submit again.</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {status !== 'not_submitted' && (
            <>
              <Card title="Submitted Details" icon={FiUser} className="rounded-2xl border-surface-200 shadow-sm">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <DetailRow label="Owner name" value={kycStatus.ownerName} icon={FiUser} />
                  <DetailRow label="Owner email" value={kycStatus.ownerEmail} icon={FiUser} />
                  <DetailRow label="Owner phone" value={kycStatus.ownerPhone} icon={FiUser} />
                  <DetailRow label="ID type" value={idTypeLabels[kycStatus.idType] || kycStatus.idType} icon={FiFileText} />
                  <DetailRow label="ID number" value={kycStatus.idNumber} icon={FiFileText} />
                  <DetailRow label="PAN number" value={kycStatus.panNumber || 'N/A'} icon={FiFileText} />
                  <DetailRow label="Business reg. no." value={kycStatus.businessRegistrationNo || 'N/A'} icon={FiFileText} />
                  <DetailRow label="Submitted at" value={formatDate(kycStatus.submittedAt)} icon={FiClock} />
                </div>
              </Card>

              <Card title="Submitted Documents" icon={FiFileText} className="rounded-2xl border-surface-200 shadow-sm">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {documents.map((doc) => (
                    <DocumentCard key={doc.key} label={doc.label} type={doc.type} url={doc.url} />
                  ))}
                </div>
              </Card>
            </>
          )}

          {canSubmit && (
            <Card title={status === 'rejected' ? 'Resubmit KYC' : 'Submit KYC'} icon={FiUploadCloud} className="rounded-2xl border-surface-200 shadow-sm">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                    <label className="mb-1 block text-sm font-medium text-gray-700">ID Type</label>
                    <select
                      {...register('idType', { required: 'ID type is required' })}
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
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
                    label="PAN Number"
                    placeholder="Enter PAN number"
                    {...register('panNumber')}
                    error={errors.panNumber?.message}
                  />
                  <Input
                    label="Business Registration Number"
                    placeholder="Enter registration number"
                    {...register('businessRegistrationNo')}
                    error={errors.businessRegistrationNo?.message}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FilePicker label="ID Document" hint="Clear copy of selected ID. JPG, PNG, or PDF." accept="image/*,application/pdf" onChange={(file) => setFiles((current) => ({ ...current, idDocument: file }))} />
                  <FilePicker label="PAN Document" hint="Optional tax document. JPG, PNG, or PDF." accept="image/*,application/pdf" onChange={(file) => setFiles((current) => ({ ...current, panDocument: file }))} />
                  <FilePicker label="Profile Photo" hint="Owner or authorized person photo. Square 4x4 style, recommended 512x512 px." accept="image/*" onChange={(file) => setFiles((current) => ({ ...current, profilePhoto: file }))} />
                  <FilePicker label="Business Registration Document" hint="Optional business proof. JPG, PNG, or PDF." accept="image/*,application/pdf" onChange={(file) => setFiles((current) => ({ ...current, businessRegistrationDoc: file }))} />
                  <FilePicker label="Address Proof" hint="Optional utility bill, lease, or address proof." accept="image/*,application/pdf" onChange={(file) => setFiles((current) => ({ ...current, addressProof: file }))} />
                </div>

                <Button type="submit" loading={loading} className="w-full">
                  Submit KYC
                </Button>
              </form>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card title="Tracking" icon={FiShield} className="rounded-2xl border-surface-200 shadow-sm lg:sticky lg:top-6">
            <div className="space-y-3">
              <DetailRow label="Status" value={meta.label} icon={StatusIcon} />
              <DetailRow label="Submitted" value={formatDate(kycStatus.submittedAt)} icon={FiClock} />
              <DetailRow label="Last updated" value={formatDate(kycStatus.updatedAt)} icon={FiClock} />
              <DetailRow label="Reviewed at" value={formatDate(kycStatus.reviewedAt)} icon={FiCheckCircle} />
              <DetailRow label="Reviewed by" value={kycStatus.reviewedBy?.name || 'Platform team'} icon={FiUser} />
            </div>

            {isReadOnlyTracking && (
              <div className="mt-5 rounded-2xl border border-surface-200 bg-surface-50/70 px-4 py-4 text-sm text-gray-600">
                This KYC application is read-only. Approved or in-review details cannot be updated from this page.
              </div>
            )}

            {status === 'approved' && (
              <Button
                onClick={() =>
                  navigate(
                    authUser?.needsPlanUpgrade
                      ? `${restaurantBase}/subscription`
                      : `${restaurantBase}/dashboard`,
                  )
                }
                className="mt-5 w-full"
              >
                {authUser?.needsPlanUpgrade ? 'Go to Subscription' : 'Go to Dashboard'}
              </Button>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}

export default KYC
