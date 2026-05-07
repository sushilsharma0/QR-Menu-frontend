import React, { useState, useEffect } from 'react'
import { FiCheck, FiClock, FiCalendar, FiUpload, FiAlertTriangle } from 'react-icons/fi'
import toast from 'react-hot-toast'
import api from '../../services/api'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Tabs from '../../components/common/Tabs'
import { useAuth } from '../../hooks/useAuth'
import SubscriptionBillingPanel from './SubscriptionBillingPanel'
import { DEFAULT_CURRENCY_SYMBOL } from '../../utils/currency'

const Subscription = () => {
  const { mergeUser, user: authUser } = useAuth()
  const [plans, setPlans] = useState([])
  const [currentPlan, setCurrentPlan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [requesting, setRequesting] = useState(false)
  const [proofFile, setProofFile] = useState(null)
  const [uploadingProof, setUploadingProof] = useState(false)

  useEffect(() => {
    fetchData()
  }, [authUser?.id])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [plansRes, statusRes] = await Promise.all([
        api.get('/platform/subscriptions/plans'),
        api.get('/restaurant/package/status'),
      ])
      setPlans(plansRes.data.data)
      const status = statusRes.data.data
      setCurrentPlan(status)
      if (authUser?.role === 'restaurant') {
        mergeUser({
          trialEndsAt: status.trialEndsAt,
          hasPaidPlanActive: status.hasPaidPlanActive,
          needsPlanUpgrade: !status.canUseFeatures,
        })
      }
    } catch (error) {
      toast.error('Failed to fetch subscription data')
    } finally {
      setLoading(false)
    }
  }

  const requestPlan = async (planId) => {
    if (!authUser?.isKYCVerified) {
      toast.error('You must complete KYC verification before selecting a subscription plan.')
      return
    }

    try {
      setRequesting(true)
      await api.post('/restaurant/package/request', { packageId: planId })
      toast.success('Plan selected. Upload your payment proof below for platform verification.')
      fetchData()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Request failed')
    } finally {
      setRequesting(false)
    }
  }

  const submitPaymentProof = async () => {
    if (!proofFile) {
      toast.error('Choose a file (image or PDF)')
      return
    }
    try {
      setUploadingProof(true)
      const fd = new FormData()
      fd.append('paymentProof', proofFile)
      await api.post('/restaurant/package/payment-proof', fd)
      toast.success('Payment proof submitted. Your request is pending platform approval.')
      setProofFile(null)
      fetchData()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Upload failed')
    } finally {
      setUploadingProof(false)
    }
  }

  const getDaysLeft = () => {
    if (!currentPlan?.planEndDate) return 0
    const days = Math.ceil((new Date(currentPlan.planEndDate) - new Date()) / (1000 * 60 * 60 * 24))
    return days > 0 ? days : 0
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const awaitingProof = currentPlan?.planRequestStatus === 'awaiting_proof'
  const pendingReview = currentPlan?.planRequestStatus === 'pending_review'
  const isKYCVerified = authUser?.isKYCVerified === true

  const plansTab = (
    <div className="space-y-6">
      {!isKYCVerified && (
        <Card title="KYC verification required" className="bg-green-200">
          <p className="text-gray-700">
            Subscription plan selection is locked until your KYC is approved by the platform. Complete KYC verification first, then you can choose a plan.
          </p>
        </Card>
      )}

      {currentPlan?.planRequestRejectionReason && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900 flex gap-2 items-start">
          <FiAlertTriangle className="h-5 w-5 flex-shrink-0" />
          <div>
            <p className="font-medium">Previous request was rejected</p>
            <p className="mt-1">{currentPlan.planRequestRejectionReason}</p>
            <p className="mt-2 text-red-800">You can select a plan again and submit new payment proof.</p>
          </div>
        </div>
      )}

      {currentPlan?.isTrialActive && !currentPlan?.hasPaidPlanActive && (
        <Card title="Free trial">
          <p className="text-gray-700">
            <strong>{currentPlan.trialDaysLeft}</strong> day(s) remaining on your trial. After it ends, choose a paid plan
            and submit payment proof — platform approval is required to restore full access.
          </p>
        </Card>
      )}

      {!currentPlan?.canUseFeatures && (
        <Card title="Access paused">
          <p className="text-gray-700">
            Your trial has ended or your subscription is inactive. Select a plan below, upload payment proof, and wait for
            the platform team to approve your subscription.
          </p>
        </Card>
      )}

      {(awaitingProof || pendingReview) && currentPlan?.requestedPlan && (
        <Card title={awaitingProof ? 'Upload payment proof' : 'Request status'}>
          {pendingReview ? (
            <p className="text-amber-800 text-sm flex items-center gap-2">
              <FiClock />
              <span>
                Pending platform verification for <strong>{currentPlan.requestedPlan.name}</strong>
                {currentPlan.requestedPlan.pricing && (
                  <>
                    {' '}
                    ({currentPlan.requestedPlan.pricing.currencySymbol}
                    {Number(currentPlan.requestedPlan.pricing.totalInclVat).toFixed(2)} incl. VAT:{' '}
                    {currentPlan.requestedPlan.pricing.currencySymbol}
                    {Number(currentPlan.requestedPlan.pricing.priceExclVat).toFixed(2)} +{' '}
                    {currentPlan.requestedPlan.pricing.currencySymbol}
                    {Number(currentPlan.requestedPlan.pricing.vatAmount).toFixed(2)} VAT)
                  </>
                )}
                . You’ll get full access once approved.
              </span>
            </p>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-700">
                You chose <strong>{currentPlan.requestedPlan.name}</strong>
                {currentPlan.requestedPlan.pricing && (
                  <span className="block mt-2 text-sm">
                    Subtotal (excl. VAT): {currentPlan.requestedPlan.pricing.currencySymbol}
                    {Number(currentPlan.requestedPlan.pricing.priceExclVat).toFixed(2)} · VAT:{' '}
                    {currentPlan.requestedPlan.pricing.currencySymbol}
                    {Number(currentPlan.requestedPlan.pricing.vatAmount).toFixed(2)} ·{' '}
                    <strong>
                      Pay {currentPlan.requestedPlan.pricing.currencySymbol}
                      {Number(currentPlan.requestedPlan.pricing.totalInclVat).toFixed(2)} incl. VAT
                    </strong>
                  </span>
                )}
                . Upload a screenshot or PDF of your payment / bank transfer statement so we can verify and activate your plan.
              </p>
              <div className="flex flex-wrap items-end gap-3">
                <label className="block">
                  <span className="text-sm text-gray-600 block mb-1">Payment statement</span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="text-sm"
                    onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                  />
                </label>
                <Button onClick={submitPaymentProof} loading={uploadingProof} disabled={!proofFile}>
                  <FiUpload className="inline mr-2" />
                  Submit for verification
                </Button>
              </div>
            </div>
          )}
          {currentPlan?.planPaymentProofUrl && (
            <p className="mt-3 text-xs text-gray-500">
              Proof on file:{' '}
              <a href={currentPlan.planPaymentProofUrl} target="_blank" rel="noopener noreferrer" className="text-primary-600 underline">
                View uploaded file
              </a>
            </p>
          )}
        </Card>
      )}

      {currentPlan?.currentPlan && (
        <Card title="Current Plan">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h3 className="text-xl font-bold text-primary-600">{currentPlan.currentPlan.name}</h3>
              {currentPlan.currentPlan.pricing && (
                <div className="mt-2 text-sm text-gray-600 space-y-0.5">
                  <p>
                    Subtotal (excl. VAT):{' '}
                    <span className="font-medium text-gray-900">
                      {currentPlan.currentPlan.pricing.currencySymbol}
                      {Number(currentPlan.currentPlan.pricing.priceExclVat).toFixed(2)}
                    </span>
                  </p>
                  <p>
                    VAT ({Number(currentPlan.currentPlan.pricing.vatRatePercent).toFixed(2)}%):{' '}
                    <span className="font-medium text-gray-900">
                      {currentPlan.currentPlan.pricing.currencySymbol}
                      {Number(currentPlan.currentPlan.pricing.vatAmount).toFixed(2)}
                    </span>
                  </p>
                  <p className="text-gray-900 font-semibold">
                    Billing total (incl. VAT):{' '}
                    {currentPlan.currentPlan.pricing.currencySymbol}
                    {Number(currentPlan.currentPlan.pricing.totalInclVat).toFixed(2)}
                  </p>
                </div>
              )}
              <div className="flex items-center gap-4 mt-2">
                <span className="flex items-center gap-1 text-sm text-gray-600">
                  <FiCalendar /> Expires: {new Date(currentPlan.planEndDate).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1 text-sm text-gray-600">
                  <FiClock /> {getDaysLeft()} days left
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Auto-renew</p>
              <span className={`px-2 py-1 text-xs rounded-full ${currentPlan.autoRenew ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {currentPlan.autoRenew ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card key={plan._id} className={`${plan.isPopular ? 'border-2 border-primary-500 relative' : ''}`}>
            {plan.isPopular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary-600 text-white px-3 py-1 rounded-full text-xs">
                Most Popular
              </div>
            )}
            <div className="text-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
              <p className="text-sm text-gray-500">{plan.durationLabel}</p>
              {plan.pricing ? (
                <div className="mt-3 text-sm text-gray-600 space-y-1 text-left">
                  <p>
                    Subtotal (excl. VAT):{' '}
                    <span className="font-medium text-gray-900">
                      {plan.pricing.currencySymbol}{Number(plan.pricing.priceExclVat).toFixed(2)}
                    </span>
                  </p>
                  <p>
                    VAT ({Number(plan.pricing.vatRatePercent).toFixed(2)}%):{' '}
                    <span className="font-medium text-gray-900">
                      {plan.pricing.currencySymbol}{Number(plan.pricing.vatAmount).toFixed(2)}
                    </span>
                  </p>
                  <p className="text-2xl font-bold text-primary-600 pt-2 border-t border-gray-100">
                    {plan.pricing.currencySymbol}{Number(plan.pricing.totalInclVat).toFixed(2)}
                    <span className="block text-xs font-normal text-gray-500">Grand total (incl. VAT)</span>
                  </p>
                </div>
              ) : (
                <p className="text-3xl font-bold text-primary-600 mt-2">
                  {DEFAULT_CURRENCY_SYMBOL}{Number(plan.price).toFixed(2)}
                </p>
              )}
            </div>
            <div className="space-y-2 mb-6">
              {plan.features?.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  <FiCheck className="text-green-500 flex-shrink-0" />
                  <span className="text-gray-600">{feature}</span>
                </div>
              ))}
            </div>
            <Button
              className="w-full"
              variant={currentPlan?.currentPlan?._id === plan._id ? 'secondary' : 'primary'}
              disabled={
                !isKYCVerified ||
                currentPlan?.currentPlan?._id === plan._id ||
                (currentPlan?.requestedPlan?._id === plan._id && (awaitingProof || pendingReview)) ||
                requesting
              }
              onClick={() => requestPlan(plan._id)}
            >
              {currentPlan?.currentPlan?._id === plan._id
                ? 'Current Plan'
                : currentPlan?.requestedPlan?._id === plan._id && (awaitingProof || pendingReview)
                  ? 'Already requested'
                  : 'Select plan'}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Subscription & billing</h1>
        <p className="text-gray-500 mt-1">
          Choose a plan and payment proof on the Plans tab; view official invoices and package history under Invoices &amp; history.
        </p>
      </div>

      <Tabs
        defaultTab="plans"
        tabs={[
          { key: 'plans', label: 'Plans', content: plansTab },
          { key: 'billing', label: 'Invoices & history', content: <SubscriptionBillingPanel /> },
        ]}
      />
    </div>
  )
}

export default Subscription
