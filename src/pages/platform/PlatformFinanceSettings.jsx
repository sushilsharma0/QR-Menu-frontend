import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { FiDollarSign } from 'react-icons/fi'
import toast from '@utils/toast'
import api from '../../services/api'
import { DEFAULT_CURRENCY_CODE, DEFAULT_CURRENCY_SYMBOL } from '../../utils/currency'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import { PlatformPageHeader } from '../../components/platform/PlatformUI'
import { usePlatformAccess } from '../../hooks/usePlatformAccess'
import { PlatformAccessDenied } from '../../components/platform/PlatformPermissionGate'

const IMAGE_MAX_BYTES = 1 * 1024 * 1024

const PlatformFinanceSettings = () => {
  const { isSuperAdmin, hasPermission } = usePlatformAccess()
  const canBilling = hasPermission('managePlatformBillingSettings')
  const canManual = isSuperAdmin

  const [billingLoading, setBillingLoading] = useState(true)
  const [billingSaving, setBillingSaving] = useState(false)
  const [manualPaymentLoading, setManualPaymentLoading] = useState(true)
  const [manualPaymentSaving, setManualPaymentSaving] = useState(false)
  const [manualQrFile, setManualQrFile] = useState(null)
  const [manualQrPreview, setManualQrPreview] = useState('')

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
    if (!canBilling) {
      setBillingLoading(false)
      return undefined
    }
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
  }, [resetBilling, canBilling])

  useEffect(() => {
    if (!canManual) {
      setManualPaymentLoading(false)
      return undefined
    }
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
  }, [resetManual, canManual])

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

  if (!canBilling && !canManual) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <PlatformPageHeader
          badge="Finance"
          title="Billing configuration"
          description="Invoice issuer, VAT, and manual subscription payment details."
          icon={FiDollarSign}
        />
        <PlatformAccessDenied
          title="Finance settings restricted"
          message="Only super admins or admins with “Platform billing setup” can change VAT, branding, and payout details. Contact a super admin to request access."
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PlatformPageHeader
        badge="Finance"
        title="Billing & payments"
        description="Platform-wide billing for subscription invoices and manual bank payments shown to restaurants."
        icon={FiDollarSign}
      />

      {canManual && (
        <Card title="Manual subscription payments" icon={FiDollarSign}>
          <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            Bank / wallet details and QR shown to restaurants for manual subscription top-ups. Super admin only.
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
        </Card>
      )}

      {canBilling && (
        <Card title="Billing & VAT (invoices)" icon={FiDollarSign}>
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
        </Card>
      )}
    </div>
  )
}

export default PlatformFinanceSettings
