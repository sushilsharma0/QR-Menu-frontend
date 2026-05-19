import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { FiLock, FiSettings } from 'react-icons/fi'
import toast from '@utils/toast'
import api from '../../services/api'
import { DEFAULT_CURRENCY_CODE, DEFAULT_CURRENCY_SYMBOL } from '../../utils/currency'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Tabs from '../../components/common/Tabs'
import { PlatformPageHeader } from '../../components/platform/PlatformUI'
import { useAuth } from '../../hooks/useAuth'

const IMAGE_MAX_BYTES = 1 * 1024 * 1024

const Settings = () => {
  const { user } = useAuth()
  const isSuperAdmin = user?.role === 'super_admin'
  const [loading, setLoading] = useState(false)
  const [billingLoading, setBillingLoading] = useState(true)
  const [billingSaving, setBillingSaving] = useState(false)
  const [manualPaymentLoading, setManualPaymentLoading] = useState(true)
  const [manualPaymentSaving, setManualPaymentSaving] = useState(false)
  const [manualQrFile, setManualQrFile] = useState(null)
  const [manualQrPreview, setManualQrPreview] = useState('')
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
    return () => {
      cancelled = true
    }
  }, [resetBilling])

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
    return () => {
      cancelled = true
    }
  }, [resetManual])

  const onSubmit = async (data) => {
    try {
      setLoading(true)
      await api.post('/platform/auth/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
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

  const handleManualQrFileChange = (event) => {
    const file = event.target.files?.[0] || null
    if (file && file.size > IMAGE_MAX_BYTES) {
      toast.error('QR code image must be less than 1 MB')
      event.target.value = ''
      setManualQrFile(null)
      return
    }
    setManualQrFile(file)
  }

  const financeTabContent = (
    <div className="space-y-10">
      {isSuperAdmin && (
        <div>
          <h3 className="mb-2 text-sm font-black text-gray-900 dark:text-gray-100">Manual subscription payments</h3>
          <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            Bank / wallet details and QR shown to restaurants for manual subscription top-ups.
          </p>
          {manualPaymentLoading ? (
            <div className="flex justify-center py-10">
              <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary-600" />
            </div>
          ) : (
            <form onSubmit={handleManualSubmit(onManualPaymentSave)} className="max-w-2xl space-y-4">
              <Input label="Account name" {...registerManual('accountName', { required: 'Required' })} error={manualErrors.accountName?.message} />
              <Input label="Account number" {...registerManual('accountNumber', { required: 'Required' })} error={manualErrors.accountNumber?.message} />
              <Input label="Branch" {...registerManual('branch', { required: 'Required' })} error={manualErrors.branch?.message} />
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Notes (optional)</label>
                <textarea
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-900"
                  {...registerManual('notes')}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">QR code image</label>
                <input type="file" accept="image/*" className="text-sm" onChange={handleManualQrFileChange} />
                <p className="mt-1 text-xs text-gray-500">Square QR image, recommended 800×800 px. Max 1 MB.</p>
                {manualQrPreview ? (
                  <a href={manualQrPreview} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm text-primary-600 underline dark:text-primary-400">
                    View current QR
                  </a>
                ) : (
                  <p className="mt-2 text-xs text-gray-500">No QR uploaded yet.</p>
                )}
              </div>
              <Button type="submit" loading={manualPaymentSaving}>
                Save manual payment details
              </Button>
            </form>
          )}
        </div>
      )}

      <div className={isSuperAdmin ? 'border-t border-gray-200 pt-10 dark:border-gray-800' : ''}>
        <h3 className="mb-2 text-sm font-black text-gray-900 dark:text-gray-100">Billing &amp; VAT (invoices)</h3>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          Legal issuer identity, VAT rate, and currency used on subscription invoices and plan pricing previews.
        </p>
        {billingLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary-600" />
          </div>
        ) : (
          <form onSubmit={handleBillingSubmit(onBillingSave)} className="max-w-2xl space-y-4">
            <Input label="Legal company name (issuer)" {...registerBilling('companyLegalName')} error={billingErrors.companyLegalName?.message} />
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Company address</label>
              <textarea
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-900"
                rows={3}
                {...registerBilling('companyAddress')}
              />
            </div>
            <Input label="Tax ID label (e.g. VAT / TRN)" {...registerBilling('taxIdLabel')} />
            <Input label="Company tax registration number" {...registerBilling('companyTaxId')} />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="Invoice number prefix" {...registerBilling('invoicePrefix', { required: 'Required' })} error={billingErrors.invoicePrefix?.message} />
              <Input label="VAT rate %" type="number" step="0.01" {...registerBilling('vatRatePercent', { required: 'Required' })} error={billingErrors.vatRatePercent?.message} />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="Currency code (ISO)" {...registerBilling('currencyCode')} />
              <Input label="Currency symbol" {...registerBilling('currencySymbol')} />
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input type="checkbox" {...registerBilling('pricesAreVatInclusive')} className="rounded border-gray-300 dark:border-gray-700" />
              Plan prices include VAT (inclusive pricing)
            </label>
            <Button type="submit" loading={billingSaving}>
              Save billing settings
            </Button>
          </form>
        )}
      </div>
    </div>
  )

  const accountTabContent = (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-md space-y-4">
      <Input label="Current password" type="password" {...register('currentPassword', { required: 'Required' })} error={errors.currentPassword?.message} />
      <Input label="New password" type="password" {...register('newPassword', { required: 'Required', minLength: 8 })} error={errors.newPassword?.message} />
      <Input
        label="Confirm password"
        type="password"
        {...register('confirmPassword', {
          required: 'Confirm your password',
          validate: (value, formValues) => value === formValues.newPassword || 'Passwords do not match',
        })}
        error={errors.confirmPassword?.message}
      />
      <Button type="submit" loading={loading}>
        Update password
      </Button>
    </form>
  )

  const settingsTabs = [
    { key: 'finance', label: 'Finance & billing', content: financeTabContent },
    { key: 'account', label: 'Your account', content: accountTabContent },
  ]

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PlatformPageHeader
        badge="Platform"
        title="Settings"
        description="Billing, manual payments, and your admin password. Landing page and CMS live under Content → Website content."
        icon={FiSettings}
      />

      <div className="rounded-xl border border-primary-200 bg-primary-50/80 p-4 text-sm text-primary-950 dark:border-primary-900/50 dark:bg-primary-950/30 dark:text-primary-100">
        <p className="font-bold">Public site &amp; landing content</p>
        <p className="mt-1">
          Branding, hero overrides, offer banners, blog posts, and feature cards are managed in{' '}
          <Link to="/platform/cms?tab=public" className="font-semibold underline">
            Content → Website content
          </Link>
          .
        </p>
      </div>

      <Card title="Platform configuration" icon={FiLock}>
        <Tabs tabs={settingsTabs} defaultTab="finance" />
      </Card>
    </div>
  )
}

export default Settings
