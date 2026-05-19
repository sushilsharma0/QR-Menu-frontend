import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { FiGlobe } from 'react-icons/fi'
import toast from '@utils/toast'
import api from '../../services/api'
import Button from '../common/Button'
import Input from '../common/Input'
import Textarea from '../common/Textarea'
import { useAuth } from '../../hooks/useAuth'
import { LANDING_THEMES } from '../landing/landingThemePresets'

export default function PublicSiteSettingsForm() {
  const { user } = useAuth()
  const isSuperAdmin = user?.role === 'super_admin'
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [feedbackEnabled, setFeedbackEnabled] = useState(true)
  const [showFeedbackOnLanding, setShowFeedbackOnLanding] = useState(true)
  const [feedbackSummary, setFeedbackSummary] = useState(null)
  const { register, handleSubmit, reset } = useForm()

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
          reset({
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
        toast.error(error.response?.data?.message || 'Failed to load public site settings')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [reset])

  const syncFeedback = (data) => {
    if (!data) return
    setFeedbackEnabled(data.feedbackEnabled !== false)
    setShowFeedbackOnLanding(data.showFeedbackOnLanding !== false)
    if (data.feedbackSummary != null) setFeedbackSummary(data.feedbackSummary)
  }

  const onSave = async (form) => {
    if (!isSuperAdmin) {
      try {
        setSaving(true)
        const res = await api.patch('/platform/settings/site', {
          feedbackEnabled,
          showFeedbackOnLanding,
        })
        syncFeedback(res.data?.data)
        toast.success('Feedback settings saved')
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to save')
      } finally {
        setSaving(false)
      }
      return
    }

    try {
      setSaving(true)
      const res = await api.patch('/platform/settings/site', {
        ...form,
        chatWidgetEnabled: form.chatWidgetEnabled === true || form.chatWidgetEnabled === 'true',
        feedbackEnabled,
        showFeedbackOnLanding,
      })
      syncFeedback(res.data?.data)
      toast.success('Public site settings saved')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary-600" />
      </div>
    )
  }

  const feedbackPanel = (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Total feedback</p>
          <p className="mt-2 text-2xl font-black text-gray-950 dark:text-gray-100">{feedbackSummary?.total ?? 0}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Public reviews</p>
          <p className="mt-2 text-2xl font-black text-gray-950 dark:text-gray-100">{feedbackSummary?.publicCount ?? 0}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Avg. rating</p>
          <p className="mt-2 text-2xl font-black text-gray-950 dark:text-gray-100">{feedbackSummary?.averageSystemRating || 0}/5</p>
        </div>
      </div>
      <label className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <div>
          <p className="text-sm font-bold text-gray-900 dark:text-gray-100">Enable customer feedback</p>
          <p className="mt-1 text-xs text-gray-500">After paid orders, guests can rate their experience.</p>
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
          <p className="text-sm font-bold text-gray-900 dark:text-gray-100">Show on landing page</p>
          <p className="mt-1 text-xs text-gray-500">Approved public feedback appears on the marketing site.</p>
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
    </div>
  )

  if (!isSuperAdmin) {
    return (
      <div className="space-y-6">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Only super admins can edit branding and hero. You can manage customer feedback visibility below.
        </p>
        {feedbackPanel}
        <Button type="button" loading={saving} onClick={() => onSave({})}>
          Save feedback settings
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-8">
      <div className="rounded-xl border border-blue-100 bg-blue-50/80 p-4 text-sm text-blue-950 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-100">
        <p className="font-bold">How this works with CMS</p>
        <p className="mt-1 text-blue-900/90 dark:text-blue-200/90">
          Fields here override CMS for the same slot when filled. Leave hero fields empty to use your active{' '}
          <strong>Banner</strong> entries from the Content blocks tab.
        </p>
      </div>

      <div>
        <h3 className="mb-3 text-xs font-black uppercase tracking-wide text-gray-500">Brand &amp; contact</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <Input label="Software / brand name" {...register('softwareName')} placeholder="QR Restro Nepal" />
          <Input label="Subtitle (under logo)" {...register('brandSubtitle')} placeholder="Nepal" />
          <Input label="Public website URL (display)" {...register('publicSiteUrl')} placeholder="www.yourdomain.com" icon={FiGlobe} />
          <Input label="Support email" type="email" {...register('supportEmail')} />
          <Input label="Contact phone on landing" {...register('contactPhone')} placeholder="+977 …" />
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Color theme</label>
            <select
              {...register('landingTheme')}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            >
              {Object.values(LANDING_THEMES).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-1 text-xs font-black uppercase tracking-wide text-gray-500">Hero (optional overrides)</h3>
        <p className="mb-3 text-xs text-gray-500">Leave blank to use CMS hero banner content.</p>
        <div className="grid gap-4 md:grid-cols-2">
          <Input label="Eyebrow" {...register('heroEyebrow')} placeholder="Digital dining platform" />
          <Input label="Headline" {...register('heroTitle')} />
          <Textarea label="Main description" rows={3} className="md:col-span-2" {...register('heroDescription')} />
          <Textarea label="Second paragraph" rows={2} className="md:col-span-2" {...register('heroSubDescription')} />
          <Input label="Hero image URL" {...register('heroImage')} />
          <Input label="Typewriter phrases (comma or new line)" {...register('heroTypewriterPhrases')} />
          <Input label="Primary button text" {...register('heroPrimaryCtaText')} />
          <Input label="Primary button link" {...register('heroPrimaryCtaHref')} placeholder="/vendor/register" />
          <Input label="Secondary button text" {...register('heroSecondaryCtaText')} />
          <Input label="Secondary button link" {...register('heroSecondaryCtaHref')} placeholder="#features" />
          <Textarea label="Bullet points (one per line, max 4)" rows={4} className="md:col-span-2" {...register('heroBulletPoints')} />
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-xs font-black uppercase tracking-wide text-gray-500">Footer</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <Textarea label="Tagline under logo" rows={2} className="md:col-span-2" {...register('footerTagline')} />
          <Input label="CTA heading" {...register('footerCtaTitle')} />
          <Input label="CTA subtext" {...register('footerCtaSubtitle')} />
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-xs font-black uppercase tracking-wide text-gray-500">WhatsApp / chat widget</h3>
        <label className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-800 dark:text-gray-200">
          <input type="checkbox" {...register('chatWidgetEnabled')} className="h-4 w-4 rounded border-gray-400" />
          Show floating chat on landing page
        </label>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Channel</label>
            <select
              {...register('chatWidgetMode')}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            >
              <option value="whatsapp">WhatsApp only</option>
              <option value="phone">Phone only</option>
              <option value="both">WhatsApp + phone</option>
            </select>
          </div>
          <Input label="WhatsApp number (digits, no +)" {...register('chatWhatsappNumber')} />
          <Input label="Phone in popup (optional)" {...register('chatDisplayPhone')} />
          <Input label="WhatsApp pre-filled message" {...register('chatWhatsappMessage')} />
        </div>
      </div>

      <div className="border-t border-gray-200 pt-8 dark:border-gray-800">
        <h3 className="mb-4 text-xs font-black uppercase tracking-wide text-gray-500">Customer feedback</h3>
        {feedbackPanel}
      </div>

      <Button type="submit" loading={saving}>
        Save public site settings
      </Button>
    </form>
  )
}

