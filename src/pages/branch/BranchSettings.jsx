import React, { useEffect, useState } from 'react'
import toast from '@utils/toast'
import { FiCheck, FiImage, FiRefreshCw, FiSun, FiMoon, FiUpload } from 'react-icons/fi'
import api from '../../services/api'
import Button from '../../components/common/Button'
import Card from '../../components/common/Card'
import Input from '../../components/common/Input'
import NotificationSettingsPanel from '../../components/notifications/NotificationSettingsPanel'
import { useAuth } from '../../hooks/useAuth'
import { useTheme } from '../../context/ThemeContext'
import {
  DEFAULT_THEME_SETTINGS,
  FONT_OPTIONS,
  PREDEFINED_THEMES,
  getEffectivePalette,
  isValidHex,
  normalizeThemeSettings,
} from '../../theme/themePresets'

const paletteFields = [
  ['primary', 'Primary'],
  ['secondary', 'Secondary'],
  ['accent', 'Accent'],
  ['attention', 'Attention'],
  ['surface', 'Surface'],
  ['background', 'Background'],
  ['text', 'Text'],
]

const getEditablePalette = (settings) => ({
  ...getEffectivePalette(settings),
  ...(settings.customPalette || {}),
})

const normalizeHexEntry = (value) => {
  const clean = String(value || '').replace(/^#/, '').replace(/[^0-9a-fA-F]/g, '').slice(0, 6)
  return `#${clean}`
}

const emptyHours = {
  monday: '',
  tuesday: '',
  wednesday: '',
  thursday: '',
  friday: '',
  saturday: '',
  sunday: '',
}

const BranchSettings = () => {
  const { mergeUser } = useAuth()
  const { updateTheme, applyRemoteTheme, resetTheme } = useTheme()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [branch, setBranch] = useState(null)
  const [form, setForm] = useState({
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    country: 'Nepal',
    branchManagerName: '',
    taxNumber: '',
    receiptFooter: '',
    currency: '',
    timezone: '',
    taxRate: '',
    serviceChargePercent: '',
  })
  const [hours, setHours] = useState(emptyHours)
  const [themeDraft, setThemeDraft] = useState(normalizeThemeSettings(DEFAULT_THEME_SETTINGS))
  const [paletteInputs, setPaletteInputs] = useState(getEditablePalette(DEFAULT_THEME_SETTINGS))
  const [logoFile, setLogoFile] = useState(null)
  const [bannerFile, setBannerFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState('')
  const [bannerPreview, setBannerPreview] = useState('')

  const loadBranch = async () => {
    try {
      setLoading(true)
      const res = await api.get('/restaurant/branches/me/settings', { skipBranchHeader: true })
      const row = res.data?.data || {}
      setBranch(row)
      setForm({
        phone: row.phone || '',
        email: row.email || '',
        address: row.address || '',
        city: row.city || '',
        state: row.state || '',
        country: row.country || 'Nepal',
        branchManagerName: row.branchManagerName || '',
        taxNumber: row.taxNumber || '',
        receiptFooter: row.settings?.receiptFooter || '',
        currency: row.settings?.currency || '',
        timezone: row.settings?.timezone || '',
        taxRate: row.settings?.taxRate ?? '',
        serviceChargePercent: row.settings?.serviceChargePercent ?? '',
      })
      setHours({ ...emptyHours, ...(row.openingHours || {}) })
      const nextTheme = normalizeThemeSettings(row.settings?.themeSettings)
      setThemeDraft(nextTheme)
      setPaletteInputs(getEditablePalette(nextTheme))
      applyRemoteTheme(nextTheme)
      setLogoPreview(row.logo || '')
      setBannerPreview(row.banner || row.settings?.themeSettings?.branding?.backgroundImage || '')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load branch settings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBranch()
  }, [])

  useEffect(() => {
    setPaletteInputs(getEditablePalette(themeDraft))
  }, [themeDraft])

  const setField = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }))
  const setHour = (key) => (event) => setHours((current) => ({ ...current, [key]: event.target.value }))

  const updateThemeDraft = (updates) => {
    setThemeDraft((current) => {
      const next = normalizeThemeSettings({ ...current, ...updates })
      updateTheme(next)
      return next
    })
  }

  const applyCustomPaletteColor = (key, value) => {
    setThemeDraft((current) => {
      const next = normalizeThemeSettings({
        ...current,
        activeTheme: 'custom',
        customPalette: {
          ...getEditablePalette(current),
          [key]: value,
        },
      })
      updateTheme(next)
      return next
    })
  }

  const updateCustomPalette = (key, value) => {
    const nextValue = normalizeHexEntry(value)
    setPaletteInputs((current) => ({ ...current, [key]: nextValue }))
    if (isValidHex(nextValue)) applyCustomPaletteColor(key, nextValue)
  }

  const commitCustomPalette = (key) => {
    const currentValue = paletteInputs[key]
    if (isValidHex(currentValue)) {
      applyCustomPaletteColor(key, currentValue)
      return
    }
    setPaletteInputs(getEditablePalette(themeDraft))
    toast.error('Enter a valid 6-digit hex color, for example #6d28d9')
  }

  const pickImage = (setter, previewSetter) => (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be less than 10MB')
      return
    }
    setter(file)
    const reader = new FileReader()
    reader.onload = (e) => previewSetter(e.target.result)
    reader.readAsDataURL(file)
  }

  const submit = async (event) => {
    event.preventDefault()
    try {
      setSaving(true)
      const body = new FormData()
      Object.entries(form).forEach(([key, value]) => {
        if (value !== undefined && value !== null && String(value).trim()) body.append(key, String(value))
      })
      body.append('openingHours', JSON.stringify(hours))
      body.append('settings', JSON.stringify({
        receiptFooter: form.receiptFooter,
        currency: form.currency,
        timezone: form.timezone,
        taxRate: form.taxRate,
        serviceChargePercent: form.serviceChargePercent,
      }))
      body.append('themeSettings', JSON.stringify(themeDraft))
      if (logoFile) body.append('logo', logoFile)
      if (bannerFile) body.append('banner', bannerFile)

      const res = await api.put('/restaurant/branches/me/settings', body, {
        skipBranchHeader: true,
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const updated = res.data?.data || {}
      setBranch(updated)
      setLogoFile(null)
      setBannerFile(null)
      mergeUser({
        branchName: updated.name,
        logo: updated.logo,
        themeSettings: updated.settings?.themeSettings,
      })
      applyRemoteTheme(updated.settings?.themeSettings)
      toast.success('Branch settings saved')
      await loadBranch()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save branch settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="rounded-2xl border border-surface-200 bg-white p-6 text-sm text-gray-500">Loading branch settings...</div>

  return (
    <form onSubmit={submit} className="mx-auto max-w-5xl space-y-6">
      <div className="rounded-3xl border border-primary-100 bg-gradient-to-r from-white via-surface-50 to-primary-50 p-6 shadow-sm dark:border-gray-800 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-primary-700 dark:text-primary-300">Branch control</p>
        <h1 className="mt-2 text-3xl font-black text-gray-950 dark:text-gray-100">{branch?.name || 'Branch'} Settings</h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Customize this branch without changing the main restaurant profile.</p>
      </div>

      <NotificationSettingsPanel />

      <Card title="Branch Identity">
        <div className="grid gap-4 md:grid-cols-2">
          <Input label="Branch manager" value={form.branchManagerName} onChange={setField('branchManagerName')} />
          <Input label="Phone" value={form.phone} onChange={setField('phone')} />
          <Input label="Email" value={form.email} onChange={setField('email')} />
          <Input label="Tax number" value={form.taxNumber} onChange={setField('taxNumber')} />
          <Input label="City" value={form.city} onChange={setField('city')} />
          <Input label="State" value={form.state} onChange={setField('state')} />
          <Input label="Country" value={form.country} onChange={setField('country')} />
          <div className="md:col-span-2">
            <Input label="Address" value={form.address} onChange={setField('address')} />
          </div>
        </div>
      </Card>

      <Card title="Branch Branding" icon={FiImage}>
        <div className="grid gap-4 md:grid-cols-2">
          <ImageUpload id="branch-logo" label="Branch logo" preview={logoPreview} onChange={pickImage(setLogoFile, setLogoPreview)} />
          <ImageUpload id="branch-banner" label="Branch banner" preview={bannerPreview} onChange={pickImage(setBannerFile, setBannerPreview)} wide />
        </div>
      </Card>

      <Card title="Branch Theme">
        <div className="space-y-6">
          <div className="grid gap-3 md:grid-cols-3">
            {[
              { value: 'light', label: 'Light', icon: FiSun },
              { value: 'dark', label: 'Dark', icon: FiMoon },
              { value: 'system', label: 'System', icon: FiRefreshCw },
            ].map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => updateThemeDraft({ mode: value })}
                className={`flex items-center justify-between rounded-lg border px-4 py-3 text-sm font-bold transition ${
                  themeDraft.mode === value ? 'border-primary-500 bg-primary-50 text-primary-800' : 'border-gray-200 bg-white text-gray-700'
                }`}
              >
                <span className="flex items-center gap-2"><Icon className="h-4 w-4" />{label}</span>
                {themeDraft.mode === value && <FiCheck className="h-4 w-4" />}
              </button>
            ))}
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {PREDEFINED_THEMES.map((theme) => (
              <button
                key={theme.id}
                type="button"
                onClick={() => updateThemeDraft({ activeTheme: theme.id })}
                className={`rounded-lg border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md ${
                  themeDraft.activeTheme === theme.id ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-100' : 'border-gray-100 bg-white'
                }`}
              >
                <p className="font-black text-gray-950">{theme.name}</p>
                <div className="mt-4 flex gap-2">
                  {['primary', 'secondary', 'accent', 'attention', 'surface'].map((key) => (
                    <span key={key} className="h-7 w-7 rounded-full border border-white shadow-sm ring-1 ring-black/5" style={{ backgroundColor: theme.palette[key] }} />
                  ))}
                </div>
              </button>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {paletteFields.map(([key, label]) => {
              const value = paletteInputs[key] || getEditablePalette(themeDraft)[key] || '#111827'
              const colorValue = isValidHex(value) ? value : getEditablePalette(themeDraft)[key] || '#111827'
              return (
                <label key={key} className="rounded-lg border border-gray-100 bg-white p-3">
                  <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">{label}</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={colorValue}
                      onChange={(e) => {
                        setPaletteInputs((current) => ({ ...current, [key]: e.target.value }))
                        applyCustomPaletteColor(key, e.target.value)
                      }}
                      className="h-10 w-12 cursor-pointer rounded border border-gray-200 bg-white p-1"
                    />
                    <input
                      value={value}
                      onChange={(e) => updateCustomPalette(key, e.target.value)}
                      onBlur={() => commitCustomPalette(key)}
                      className="min-w-0 flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold"
                    />
                  </div>
                </label>
              )
            })}
          </div>

          <label className="block text-sm font-bold text-gray-700">
            Font family
            <select value={themeDraft.fontFamily} onChange={(e) => updateThemeDraft({ fontFamily: e.target.value })} className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm">
              {FONT_OPTIONS.map((font) => <option key={font.value} value={font.value}>{font.label}</option>)}
            </select>
          </label>
        </div>
      </Card>

      <Card title="Hours & Service">
        <div className="grid gap-4 md:grid-cols-2">
          {Object.keys(emptyHours).map((day) => (
            <Input key={day} label={day.charAt(0).toUpperCase() + day.slice(1)} value={hours[day] || ''} onChange={setHour(day)} placeholder="10:00 AM - 10:00 PM" />
          ))}
          <Input label="Currency" value={form.currency} onChange={setField('currency')} placeholder="Rs." />
          <Input label="Timezone" value={form.timezone} onChange={setField('timezone')} placeholder="Asia/Kathmandu" />
          <Input label="Tax rate (%)" value={form.taxRate} onChange={setField('taxRate')} />
          <Input label="Service charge (%)" value={form.serviceChargePercent} onChange={setField('serviceChargePercent')} />
          <div className="md:col-span-2">
            <Input label="Receipt footer" value={form.receiptFooter} onChange={setField('receiptFooter')} placeholder="Thank you for visiting" />
          </div>
        </div>
      </Card>

      <div className="sticky bottom-4 z-10 flex justify-end gap-3 rounded-2xl border border-surface-200 bg-white/95 p-3 shadow-xl backdrop-blur">
        <Button type="button" variant="secondary" onClick={() => { resetTheme(); loadBranch() }}>Reset</Button>
        <Button type="submit" loading={saving}>Save Branch Settings</Button>
      </div>
    </form>
  )
}

function ImageUpload({ id, label, preview, onChange, wide }) {
  return (
    <div className="rounded-2xl border border-surface-200 bg-white p-4">
      <p className="font-black text-gray-950">{label}</p>
      {preview && (
        <div className={`mt-3 overflow-hidden rounded-xl border border-gray-100 bg-gray-50 ${wide ? 'h-32' : 'h-28 w-28'}`}>
          <img src={preview} alt={label} className="h-full w-full object-cover" />
        </div>
      )}
      <div className="mt-3 rounded-xl border-2 border-dashed border-gray-200 p-5 text-center">
        <input id={id} type="file" accept="image/*" className="hidden" onChange={onChange} />
        <label htmlFor={id} className="inline-flex cursor-pointer items-center gap-2 text-sm font-black text-primary-700">
          <FiUpload className="h-4 w-4" />
          Upload image
        </label>
      </div>
    </div>
  )
}

export default BranchSettings
