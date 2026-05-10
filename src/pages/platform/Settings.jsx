import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { FiGlobe, FiLock, FiSettings } from 'react-icons/fi'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { DEFAULT_CURRENCY_CODE, DEFAULT_CURRENCY_SYMBOL } from '../../utils/currency'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Textarea from '../../components/common/Textarea'
import Tabs from '../../components/common/Tabs'
import { PlatformPageHeader } from '../../components/platform/PlatformUI'
import { useAuth } from '../../hooks/useAuth'
import { LANDING_THEMES } from '../../components/landing/landingThemePresets'

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
  const [publicTabSaving, setPublicTabSaving] = useState(false)
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
  const {
    register: registerLanding,
    handleSubmit: handleLandingSubmit,
    reset: resetLanding,
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
          resetLanding({
            softwareName: data.softwareName || '',
            brandSubtitle: data.brandSubtitle || '',
            publicSiteUrl: data.publicSiteUrl || '',
            supportEmail: data.supportEmail || '',
            contactPhone: data.contactPhone || '',
            landingTheme: data.landingTheme || 'default',
            heroEyebrow: data.heroEyebrow || '',
            heroTitle: data.heroTitle || '',
            heroDescription: data.heroDescription || '',
            heroSubDescription: data.heroSubDescription || '',
            heroImage: data.heroImage || '',
            heroTypewriterPhrases: data.heroTypewriterPhrases || '',
            heroPrimaryCtaText: data.heroPrimaryCtaText || '',
            heroPrimaryCtaHref: data.heroPrimaryCtaHref || '',
            heroSecondaryCtaText: data.heroSecondaryCtaText || '',
            heroSecondaryCtaHref: data.heroSecondaryCtaHref || '',
            heroBulletPoints: data.heroBulletPoints || '',
            footerTagline: data.footerTagline || '',
            footerCtaTitle: data.footerCtaTitle || '',
            footerCtaSubtitle: data.footerCtaSubtitle || '',
            chatWidgetEnabled: data.chatWidgetEnabled !== false,
            chatWidgetMode: data.chatWidgetMode || 'whatsapp',
            chatWhatsappNumber: data.chatWhatsappNumber || '',
            chatWhatsappMessage: data.chatWhatsappMessage || '',
            chatDisplayPhone: data.chatDisplayPhone || '',
          })
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to load site settings')
      }
    })()
    return () => { cancelled = true }
  }, [resetLanding])

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

  const syncFeedbackFromResponse = (data) => {
    if (!data) return
    setFeedbackEnabled(data.feedbackEnabled !== false)
    setShowFeedbackOnLanding(data.showFeedbackOnLanding !== false)
    if (data.feedbackSummary != null) setFeedbackSummary(data.feedbackSummary)
  }

  const savePublicFeedbackOnly = async () => {
    try {
      setPublicTabSaving(true)
      const res = await api.patch('/platform/settings/site', {
        feedbackEnabled,
        showFeedbackOnLanding,
      })
      syncFeedbackFromResponse(res.data?.data)
      toast.success('Feedback settings saved')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save')
    } finally {
      setPublicTabSaving(false)
    }
  }

  const savePublicSiteSuper = async (form) => {
    if (!isSuperAdmin) {
      toast.error('Only super admin can update landing branding')
      return
    }
    try {
      setPublicTabSaving(true)
      const res = await api.patch('/platform/settings/site', {
        ...form,
        chatWidgetEnabled: form.chatWidgetEnabled === true || form.chatWidgetEnabled === 'true',
        feedbackEnabled,
        showFeedbackOnLanding,
      })
      syncFeedbackFromResponse(res.data?.data)
      toast.success('Public site settings saved')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save')
    } finally {
      setPublicTabSaving(false)
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

  const feedbackPanel = (
    <>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">Feedback</p>
          <p className="mt-2 text-2xl font-black text-gray-950 dark:text-gray-100">{feedbackSummary?.total ?? 0}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">Public</p>
          <p className="mt-2 text-2xl font-black text-gray-950 dark:text-gray-100">{feedbackSummary?.publicCount ?? 0}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">System rating</p>
          <p className="mt-2 text-2xl font-black text-gray-950 dark:text-gray-100">{feedbackSummary?.averageSystemRating || 0}/5</p>
        </div>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Control whether customers can submit feedback after orders and whether approved public feedback appears on the marketing landing page.
      </p>
      <label className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <div>
          <p className="text-sm font-bold text-gray-900 dark:text-gray-100">Enable customer feedback</p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">After paid orders, customers can answer feedback prompts.</p>
        </div>
        <button
          type="button"
          onClick={() => setFeedbackEnabled((c) => !c)}
          className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${feedbackEnabled ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-700'}`}
        >
          <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${feedbackEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      </label>
      <label className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <div>
          <p className="text-sm font-bold text-gray-900 dark:text-gray-100">Show feedback on landing page</p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">High-rated public feedback can appear with restaurant logos.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowFeedbackOnLanding((c) => !c)}
          disabled={!feedbackEnabled}
          className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${showFeedbackOnLanding && feedbackEnabled ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-700'}`}
        >
          <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${showFeedbackOnLanding && feedbackEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      </label>
    </>
  )

  const landingFieldsSuper = (
    <>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Branding, hero, footer, chat, and theme for the public landing page. Filled hero fields override CMS banner text for those slots; leave blank to keep CMS content.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <Input label="Software / brand name" {...registerLanding('softwareName')} placeholder="QR Restro Nepal" />
        <Input label="Brand subtitle (under name)" {...registerLanding('brandSubtitle')} placeholder="Nepal" />
        <Input label="Public site URL (display only)" {...registerLanding('publicSiteUrl')} placeholder="www.yourdomain.com" icon={FiGlobe} />
        <Input label="Support email" type="email" {...registerLanding('supportEmail')} />
        <Input label="Contact phone (landing)" {...registerLanding('contactPhone')} placeholder="+977 …" />
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Landing theme</label>
          <select
            {...registerLanding('landingTheme')}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          >
            {Object.values(LANDING_THEMES).map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-xs font-black uppercase tracking-wide text-gray-500 dark:text-gray-400">Hero</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <Input label="Eyebrow" {...registerLanding('heroEyebrow')} />
          <Input label="Title" {...registerLanding('heroTitle')} />
          <Textarea label="Description" rows={3} className="md:col-span-2" {...registerLanding('heroDescription')} />
          <Textarea label="Secondary paragraph" rows={2} className="md:col-span-2" {...registerLanding('heroSubDescription')} />
          <Input label="Hero image URL" {...registerLanding('heroImage')} />
          <Input label="Typewriter phrases (comma or newline)" {...registerLanding('heroTypewriterPhrases')} />
          <Input label="Primary CTA label" {...registerLanding('heroPrimaryCtaText')} />
          <Input label="Primary CTA link" {...registerLanding('heroPrimaryCtaHref')} placeholder="/vendor/register" />
          <Input label="Secondary CTA label" {...registerLanding('heroSecondaryCtaText')} />
          <Input label="Secondary CTA link" {...registerLanding('heroSecondaryCtaHref')} placeholder="#features" />
          <Textarea label="Bullets (one per line, max 4)" rows={4} className="md:col-span-2" {...registerLanding('heroBulletPoints')} />
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-xs font-black uppercase tracking-wide text-gray-500 dark:text-gray-400">Footer</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <Textarea label="Tagline (under logo)" rows={2} className="md:col-span-2" {...registerLanding('footerTagline')} />
          <Input label="CTA title" {...registerLanding('footerCtaTitle')} />
          <Input label="CTA subtitle" {...registerLanding('footerCtaSubtitle')} />
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-xs font-black uppercase tracking-wide text-gray-500 dark:text-gray-400">Landing chat widget</h3>
        <label className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-800 dark:text-gray-200">
          <input type="checkbox" {...registerLanding('chatWidgetEnabled')} className="h-4 w-4 rounded border-gray-400" />
          Show floating chat button on landing page
        </label>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Channels</label>
            <select
              {...registerLanding('chatWidgetMode')}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            >
              <option value="whatsapp">WhatsApp only</option>
              <option value="phone">Phone only</option>
              <option value="both">WhatsApp + phone</option>
            </select>
          </div>
          <Input label="WhatsApp number (digits, country code, no +)" {...registerLanding('chatWhatsappNumber')} />
          <Input label="Phone shown in popup (optional)" {...registerLanding('chatDisplayPhone')} />
          <Input label="WhatsApp pre-filled message" {...registerLanding('chatWhatsappMessage')} />
        </div>
      </div>
    </>
  )

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
                <input type="file" accept="image/*" className="text-sm" onChange={(e) => setManualQrFile(e.target.files?.[0] || null)} />
                {manualQrPreview ? (
                  <a href={manualQrPreview} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm text-primary-600 underline dark:text-primary-400">View current QR</a>
                ) : (
                  <p className="mt-2 text-xs text-gray-500">No QR uploaded yet.</p>
                )}
              </div>
              <Button type="submit" loading={manualPaymentSaving}>Save manual payment details</Button>
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
            <Button type="submit" loading={billingSaving}>Save billing settings</Button>
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
      <Button type="submit" loading={loading}>Update password</Button>
    </form>
  )

  const publicTabContent = isSuperAdmin ? (
    <form onSubmit={handleLandingSubmit(savePublicSiteSuper)} className="space-y-8">
      {landingFieldsSuper}
      <div className="border-t border-gray-200 pt-8 dark:border-gray-800">
        <h3 className="mb-4 text-xs font-black uppercase tracking-wide text-gray-500 dark:text-gray-400">Customer feedback</h3>
        <div className="space-y-4">{feedbackPanel}</div>
      </div>
      <Button type="submit" loading={publicTabSaving}>Save public site &amp; feedback</Button>
    </form>
  ) : (
    <div className="space-y-6">
      {feedbackPanel}
      <Button type="button" loading={publicTabSaving} onClick={savePublicFeedbackOnly}>Save feedback settings</Button>
    </div>
  )

  const settingsTabs = [
    { key: 'public', label: 'Public site', content: publicTabContent },
    { key: 'finance', label: 'Finance & billing', content: financeTabContent },
    { key: 'account', label: 'Your account', content: accountTabContent },
  ]

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PlatformPageHeader
        badge="Platform"
        title="Settings"
        description="All platform controls in one place: public marketing site, feedback, finance, billing, and your password."
        icon={FiSettings}
      />

      <Card title="Platform configuration" icon={FiSettings}>
        <Tabs tabs={settingsTabs} defaultTab="public" />
      </Card>
    </div>
  )
}

export default Settings
