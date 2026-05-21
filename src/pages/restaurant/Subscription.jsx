import React, { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, LazyMotion, domAnimation, m } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  FiAlertTriangle,
  FiCheck,
  FiClock,
  FiCreditCard,
  FiFileText,
  FiGift,
  FiRefreshCw,
  FiShield,
  FiStar,
  FiUpload,
  FiZap,
} from 'react-icons/fi'
import toast from '@utils/toast'
import api from '../../services/api'
import Button from '../../components/common/Button'
import SubscriptionBillingPanel from './SubscriptionBillingPanel'
import { useAuth } from '../../hooks/useAuth'
import { getTenantSegments, restaurantPortalBase } from '../../utils/tenantPaths'
import {
  RestaurantPageLoader,
  RestaurantStatusPill,
  formatRestaurantCurrency,
  formatRestaurantDateTime,
} from '../../components/restaurant/RestaurantUI'
import PlanFeaturesIncluded from '../../components/restaurant/PlanFeaturesIncluded'

const FILE_MAX_BYTES = 1 * 1024 * 1024

const requestStatusStyles = {
  active: 'bg-green-100 text-green-800',
  trial: 'bg-blue-100 text-blue-800',
  awaiting_proof: 'bg-yellow-100 text-yellow-800',
  pending_review: 'bg-amber-100 text-amber-800',
  inactive: 'bg-red-100 text-red-800',
}

const tabs = [
  { key: 'plans', label: 'Plans', icon: FiCreditCard },
  { key: 'billing', label: 'Invoices & history', icon: FiFileText },
  { key: 'payments', label: 'Payment history', icon: FiClock },
]

function planTotal(plan) {
  return plan?.pricing?.totalInclVat ?? plan?.price ?? 0
}

function planSymbol(plan) {
  return plan?.pricing?.currencySymbol || 'Rs.'
}

function statusLabel(currentPlan) {
  if (currentPlan?.hasPaidPlanActive) return 'active'
  if (currentPlan?.isTrialActive) return 'trial'
  if (currentPlan?.planRequestStatus) return currentPlan.planRequestStatus
  return 'inactive'
}

function MetricTile({ label, value, sub, icon: Icon, accent }) {
  return (
    <m.div whileHover={{ y: -3 }} className="rounded-2xl border border-surface-200 bg-white/90 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-gray-950">{value}</p>
          {sub && <p className="mt-1 text-xs text-gray-500">{sub}</p>}
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${accent} text-white shadow-md`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </m.div>
  )
}

function Notice({ tone = 'amber', icon: Icon = FiAlertTriangle, title, children }) {
  const styles = {
    amber: 'border-amber-200 bg-amber-50 text-amber-900',
    red: 'border-red-200 bg-red-50 text-red-900',
    blue: 'border-blue-200 bg-blue-50 text-blue-900',
    green: 'border-green-200 bg-green-50 text-green-900',
  }

  return (
    <m.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 rounded-2xl border px-4 py-3 text-sm ${styles[tone]}`}
    >
      <Icon className="mt-0.5 h-5 w-5 flex-shrink-0" />
      <div>
        <p className="font-semibold">{title}</p>
        <div className="mt-1 leading-6">{children}</div>
      </div>
    </m.div>
  )
}

function PlanCard({ plan, currentPlan, disabled, requesting, onSelect }) {
  const isCurrent = currentPlan?.currentPlan?._id === plan._id
  const isRequested =
    currentPlan?.requestedPlan?._id === plan._id &&
    ['awaiting_proof', 'pending_review'].includes(currentPlan?.planRequestStatus)

  return (
    <m.article
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6 }}
      className={`relative overflow-hidden rounded-3xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-xl ${
        plan.isPopular ? 'border-primary-500 ring-4 ring-primary-50' : 'border-surface-200'
      }`}
    >
      {plan.isPopular && (
        <div className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-primary-600 px-3 py-1 text-xs font-semibold text-white">
          <FiStar className="h-3.5 w-3.5" /> Popular
        </div>
      )}

      <div className="pr-20">
        <h3 className="text-xl font-semibold text-gray-950">{plan.name}</h3>
        <p className="mt-1 text-sm text-gray-500">{plan.durationLabel || 'Subscription plan'}</p>
      </div>

      <div className="mt-5 rounded-2xl bg-surface-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Grand total</p>
        <p className="mt-1 text-3xl font-semibold text-primary-700">
          {formatRestaurantCurrency(planTotal(plan), planSymbol(plan))}
        </p>
        {plan.pricing && (
          <div className="mt-3 space-y-1 text-sm text-gray-600">
            <p>Subtotal: {formatRestaurantCurrency(plan.pricing.priceExclVat, plan.pricing.currencySymbol)}</p>
            <p>VAT: {formatRestaurantCurrency(plan.pricing.vatAmount, plan.pricing.currencySymbol)}</p>
          </div>
        )}
      </div>

      <div className="mt-5 space-y-2">
        {(plan.features || []).slice(0, 6).map((feature) => (
          <div key={feature} className="flex items-center gap-2 text-sm">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-green-700">
              <FiCheck className="h-3.5 w-3.5" />
            </span>
            <span className="text-gray-600">{feature}</span>
          </div>
        ))}
      </div>

      <Button
        className="mt-6 w-full"
        variant={isCurrent ? 'secondary' : 'primary'}
        disabled={disabled || isCurrent || isRequested || requesting}
        onClick={() => onSelect(plan._id)}
      >
        {isCurrent ? 'Current Plan' : isRequested ? 'Payment Pending' : 'Choose Plan'}
      </Button>
    </m.article>
  )
}

function PaymentHistoryTable({ payments }) {
  if (!payments.length) {
    return (
      <div className="rounded-3xl border border-dashed border-surface-300 bg-white px-4 py-12 text-center">
        <FiCreditCard className="mx-auto h-8 w-8 text-surface-500" />
        <p className="mt-3 font-semibold text-gray-900">No subscription payments yet</p>
        <p className="mt-1 text-sm text-gray-500">Gateway and manual payment submissions will appear here after checkout starts.</p>
      </div>
    )
  }

  const styles = {
    pending: 'bg-yellow-100 text-yellow-800',
    paid: 'bg-blue-100 text-blue-800',
    pending_verification: 'bg-amber-100 text-amber-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    failed: 'bg-red-100 text-red-800',
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-surface-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-surface-200 text-sm">
        <thead className="bg-surface-50">
          <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
            <th className="px-5 py-3">Transaction ID</th>
            <th className="px-5 py-3">Plan</th>
            <th className="px-5 py-3">Method</th>
            <th className="px-5 py-3">Amount</th>
            <th className="px-5 py-3">Status</th>
            <th className="px-5 py-3">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-200">
          {payments.map((payment) => (
            <tr key={payment._id} className="hover:bg-surface-50/70">
              <td className="px-5 py-4 font-mono text-xs text-gray-700">{payment.transactionId}</td>
              <td className="px-5 py-4 font-medium text-gray-900">{payment.planId?.name || 'N/A'}</td>
              <td className="px-5 py-4 capitalize text-gray-600">{payment.paymentMethod}</td>
              <td className="px-5 py-4 text-gray-700">{formatRestaurantCurrency(payment.amount)}</td>
              <td className="px-5 py-4">
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${styles[payment.status] || 'bg-gray-100 text-gray-700'}`}>
                  {payment.status.replace(/_/g, ' ')}
                </span>
              </td>
              <td className="px-5 py-4 text-gray-600">{formatRestaurantDateTime(payment.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const Subscription = () => {
  const navigate = useNavigate()
  const { mergeUser, user: authUser } = useAuth()
  const [plans, setPlans] = useState([])
  const [currentPlan, setCurrentPlan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [requesting, setRequesting] = useState(false)
  const [proofFile, setProofFile] = useState(null)
  const [statementReferenceId, setStatementReferenceId] = useState('')
  const [uploadingProof, setUploadingProof] = useState(false)
  const [activeTab, setActiveTab] = useState('plans')
  const [payments, setPayments] = useState([])

  useEffect(() => {
    fetchData()
  }, [authUser?.id])

  useEffect(() => {
    const onAccessUpdated = () => fetchData(true)
    window.addEventListener('restaurant:access_updated', onAccessUpdated)
    return () => window.removeEventListener('restaurant:access_updated', onAccessUpdated)
  }, [authUser?.id])

  const fetchData = async (quiet = false) => {
    try {
      if (quiet) setRefreshing(true)
      else setLoading(true)
      const [plansRes, statusRes] = await Promise.all([
        api.get('/platform/subscriptions/plans'),
        api.get('/restaurant/package/status'),
      ])
      setPlans(plansRes.data.data || [])
      const status = statusRes.data.data
      setCurrentPlan(status)
      if (authUser?.role === 'restaurant') {
        mergeUser({
          trialEndsAt: status.trialEndsAt,
          hasPaidPlanActive: status.hasPaidPlanActive,
          needsPlanUpgrade: !status.canUseFeatures,
          planAssignmentSource: status.planAssignmentSource,
          customPlanLabel: status.customPlanLabel,
          planFeatureFlags: status.planFeatureFlags || {},
          planLimits: status.planLimits || {},
          assignedPlanName:
            status.planAssignmentSource === 'custom'
              ? status.customPlanLabel || 'Custom plan'
              : undefined,
        })
      }
      api.get('/restaurant/subscription/payments', { params: { limit: 20 } })
        .then((res) => setPayments(res.data.data?.payments || []))
        .catch(() => undefined)
    } catch {
      toast.error('Failed to fetch subscription data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const choosePlan = (planId) => {
    if (!authUser?.isKYCVerified) {
      toast.error('KYC verification is required before selecting a subscription plan.')
      return
    }
    const { slug, restaurantId } = getTenantSegments(authUser)
    navigate(`${restaurantPortalBase(slug, restaurantId)}/subscription/checkout/${planId}`)
  }

  const submitPaymentProof = async () => {
    if (!proofFile) {
      toast.error('Choose a file (image or PDF)')
      return
    }
    if (!statementReferenceId.trim()) {
      toast.error('Enter statement reference ID')
      return
    }
    try {
      setUploadingProof(true)
      const fd = new FormData()
      fd.append('paymentProof', proofFile)
      fd.append('statementReferenceId', statementReferenceId.trim())
      await api.post('/restaurant/package/payment-proof', fd)
      toast.success('Payment proof submitted for platform verification.')
      setProofFile(null)
      setStatementReferenceId('')
      fetchData(true)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Upload failed')
    } finally {
      setUploadingProof(false)
    }
  }

  const handleProofFileChange = (event) => {
    const file = event.target.files?.[0] || null
    if (file && file.size > FILE_MAX_BYTES) {
      toast.error('Payment proof must be less than 1 MB')
      event.target.value = ''
      setProofFile(null)
      return
    }
    setProofFile(file)
  }

  const toggleAutoRenew = async () => {
    try {
      await api.patch('/restaurant/package/auto-renew', { autoRenew: !currentPlan?.autoRenew })
      toast.success(`Auto-renew ${!currentPlan?.autoRenew ? 'enabled' : 'disabled'}`)
      fetchData(true)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update auto-renew')
    }
  }

  const subscriptionState = statusLabel(currentPlan)
  const awaitingProof = currentPlan?.planRequestStatus === 'awaiting_proof'
  const pendingReview = currentPlan?.planRequestStatus === 'pending_review'
  const isKYCVerified = authUser?.isKYCVerified === true
  const daysLeft = currentPlan?.daysLeft ?? 0
  const currentTotal = currentPlan?.currentPlan ? planTotal(currentPlan.currentPlan) : 0

  const bestPlan = useMemo(
    () => plans.find((plan) => plan.isPopular) || plans[0],
    [plans],
  )

  if (loading) return <RestaurantPageLoader />

  return (
    <LazyMotion features={domAnimation}>
    <div className="space-y-6">
      <m.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="relative overflow-hidden rounded-3xl border border-surface-200 bg-white shadow-sm"
      >
        <div className="absolute inset-x-0 top-0 h-44 bg-gradient-to-r from-primary-50 via-surface-50 to-emerald-50" />
        <div className="relative p-5 md:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary-100 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-700 shadow-sm">
                <FiCreditCard className="h-4 w-4" />
                Subscription Center
              </div>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-gray-950">Subscription & billing</h1>
              <p className="mt-2 max-w-3xl text-sm text-gray-500">
                Choose plans, upload payment proof, monitor verification, and review official billing history.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <RestaurantStatusPill value={subscriptionState} styles={requestStatusStyles} />
              <Button type="button" variant="secondary" onClick={() => fetchData(true)} disabled={refreshing}>
                <FiRefreshCw className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricTile
              label="Current plan"
              value={
                currentPlan?.planAssignmentSource === 'custom'
                  ? currentPlan?.customPlanLabel || 'Custom plan'
                  : currentPlan?.currentPlan?.name || (currentPlan?.isTrialActive ? 'Free trial' : 'No plan')
              }
              sub={
                currentPlan?.planAssignmentSource === 'custom'
                  ? `Assigned manually by super admin • Ends ${
                      currentPlan?.planEndDate ? formatRestaurantDateTime(currentPlan.planEndDate) : 'N/A'
                    }`
                  : currentPlan?.planEndDate
                    ? `Ends ${formatRestaurantDateTime(currentPlan.planEndDate)}`
                    : 'Select a plan to activate'
              }
              icon={FiShield}
              accent="from-primary-600 to-secondary-500"
            />
            <MetricTile
              label="Days left"
              value={currentPlan?.isTrialActive && !currentPlan?.hasPaidPlanActive ? currentPlan?.trialDaysLeft || 0 : daysLeft}
              sub={currentPlan?.isTrialActive && !currentPlan?.hasPaidPlanActive ? 'Trial remaining' : 'Subscription remaining'}
              icon={FiClock}
              accent="from-emerald-500 to-teal-500"
            />
            <MetricTile
              label="Billing total"
              value={currentPlan?.currentPlan ? formatRestaurantCurrency(currentTotal, planSymbol(currentPlan.currentPlan)) : '-'}
              sub="Including VAT"
              icon={FiCreditCard}
              accent="from-indigo-500 to-violet-500"
            />
            <MetricTile
              label="Recommended"
              value={bestPlan?.name || '-'}
              sub={bestPlan ? formatRestaurantCurrency(planTotal(bestPlan), planSymbol(bestPlan)) : 'No active plans'}
              icon={FiStar}
              accent="from-amber-500 to-orange-500"
            />
          </div>
        </div>
      </m.section>

      <div className="flex flex-wrap gap-2 rounded-2xl border border-surface-200 bg-white p-2 shadow-sm">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
              activeTab === tab.key ? 'bg-primary-600 text-white shadow-sm' : 'text-gray-600 hover:bg-surface-50'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'billing' ? (
          <m.div key="billing" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
            <SubscriptionBillingPanel />
          </m.div>
        ) : activeTab === 'payments' ? (
          <m.div key="payments" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
            <PaymentHistoryTable payments={payments} />
          </m.div>
        ) : (
          <m.div key="plans" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-6">
            {currentPlan?.planFeatureFlags && (
              <PlanFeaturesIncluded
                featureFlags={currentPlan.planFeatureFlags}
                planName={
                  currentPlan?.planAssignmentSource === 'custom'
                    ? currentPlan?.customPlanLabel || 'Custom plan'
                    : currentPlan?.currentPlan?.name || 'Your plan'
                }
              />
            )}
            {!isKYCVerified && (
              <Notice tone="blue" icon={FiShield} title="KYC verification required for subscriptions">
                You can use enabled trial features, but only KYC-verified restaurants can select or purchase a subscription plan.
              </Notice>
            )}
            {currentPlan?.planRequestRejectionReason && (
              <Notice tone="red" title="Previous request was rejected">
                {currentPlan.planRequestRejectionReason}
                <br />
                You can select a plan again and submit new payment proof.
              </Notice>
            )}

            {currentPlan?.isTrialActive && !currentPlan?.hasPaidPlanActive && (
              <Notice tone="green" icon={FiZap} title="Free trial active">
                <strong>{currentPlan.trialDaysLeft}</strong> day(s) remaining. Choose a paid plan before trial ends to keep full access.
              </Notice>
            )}

            {['pending', 'qualified'].includes(currentPlan?.referralBenefit?.status) && (
              <Notice tone="green" icon={FiGift} title="Referral benefit pending">
                {currentPlan.referralBenefit.message}
                {currentPlan.referralBenefit.role === 'referrer' && currentPlan.referralBenefit.referredRestaurantName ? (
                  <>
                    <br />
                    Referred restaurant: <strong>{currentPlan.referralBenefit.referredRestaurantName}</strong>
                  </>
                ) : null}
                {currentPlan.referralBenefit.role === 'referred' && currentPlan.referralBenefit.referrerRestaurantName ? (
                  <>
                    <br />
                    Referral from: <strong>{currentPlan.referralBenefit.referrerRestaurantName}</strong>
                  </>
                ) : null}
              </Notice>
            )}

            {!currentPlan?.canUseFeatures && (
              <Notice tone="red" title="Access paused">
                Select a plan, upload payment proof, and wait for platform approval to restore full access.
              </Notice>
            )}

            {(awaitingProof || pendingReview) && currentPlan?.requestedPlan && (
              <m.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                      <FiClock /> {pendingReview ? 'Pending Review' : 'Payment Proof Needed'}
                    </div>
                    <h2 className="mt-3 text-xl font-semibold text-gray-950">{currentPlan.requestedPlan.name}</h2>
                    {currentPlan.requestedPlan.pricing && (
                      <p className="mt-2 text-sm text-gray-600">
                        Pay{' '}
                        <strong>
                          {formatRestaurantCurrency(
                            currentPlan.requestedPlan.pricing.totalInclVat,
                            currentPlan.requestedPlan.pricing.currencySymbol,
                          )}
                        </strong>{' '}
                        including VAT.
                      </p>
                    )}
                    {!!currentPlan?.manualPaymentDetails?.accountNumber && (
                      <div className="mt-4 rounded-2xl border border-amber-200 bg-white p-4 text-sm text-gray-700">
                        <p className="font-semibold text-gray-900">Manual payment account details</p>
                        <p className="mt-2"><strong>Account name:</strong> {currentPlan.manualPaymentDetails.accountName || '-'}</p>
                        <p><strong>Account number:</strong> {currentPlan.manualPaymentDetails.accountNumber || '-'}</p>
                        <p><strong>Branch:</strong> {currentPlan.manualPaymentDetails.branch || '-'}</p>
                        {currentPlan.manualPaymentDetails.notes ? (
                          <p className="mt-1 text-xs text-gray-500">{currentPlan.manualPaymentDetails.notes}</p>
                        ) : null}
                        {currentPlan.manualPaymentDetails.qrCodeImage ? (
                          <a
                            href={currentPlan.manualPaymentDetails.qrCodeImage}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-block text-primary-700 underline"
                          >
                            View payment QR code
                          </a>
                        ) : null}
                      </div>
                    )}
                  </div>
                  {!pendingReview && (
                    <div className="rounded-2xl border border-amber-200 bg-white p-4">
                      <label htmlFor="statement-reference-id" className="block text-sm font-semibold text-gray-700">Statement reference ID</label>
                      <input
                        id="statement-reference-id"
                        type="text"
                        value={statementReferenceId}
                        onChange={(e) => setStatementReferenceId(e.target.value)}
                        placeholder="Enter bank/app statement reference"
                        className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      />
                      <label htmlFor="statement-proof-file" className="mt-3 block text-sm font-semibold text-gray-700">Statement screenshot / proof</label>
                      <input
                        id="statement-proof-file"
                        type="file"
                        accept="image/*,.pdf"
                        className="mt-2 text-sm"
                        onChange={handleProofFileChange}
                      />
                      <p className="mt-1 text-xs text-gray-500">JPG, PNG, WEBP, GIF or PDF. Max 1 MB.</p>
                      <Button className="mt-3 w-full" onClick={submitPaymentProof} loading={uploadingProof} disabled={!proofFile || !statementReferenceId.trim()}>
                        <FiUpload className="mr-2" />
                        Submit for verification
                      </Button>
                    </div>
                  )}
                </div>
                {currentPlan?.planPaymentProofUrl && (
                  <p className="mt-4 text-xs text-gray-500">
                    Proof on file:{' '}
                    <a href={currentPlan.planPaymentProofUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary-600 underline">
                      View uploaded file
                    </a>
                  </p>
                )}
                {currentPlan?.planPaymentReferenceId && (
                  <p className="mt-2 text-xs text-gray-500">
                    Statement reference: <span className="font-semibold text-gray-700">{currentPlan.planPaymentReferenceId}</span>
                  </p>
                )}
              </m.section>
            )}

            {(currentPlan?.currentPlan || currentPlan?.planAssignmentSource === 'custom') && (
              <m.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-3xl border border-surface-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Current plan</p>
                    <h2 className="mt-1 text-2xl font-semibold text-primary-700">
                      {currentPlan?.planAssignmentSource === 'custom'
                        ? currentPlan?.customPlanLabel || 'Custom plan'
                        : currentPlan?.currentPlan?.name}
                    </h2>
                    <p className="mt-2 text-sm text-gray-500">
                      Expires {currentPlan.planEndDate ? formatRestaurantDateTime(currentPlan.planEndDate) : 'N/A'} - {daysLeft} days left
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    {currentPlan?.planAssignmentSource === 'custom' && (
                      <RestaurantStatusPill value="manual custom" styles={{
                        'manual custom': 'bg-amber-100 text-amber-800',
                      }} />
                    )}
                    <RestaurantStatusPill value={currentPlan.autoRenew ? 'auto-renew on' : 'auto-renew off'} styles={{
                      'auto-renew on': 'bg-green-100 text-green-800',
                      'auto-renew off': 'bg-gray-100 text-gray-700',
                    }} />
                    <Button type="button" variant="secondary" onClick={toggleAutoRenew}>
                      {currentPlan.autoRenew ? 'Disable auto-renew' : 'Enable auto-renew'}
                    </Button>
                  </div>
                </div>
              </m.section>
            )}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {plans.map((plan) => (
                <PlanCard
                  key={plan._id}
                  plan={plan}
                  currentPlan={currentPlan}
                  disabled={!isKYCVerified}
                  requesting={requesting}
                  onSelect={choosePlan}
                />
              ))}
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
    </LazyMotion>
  )
}

export default Subscription
