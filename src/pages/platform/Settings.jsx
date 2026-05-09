import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { FiCreditCard, FiLock, FiMessageSquare, FiSettings, FiShield } from 'react-icons/fi'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { DEFAULT_CURRENCY_CODE, DEFAULT_CURRENCY_SYMBOL } from '../../utils/currency'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import { PlatformMetric, PlatformPageHeader } from '../../components/platform/PlatformUI'

const Settings = () => {
  const [loading, setLoading] = useState(false)
  const [billingLoading, setBillingLoading] = useState(true)
  const [billingSaving, setBillingSaving] = useState(false)
  const [manualPaymentLoading, setManualPaymentLoading] = useState(true)
  const [manualPaymentSaving, setManualPaymentSaving] = useState(false)
  const [manualQrFile, setManualQrFile] = useState(null)
  const [manualQrPreview, setManualQrPreview] = useState('')
  const [siteSaving, setSiteSaving] = useState(false)
  const [feedbackEnabled, setFeedbackEnabled] = useState(true)
  const [showFeedbackOnLanding, setShowFeedbackOnLanding] = useState(true)
  const [feedbackSummary, setFeedbackSummary] = useState(null)
  const { register, handleSubmit, formState: { errors } } = useForm()
  const {
    register: registerBilling,
    handleSubmit: handleBillingSubmit,
    reset: resetBilling,
    formState: { errors: billingErrors },
  } = useForm()
  const {
    register: registerManual,
    handleSubmit: handleManualSubmit,
    reset: resetManual,
    formState: { errors: manualErrors },
  } = useForm()

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setBillingLoading(true)
        const res = await api.get('/platform/billing/settings')
        const s = res.data.data
        if (!cancelled && s) {
          resetBilling({
            companyLegalName: s.companyLegalName || '',
            companyAddress: s.companyAddress || '',
            taxIdLabel: s.taxIdLabel || 'Tax ID / VAT',
            companyTaxId: s.companyTaxId || '',
            invoicePrefix: s.invoicePrefix || 'INV',
            vatRatePercent: s.vatRatePercent ?? 13,
            pricesAreVatInclusive: s.pricesAreVatInclusive !== false,
            currencyCode: s.currencyCode || DEFAULT_CURRENCY_CODE,
            currencySymbol: s.currencySymbol || DEFAULT_CURRENCY_SYMBOL,
          })
        }
      } catch (e) {
        toast.error(e.response?.data?.message || 'Failed to load billing settings')
      } finally {
        if (!cancelled) setBillingLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [resetBilling])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await api.get('/platform/settings/site')
        const data = res.data?.data
        if (!cancelled && data) {
          setFeedbackEnabled(data.feedbackEnabled !== false)
          setShowFeedbackOnLanding(data.showFeedbackOnLanding !== false)
          setFeedbackSummary(data.feedbackSummary || null)
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to load site settings')
      }
    })()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setManualPaymentLoading(true)
        const res = await api.get('/platform/settings/manual-payment')
        const data = res.data?.data
        if (!cancelled && data) {
          resetManual({
            accountName: data.accountName || '',
            accountNumber: data.accountNumber || '',
            branch: data.branch || '',
            notes: data.notes || '',
          })
          setManualQrPreview(data.qrCodeImage || '')
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to load manual payment settings')
      } finally {
        if (!cancelled) setManualPaymentLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [resetManual])

  const onSubmit = async (data) => {
    try {
      setLoading(true)
      await api.post('/platform/auth/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      })
      toast.success('Password changed successfully')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password')
    } finally {
      setLoading(false)
    }
  }

  const onBillingSave = async (data) => {
    try {
      setBillingSaving(true)
      await api.patch('/platform/billing/settings', {
        companyLegalName: data.companyLegalName,
        companyAddress: data.companyAddress,
        taxIdLabel: data.taxIdLabel,
        companyTaxId: data.companyTaxId,
        invoicePrefix: data.invoicePrefix,
        vatRatePercent: Number(data.vatRatePercent),
        pricesAreVatInclusive: Boolean(data.pricesAreVatInclusive),
        currencyCode: data.currencyCode,
        currencySymbol: data.currencySymbol,
      })
      toast.success('Billing settings saved')
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to save billing settings')
    } finally {
      setBillingSaving(false)
    }
  }

  const saveSiteSettings = async () => {
    try {
      setSiteSaving(true)
      const res = await api.patch('/platform/settings/site', {
        feedbackEnabled,
        showFeedbackOnLanding,
      })
      setFeedbackEnabled(res.data?.data?.feedbackEnabled !== false)
      setShowFeedbackOnLanding(res.data?.data?.showFeedbackOnLanding !== false)
      toast.success('Feedback controls saved')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save feedback controls')
    } finally {
      setSiteSaving(false)
    }
  }

  const onManualPaymentSave = async (data) => {
    try {
      setManualPaymentSaving(true)
      const fd = new FormData()
      fd.append('accountName', data.accountName || '')
      fd.append('accountNumber', data.accountNumber || '')
      fd.append('branch', data.branch || '')
      fd.append('notes', data.notes || '')
      if (manualQrFile) fd.append('qrCodeImage', manualQrFile)

      const res = await api.patch('/platform/settings/manual-payment', fd)
      const saved = res.data?.data
      setManualQrPreview(saved?.qrCodeImage || '')
      setManualQrFile(null)
      toast.success('Manual payment settings saved')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save manual payment settings')
    } finally {
      setManualPaymentSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PlatformPageHeader
        badge="Platform Controls"
        title="Settings"
        description="Manage account security and platform billing details used on subscription invoices."
        icon={FiSettings}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <PlatformMetric label="Security" value="Password" sub="Admin credential updates" icon={FiLock} accent="from-blue-500 to-indigo-500" />
        <PlatformMetric label="Billing issuer" value="VAT" sub="Invoice identity and tax" icon={FiCreditCard} accent="from-emerald-500 to-teal-500" />
        <PlatformMetric label="Feedback" value={feedbackSummary?.total ?? 0} sub="Customer responses" icon={FiMessageSquare} accent="from-primary-500 to-secondary-500" />
      </div>

      <Card title="Customer Feedback Controls" icon={FiMessageSquare}>
        <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Feedback</p>
              <p className="mt-2 text-2xl font-black text-gray-950 dark:text-gray-100">{feedbackSummary?.total ?? 0}</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Public</p>
              <p className="mt-2 text-2xl font-black text-gray-950 dark:text-gray-100">{feedbackSummary?.publicCount ?? 0}</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-500">System rating</p>
              <p className="mt-2 text-2xl font-black text-gray-950 dark:text-gray-100">{feedbackSummary?.averageSystemRating || 0}/5</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl bg-primary-50 p-4 text-primary-800 dark:bg-gray-800 dark:text-primary-200">
              <p className="text-sm font-semibold">
                Platform admin controls whether customer portals can ask feedback and whether public positive feedback appears on the QR Restro Nepal landing page.
              </p>
            </div>
            <label className="flex items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-gray-100">Enable customer feedback</p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Customers can answer feedback questions after paid orders.</p>
              </div>
              <button
                type="button"
                onClick={() => setFeedbackEnabled((current) => !current)}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${feedbackEnabled ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-700'}`}
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${feedbackEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </label>
            <label className="flex items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-gray-100">Show feedback on landing page</p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Landing page can render public, high-rated customer feedback with restaurant logos.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowFeedbackOnLanding((current) => !current)}
                disabled={!feedbackEnabled}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors disabled:opacity-50 ${showFeedbackOnLanding && feedbackEnabled ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-700'}`}
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${showFeedbackOnLanding && feedbackEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </label>
            <Button type="button" loading={siteSaving} onClick={saveSiteSettings}>Save feedback controls</Button>
          </div>
        </div>
      </Card>

      <Card title="Manual Subscription Payment Account" icon={FiCreditCard}>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">
          Super admin can configure account details used for manual subscription payments. Restaurants will see these details,
          scan the QR, and submit statement screenshot with statement reference ID.
        </p>
        {manualPaymentLoading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
          </div>
        ) : (
          <form onSubmit={handleManualSubmit(onManualPaymentSave)} className="space-y-4">
            <Input
              label="Account Name"
              {...registerManual('accountName', { required: 'Account name is required' })}
              error={manualErrors.accountName?.message}
            />
            <Input
              label="Account Number"
              {...registerManual('accountNumber', { required: 'Account number is required' })}
              error={manualErrors.accountNumber?.message}
            />
            <Input
              label="Branch"
              {...registerManual('branch', { required: 'Branch is required' })}
              error={manualErrors.branch?.message}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes (optional)</label>
              <textarea
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                {...registerManual('notes')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">QR Code Image</label>
              <input
                type="file"
                accept="image/*"
                className="text-sm"
                onChange={(e) => setManualQrFile(e.target.files?.[0] || null)}
              />
              {manualQrPreview ? (
                <a href={manualQrPreview} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm text-primary-700 underline">
                  View current QR code
                </a>
              ) : (
                <p className="mt-2 text-xs text-gray-500">No QR uploaded yet.</p>
              )}
            </div>
            <Button type="submit" loading={manualPaymentSaving}>Save account details</Button>
          </form>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <Card title="Change Password" icon={FiLock}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Current Password"
            type="password"
            {...register('currentPassword', { required: 'Current password is required' })}
            error={errors.currentPassword?.message}
          />
          <Input
            label="New Password"
            type="password"
            {...register('newPassword', { required: 'New password is required', minLength: 8 })}
            error={errors.newPassword?.message}
          />
          <Input
            label="Confirm Password"
            type="password"
            {...register('confirmPassword', {
              required: 'Please confirm your password',
              validate: (value, formValues) => value === formValues.newPassword || 'Passwords do not match'
            })}
            error={errors.confirmPassword?.message}
          />
          <Button type="submit" loading={loading}>Update Password</Button>
        </form>
      </Card>

      <Card title="Billing & VAT" icon={FiCreditCard}>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          VAT rate and currency here are used when admins create plans (base amount is ex-VAT; grand total is computed automatically)
          and on subscription tax invoices. Legacy invoices without a stored plan base may still use the “inclusive / exclusive”
          switch below for splitting totals.
        </p>
        {billingLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
          </div>
        ) : (
          <form onSubmit={handleBillingSubmit(onBillingSave)} className="space-y-4">
            <Input
              label="Legal company name (issuer)"
              {...registerBilling('companyLegalName')}
              error={billingErrors.companyLegalName?.message}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company address</label>
              <textarea
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                rows={3}
                {...registerBilling('companyAddress')}
              />
            </div>
            <Input
              label="Tax ID label (e.g. VAT / TRN)"
              {...registerBilling('taxIdLabel')}
            />
            <Input
              label="Company tax registration number"
              {...registerBilling('companyTaxId')}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Invoice number prefix"
                {...registerBilling('invoicePrefix', { required: 'Required' })}
                error={billingErrors.invoicePrefix?.message}
              />
              <Input
                label="VAT rate %"
                type="number"
                step="0.01"
                {...registerBilling('vatRatePercent', { required: 'Required' })}
                error={billingErrors.vatRatePercent?.message}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Currency code (ISO)"
                {...registerBilling('currencyCode')}
              />
              <Input
                label="Currency symbol"
                {...registerBilling('currencySymbol')}
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input type="checkbox" {...registerBilling('pricesAreVatInclusive')} className="rounded border-gray-300 dark:border-gray-700" />
              Plan prices include VAT (inclusive pricing)
            </label>
            <Button type="submit" loading={billingSaving}>Save billing settings</Button>
          </form>
        )}
      </Card>
      </div>
    </div>
  )
}

export default Settings
