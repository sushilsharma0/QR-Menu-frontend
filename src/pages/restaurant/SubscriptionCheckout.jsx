import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  FiArrowLeft,
  FiCheck,
  FiClock,
  FiCreditCard,
  FiFileText,
  FiShield,
  FiZap,
} from 'react-icons/fi'
import toast from '@utils/toast'
import api from '../../services/api'
import Button from '../../components/common/Button'
import EsewaButton from '../../components/payment/EsewaButton'
import KhaltiButton from '../../components/payment/KhaltiButton'
import { useAuth } from '../../hooks/useAuth'
import { getTenantSegments, restaurantPortalBase } from '../../utils/tenantPaths'
import {
  RestaurantPageLoader,
  formatRestaurantCurrency,
  formatRestaurantDateTime,
} from '../../components/restaurant/RestaurantUI'

const FILE_MAX_BYTES = 1 * 1024 * 1024

const paymentStatusStyles = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-blue-100 text-blue-800',
  pending_verification: 'bg-amber-100 text-amber-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  failed: 'bg-red-100 text-red-800',
}

function planTotal(plan) {
  return plan?.pricing?.totalInclVat ?? plan?.price ?? 0
}

function planSymbol(plan) {
  return plan?.pricing?.currencySymbol || 'Rs.'
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-surface-200 py-3 last:border-b-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-right text-sm font-semibold text-gray-950">{value}</span>
    </div>
  )
}

const SubscriptionCheckout = () => {
  const { planId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [plan, setPlan] = useState(null)
  const [status, setStatus] = useState(null)
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [manualReferenceId, setManualReferenceId] = useState('')
  const [manualNote, setManualNote] = useState('')
  const [manualProof, setManualProof] = useState(null)
  const [manualSubmitting, setManualSubmitting] = useState(false)

  const { slug, restaurantId } = getTenantSegments(user)
  const subscriptionPath = `${restaurantPortalBase(slug, restaurantId)}/subscription`

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [planRes, statusRes, paymentsRes] = await Promise.all([
          api.get(`/platform/subscriptions/plans/${planId}`),
          api.get('/restaurant/package/status'),
          api.get('/restaurant/subscription/payments', { params: { limit: 20 } }),
        ])
        setPlan(planRes.data.data)
        setStatus(statusRes.data.data)
        setPayments(paymentsRes.data.data?.payments || [])
      } catch (error) {
        toast.error(error.response?.data?.message || 'Could not load checkout details')
        navigate(subscriptionPath)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [navigate, planId, subscriptionPath])

  const relatedPayment = useMemo(
    () =>
      payments.find(
        (payment) =>
          payment.planId?._id === planId &&
          ['paid', 'pending_verification'].includes(payment.status),
      ),
    [payments, planId],
  )

  const isCurrent = status?.currentPlan?._id === planId
  const isLocked = !user?.isKYCVerified || isCurrent || Boolean(relatedPayment)
  const total = planTotal(plan)
  const symbol = planSymbol(plan)
  const manualPaymentDetails = status?.manualPaymentDetails || {}
  const hasManualAccountDetails = Boolean(
    manualPaymentDetails.accountName ||
      manualPaymentDetails.accountNumber ||
      manualPaymentDetails.branch ||
      manualPaymentDetails.qrCodeImage,
  )

  const handlePaymentStarted = (payment) => {
    if (payment && ['paid', 'pending_verification'].includes(payment.status)) {
      setPayments((prev) => [payment, ...prev])
    }
    toast.success('Payment started. Complete checkout in the gateway page.')
  }

  const handleManualSubmit = async () => {
    if (manualSubmitting || isLocked) return
    if (!manualProof) {
      toast.error('Please upload payment proof before submitting.')
      return
    }
    if (!manualReferenceId.trim()) {
      toast.error('Please enter statement reference ID.')
      return
    }

    try {
      setManualSubmitting(true)
      const formData = new FormData()
      formData.append('planId', planId)
      formData.append('paymentProof', manualProof)
      formData.append('referenceId', manualReferenceId.trim())
      if (manualNote.trim()) formData.append('note', manualNote.trim())

      const res = await api.post('/restaurant/subscription/pay/manual', formData)
      const payment = res.data?.data?.payment
      if (payment) {
        setPayments((prev) => [payment, ...prev])
      }
      setManualProof(null)
      setManualReferenceId('')
      setManualNote('')
      toast.success('Manual payment submitted for platform review.')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not submit manual payment')
    } finally {
      setManualSubmitting(false)
    }
  }

  const handleManualProofChange = (event) => {
    const file = event.target.files?.[0] || null
    if (file && file.size > FILE_MAX_BYTES) {
      toast.error('Payment proof must be less than 1 MB')
      event.target.value = ''
      setManualProof(null)
      return
    }
    setManualProof(file)
  }

  if (loading) return <RestaurantPageLoader />
  if (!plan) return null

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to={subscriptionPath}>
          <Button variant="secondary">
            <FiArrowLeft className="mr-2" />
            Back to plans
          </Button>
        </Link>
        {relatedPayment && (
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${paymentStatusStyles[relatedPayment.status] || 'bg-gray-100 text-gray-700'}`}>
            {relatedPayment.status.replace(/_/g, ' ')}
          </span>
        )}
      </div>

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-surface-200 bg-white shadow-sm"
      >
        <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-r from-primary-50 via-surface-50 to-white" />
        <div className="relative grid gap-6 p-5 lg:grid-cols-[1.25fr_.75fr] lg:p-7">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary-100 bg-white/90 px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary-700 shadow-sm">
              <FiCreditCard className="h-4 w-4" />
              Subscription checkout
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-gray-950">{plan.name}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
              Review the plan details and choose a secure gateway. Your subscription activates only after the platform verifies the payment.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-surface-200 bg-white/90 p-4">
                <FiClock className="h-5 w-5 text-primary-600" />
                <p className="mt-3 text-xs font-semibold uppercase text-gray-500">Duration</p>
                <p className="mt-1 text-lg font-black text-gray-950">{plan.durationLabel || `${plan.duration} days`}</p>
              </div>
              <div className="rounded-2xl border border-surface-200 bg-white/90 p-4">
                <FiZap className="h-5 w-5 text-primary-600" />
                <p className="mt-3 text-xs font-semibold uppercase text-gray-500">Plan type</p>
                <p className="mt-1 text-lg font-black capitalize text-gray-950">{plan.planType}</p>
              </div>
              <div className="rounded-2xl border border-surface-200 bg-white/90 p-4">
                <FiShield className="h-5 w-5 text-primary-600" />
                <p className="mt-3 text-xs font-semibold uppercase text-gray-500">Verification</p>
                <p className="mt-1 text-lg font-black text-gray-950">Admin review</p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-surface-200 bg-white p-5">
              <h2 className="text-lg font-black text-gray-950">Included features</h2>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {(plan.features || []).map((feature, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700">
                      <FiCheck className="h-3.5 w-3.5" />
                    </span>
                    <span>{feature}</span>
                  </div>
                ))}
                {(plan.features || []).length === 0 && (
                  <p className="text-sm text-gray-500">No feature list has been added for this plan.</p>
                )}
              </div>
            </div>
          </div>

          <aside className="rounded-3xl border border-surface-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">Payment summary</p>
            <p className="mt-3 text-4xl font-black text-primary-700">
              {formatRestaurantCurrency(total, symbol)}
            </p>

            <div className="mt-5 rounded-2xl bg-surface-50 px-4">
              <DetailRow label="Subtotal" value={formatRestaurantCurrency(plan.pricing?.priceExclVat ?? plan.priceExclVat ?? total, symbol)} />
              <DetailRow label="VAT" value={formatRestaurantCurrency(plan.pricing?.vatAmount ?? 0, symbol)} />
              <DetailRow label="Total payable" value={formatRestaurantCurrency(total, symbol)} />
              <DetailRow label="Starts" value="After admin approval" />
              <DetailRow label="Expires" value={`${plan.duration || 0} days after activation`} />
            </div>

            {isCurrent && (
              <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
                This is already your active plan.
              </div>
            )}

            {!user?.isKYCVerified && (
              <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
                KYC verification is required before selecting or purchasing a subscription plan.
              </div>
            )}

            {relatedPayment && (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                Transaction <strong>{relatedPayment.transactionId}</strong> is currently{' '}
                <strong>{relatedPayment.status.replace(/_/g, ' ')}</strong>.
              </div>
            )}

            <div className="mt-5 space-y-3">
              <EsewaButton planId={plan._id} disabled={isLocked} onStarted={handlePaymentStarted} />
              <KhaltiButton planId={plan._id} disabled={isLocked} onStarted={handlePaymentStarted} />
            </div>

            <div className="mt-5 rounded-2xl border border-surface-200 bg-surface-50 p-4">
              <div className="flex items-center gap-2">
                <FiFileText className="h-4 w-4 text-gray-600" />
                <p className="text-sm font-semibold text-gray-800">Manual payment submission</p>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Paid via bank transfer or cash deposit? Upload your receipt so the admin can verify it.
              </p>
              {hasManualAccountDetails && (
                <div className="mt-3 rounded-xl border border-amber-200 bg-white p-3 text-sm text-gray-700">
                  <p className="font-semibold text-gray-900">Account details</p>
                  <p className="mt-2"><strong>Account name:</strong> {manualPaymentDetails.accountName || '-'}</p>
                  <p><strong>Account number:</strong> {manualPaymentDetails.accountNumber || '-'}</p>
                  <p><strong>Branch:</strong> {manualPaymentDetails.branch || '-'}</p>
                  {manualPaymentDetails.notes ? (
                    <p className="mt-1 text-xs text-gray-500">{manualPaymentDetails.notes}</p>
                  ) : null}
                  {manualPaymentDetails.qrCodeImage ? (
                    <div className="mt-3 rounded-xl border border-surface-200 bg-surface-50 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">QR payment code</p>
                      <a
                        href={manualPaymentDetails.qrCodeImage}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 block"
                        title="Open QR image in new tab"
                      >
                        <img
                          src={manualPaymentDetails.qrCodeImage}
                          alt="Manual payment QR code"
                          className="h-80 w-80 rounded-lg border border-surface-200 object-contain bg-white"
                        />
                      </a>
                      <a
                        href={manualPaymentDetails.qrCodeImage}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-block text-xs font-semibold text-primary-700 underline"
                      >
                        Open full-size QR
                      </a>
                    </div>
                  ) : null}
                </div>
              )}
              <div className="mt-3 space-y-3">
                <input
                  type="text"
                  value={manualReferenceId}
                  onChange={(e) => setManualReferenceId(e.target.value)}
                  placeholder="Statement Reference ID (required)"
                  className="w-full rounded-xl border border-surface-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500"
                  disabled={isLocked || manualSubmitting}
                />
                <textarea
                  value={manualNote}
                  onChange={(e) => setManualNote(e.target.value)}
                  placeholder="Note for admin (optional)"
                  className="min-h-20 w-full rounded-xl border border-surface-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500"
                  disabled={isLocked || manualSubmitting}
                />
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,.gif,.pdf"
                  onChange={handleManualProofChange}
                  className="w-full rounded-xl border border-surface-300 bg-white px-3 py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-primary-100 file:px-3 file:py-1.5 file:font-semibold file:text-primary-700"
                  disabled={isLocked || manualSubmitting}
                />
                <p className="text-xs text-gray-500">JPG, PNG, WEBP, GIF or PDF. Max 1 MB.</p>
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full"
                  disabled={isLocked || manualSubmitting}
                  loading={manualSubmitting}
                  onClick={handleManualSubmit}
                >
                  Submit Manual Payment
                </Button>
              </div>
            </div>

            <p className="mt-4 text-xs leading-5 text-gray-500">
              Gateway or manual payment submissions are reviewed by platform admins before plan activation.
            </p>
          </aside>
        </div>
      </motion.section>

      <section className="rounded-3xl border border-surface-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-black text-gray-950">Recent payment attempts</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-surface-200 text-sm">
            <thead className="bg-surface-50">
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3">Transaction</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-200">
              {payments.slice(0, 5).map((payment) => (
                <tr key={payment._id}>
                  <td className="px-4 py-3 font-mono text-xs">{payment.transactionId}</td>
                  <td className="px-4 py-3 capitalize">{payment.paymentMethod}</td>
                  <td className="px-4 py-3">{formatRestaurantCurrency(payment.amount)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${paymentStatusStyles[payment.status] || 'bg-gray-100 text-gray-700'}`}>
                      {payment.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{formatRestaurantDateTime(payment.createdAt)}</td>
                </tr>
              ))}
              {payments.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                    No payment attempts yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

export default SubscriptionCheckout
