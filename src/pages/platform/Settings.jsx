import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { DEFAULT_CURRENCY_CODE, DEFAULT_CURRENCY_SYMBOL } from '../../utils/currency'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'

const Settings = () => {
  const [loading, setLoading] = useState(false)
  const [billingLoading, setBillingLoading] = useState(true)
  const [billingSaving, setBillingSaving] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm()
  const {
    register: registerBilling,
    handleSubmit: handleBillingSubmit,
    reset: resetBilling,
    formState: { errors: billingErrors },
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

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Account security and platform billing details used on subscription invoices.</p>
      </div>

      <Card title="Change Password">
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

      <Card title="Billing & VAT (subscription invoices)">
        <p className="text-sm text-gray-600 mb-4">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Company address</label>
              <textarea
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
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
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" {...registerBilling('pricesAreVatInclusive')} className="rounded border-gray-300" />
              Plan prices include VAT (inclusive pricing)
            </label>
            <Button type="submit" loading={billingSaving}>Save billing settings</Button>
          </form>
        )}
      </Card>
    </div>
  )
}

export default Settings
