import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import toast from '@utils/toast'
import { FiArchive, FiCheck, FiDatabase, FiDownload, FiEye, FiImage, FiMoon, FiRefreshCw, FiSun, FiTrash2, FiUpload, FiX } from 'react-icons/fi'
import api from '../../services/api'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import { useAuth } from '../../hooks/useAuth'
import NotificationSettingsPanel from '../../components/notifications/NotificationSettingsPanel'
import { useTheme } from '../../context/ThemeContext'
import {
  DEFAULT_THEME_SETTINGS,
  FONT_OPTIONS,
  PREDEFINED_THEMES,
  normalizeThemeSettings,
} from '../../theme/themePresets'

const IMAGE_MAX_BYTES = 1 * 1024 * 1024
const IMAGE_SIZE_HINT = 'Max 1 MB'

const COUNTRY_OPTIONS = [
  { country: 'Nepal', currency: 'Rs.', code: 'NPR', timezone: 'Asia/Kathmandu', label: 'Nepal - Nepali Rupee (Rs.)' },
  { country: 'India', currency: '₹', code: 'INR', timezone: 'Asia/Kolkata', label: 'India - Indian Rupee (₹)' },
  { country: 'United States', currency: '$', code: 'USD', timezone: 'America/New_York', label: 'United States - US Dollar ($)' },
  { country: 'United Kingdom', currency: '£', code: 'GBP', timezone: 'Europe/London', label: 'United Kingdom - Pound (£)' },
  { country: 'Australia', currency: 'A$', code: 'AUD', timezone: 'Australia/Sydney', label: 'Australia - Australian Dollar (A$)' },
  { country: 'Canada', currency: 'C$', code: 'CAD', timezone: 'America/Toronto', label: 'Canada - Canadian Dollar (C$)' },
  { country: 'United Arab Emirates', currency: 'د.إ', code: 'AED', timezone: 'Asia/Dubai', label: 'UAE - Dirham (د.إ)' },
  { country: 'Japan', currency: '¥', code: 'JPY', timezone: 'Asia/Tokyo', label: 'Japan - Yen (¥)' },
]

const currencyForCountry = (country) =>
  COUNTRY_OPTIONS.find((option) => option.country === country) || COUNTRY_OPTIONS[0]

function ThemePaletteCard({ theme, selected, onSelect }) {
  const colors = ['primary', 'secondary', 'accent', 'attention', 'surface']
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group rounded-lg border p-4 text-left transition hover:-translate-y-1 hover:shadow-md ${
        selected
          ? 'border-primary-500 bg-primary-50 shadow-sm ring-2 ring-primary-100 dark:bg-gray-800 dark:ring-gray-700'
          : 'border-gray-100 bg-white hover:border-primary-200 dark:border-gray-800 dark:bg-gray-900'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-black text-gray-950 dark:text-gray-100">{theme.name}</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-gray-400">
            {theme.tier === 'default' ? 'Included' : 'Premium ready'}
          </p>
        </div>
        {selected && (
          <span className="rounded-full bg-primary-600 p-1 text-white">
            <FiCheck className="h-3.5 w-3.5" />
          </span>
        )}
      </div>
      <div className="mt-4 flex gap-2">
        {colors.map((key) => (
          <span
            key={key}
            className="h-7 w-7 rounded-full border border-white shadow-sm ring-1 ring-black/5"
            style={{ backgroundColor: theme.palette[key] }}
            title={key}
          />
        ))}
      </div>
      <div className="mt-4 overflow-hidden rounded-lg border border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-950">
        <div className="flex">
          <div className="w-12 p-2" style={{ backgroundColor: theme.palette.primary }}>
            <div className="mb-2 h-4 rounded bg-white/25" />
            <div className="h-2 rounded bg-white/50" />
          </div>
          <div className="flex-1 p-2">
            <div className="mb-2 h-2 w-1/2 rounded" style={{ backgroundColor: theme.palette.secondary }} />
            <div className="rounded-md p-2" style={{ backgroundColor: theme.palette.surface }}>
              <span className="inline-block rounded px-2 py-1 text-[10px] font-bold text-white" style={{ backgroundColor: theme.palette.primary }}>
                Sample
              </span>
            </div>
          </div>
        </div>
      </div>
    </button>
  )
}

function BrandUpload({ id, label, preview, onChange, hint }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <p className="font-bold text-gray-900 dark:text-gray-100">{label}</p>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{hint}</p>
      {preview && (
        <div className="mt-3 h-24 overflow-hidden rounded-lg border border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-950">
          <img src={preview} alt={`${label} preview`} className="h-full w-full object-contain" />
        </div>
      )}
      <div className="mt-3 rounded-lg border-2 border-dashed border-gray-200 p-4 text-center transition hover:border-primary-400 dark:border-gray-700">
        <input id={id} type="file" accept="image/*" onChange={onChange} className="hidden" />
        <label htmlFor={id} className="inline-flex cursor-pointer items-center gap-2 text-sm font-bold text-primary-700 dark:text-primary-300">
          <FiUpload className="h-4 w-4" />
          Upload
        </label>
      </div>
    </div>
  )
}

const Settings = () => {
  const [loading, setLoading] = useState(false)
  const [restaurant, setRestaurant] = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)
  const [backgroundPreview, setBackgroundPreview] = useState(null)
  const [logoFile, setLogoFile] = useState(null)
  const [backgroundFile, setBackgroundFile] = useState(null)
  const [faviconPreview, setFaviconPreview] = useState(null)
  const [brandBackgroundPreview, setBrandBackgroundPreview] = useState(null)
  const [faviconFile, setFaviconFile] = useState(null)
  const [brandBackgroundFile, setBrandBackgroundFile] = useState(null)
  const [showLogoPreview, setShowLogoPreview] = useState(false)
  const [showBackgroundPreview, setShowBackgroundPreview] = useState(false)
  const [themeDraft, setThemeDraft] = useState(normalizeThemeSettings(DEFAULT_THEME_SETTINGS))
  const [themeSaving, setThemeSaving] = useState(false)
  const [backupBusy, setBackupBusy] = useState(false)
  const [backupHistory, setBackupHistory] = useState([])
  const [backupSchedules, setBackupSchedules] = useState([])
  const [restorePreview, setRestorePreview] = useState(null)
  const [restoreFile, setRestoreFile] = useState(null)
  const [restoreMode, setRestoreMode] = useState('merge')
  const [backupSections, setBackupSections] = useState(['menu', 'tables', 'inventory', 'employees', 'accounting', 'payroll', 'settings'])
  const { mergeUser } = useAuth()
  const { updateTheme, applyRemoteTheme, resetTheme } = useTheme()
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm()
  const selectedCountry = watch('country') || restaurant?.country || 'Nepal'
  const selectedCurrency = watch('currency') || restaurant?.settings?.currency || currencyForCountry(selectedCountry).currency

  useEffect(() => {
    fetchRestaurant()
    fetchBackupHistory()
  }, [])

  const fetchRestaurant = async () => {
    try {
      const res = await api.get('/restaurant/auth/profile')
      setRestaurant(res.data.data)
      
      // Set form values (name is read-only)
      setValue('name', res.data.data.name)
      setValue('phone', res.data.data.phone)
      setValue('address', res.data.data.address)
      setValue('city', res.data.data.city)
      setValue('state', res.data.data.state)
      setValue('pincode', res.data.data.pincode)
      setValue('country', res.data.data.country || 'Nepal')
      setValue('currency', res.data.data.settings?.currency || currencyForCountry(res.data.data.country || 'Nepal').currency)
      setValue('timezone', res.data.data.settings?.timezone || currencyForCountry(res.data.data.country || 'Nepal').timezone)
      setValue('description', res.data.data.description)
      setValue('openingTime', res.data.data.openingTime)
      setValue('closingTime', res.data.data.closingTime)
      
      // Set logo and background previews
      if (res.data.data.logo) {
        setLogoPreview(res.data.data.logo)
      }
      if (res.data.data.backgroundPhoto) {
        setBackgroundPreview(res.data.data.backgroundPhoto)
      }
      if (res.data.data.favicon) {
        setFaviconPreview(res.data.data.favicon)
      }
      if (res.data.data.brandBackgroundImage) {
        setBrandBackgroundPreview(res.data.data.brandBackgroundImage)
      }
      const loadedTheme = normalizeThemeSettings(res.data.data.settings?.themeSettings)
      setThemeDraft(loadedTheme)
      applyRemoteTheme(loadedTheme)
    } catch (error) {
      toast.error('Failed to fetch restaurant settings')
    }
  }

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }
    
    if (file.size > IMAGE_MAX_BYTES) {
      toast.error('Logo must be less than 1 MB')
      return
    }
    
    setLogoFile(file)
    const reader = new FileReader()
    reader.onload = (e) => setLogoPreview(e.target.result)
    reader.readAsDataURL(file)
  }

  const handleBackgroundChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }
    
    if (file.size > IMAGE_MAX_BYTES) {
      toast.error('Background photo must be less than 1 MB')
      return
    }
    
    setBackgroundFile(file)
    const reader = new FileReader()
    reader.onload = (e) => setBackgroundPreview(e.target.result)
    reader.readAsDataURL(file)
  }

  const handleBrandAssetChange = (setter, previewSetter) => (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }
    if (file.size > IMAGE_MAX_BYTES) {
      toast.error('Image must be less than 1 MB')
      return
    }
    setter(file)
    const reader = new FileReader()
    reader.onload = (event) => previewSetter(event.target.result)
    reader.readAsDataURL(file)
  }

  const persistThemeSettings = async (nextTheme) => {
    try {
      setThemeSaving(true)
      const formData = new FormData()
      formData.append('themeSettings', JSON.stringify(nextTheme))
      const response = await api.put('/restaurant/auth/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const updatedRestaurant = response.data?.data
      if (updatedRestaurant) {
        mergeUser({
          name: updatedRestaurant.name,
          phone: updatedRestaurant.phone,
          logo: updatedRestaurant.logo,
          favicon: updatedRestaurant.favicon,
          slug: updatedRestaurant.slug,
          country: updatedRestaurant.country,
          currency: updatedRestaurant?.settings?.currency,
          themeSettings: updatedRestaurant?.settings?.themeSettings,
        })
        applyRemoteTheme(updatedRestaurant?.settings?.themeSettings)
      }
      toast.success('Appearance saved')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save appearance')
    } finally {
      setThemeSaving(false)
    }
  }

  const updateThemeDraft = (updates, saveInstantly = false) => {
    const next = normalizeThemeSettings({
      ...themeDraft,
      ...updates,
      ...(updates.activeTheme && updates.activeTheme !== 'custom' ? { customPalette: null } : {}),
    })
    setThemeDraft(next)
    updateTheme(next)
    if (saveInstantly) persistThemeSettings(next)
  }

  const resetThemeDraft = () => {
    const next = normalizeThemeSettings(DEFAULT_THEME_SETTINGS)
    setThemeDraft(next)
    resetTheme()
    persistThemeSettings(next)
  }

  const clearLogo = () => {
    setLogoFile(null)
    setLogoPreview(null)
    if (restaurant?.logo) setLogoPreview(restaurant.logo)
  }

  const clearBackground = () => {
    setBackgroundFile(null)
    setBackgroundPreview(null)
    if (restaurant?.backgroundPhoto) setBackgroundPreview(restaurant.backgroundPhoto)
  }

  const handleCountryChange = (event) => {
    const country = event.target.value
    const option = currencyForCountry(country)
    setValue('country', option.country, { shouldDirty: true })
    setValue('currency', option.currency, { shouldDirty: true })
    setValue('timezone', option.timezone, { shouldDirty: true })
  }

  const onSubmit = async (data) => {
    try {
      setLoading(true)
      const formData = new FormData()

      // Only append values that are actually present — otherwise FormData
      // serialises `undefined` / `null` to the literal strings "undefined"
      // / "null", which then get persisted into MongoDB.
      const appendIfPresent = (key, value) => {
        if (value === undefined || value === null) return
        const str = String(value)
        if (!str.trim()) return
        formData.append(key, str)
      }

      appendIfPresent('phone', data.phone)
      appendIfPresent('address', data.address)
      appendIfPresent('city', data.city)
      appendIfPresent('state', data.state)
      appendIfPresent('pincode', data.pincode)
      appendIfPresent('country', data.country)
      appendIfPresent('currency', data.currency)
      appendIfPresent('timezone', data.timezone)
      appendIfPresent('description', data.description)
      appendIfPresent('openingTime', data.openingTime)
      appendIfPresent('closingTime', data.closingTime)
      
      // Add file fields if present
      if (logoFile) {
        formData.append('logo', logoFile)
      }
      if (backgroundFile) {
        formData.append('backgroundPhoto', backgroundFile)
      }
      if (faviconFile) {
        formData.append('favicon', faviconFile)
      }
      if (brandBackgroundFile) {
        formData.append('brandBackgroundImage', brandBackgroundFile)
      }
      formData.append('themeSettings', JSON.stringify(themeDraft))
      
      const response = await api.put('/restaurant/auth/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      const updatedRestaurant = response.data?.data
      if (updatedRestaurant) {
        mergeUser({
          name: updatedRestaurant.name,
          phone: updatedRestaurant.phone,
          logo: updatedRestaurant.logo,
          favicon: updatedRestaurant.favicon,
          slug: updatedRestaurant.slug,
          country: updatedRestaurant.country,
          currency: updatedRestaurant?.settings?.currency,
          themeSettings: updatedRestaurant?.settings?.themeSettings,
        })
        applyRemoteTheme(updatedRestaurant?.settings?.themeSettings)
      }
      
      toast.success('Settings updated successfully')
      setLogoFile(null)
      setBackgroundFile(null)
      setFaviconFile(null)
      setBrandBackgroundFile(null)
      await fetchRestaurant()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update settings')
    } finally {
      setLoading(false)
    }
  }

  const toggleAutoRenew = async () => {
    try {
      await api.patch('/restaurant/package/auto-renew', { autoRenew: !restaurant?.autoRenew })
      toast.success(`Auto-renew ${!restaurant?.autoRenew ? 'enabled' : 'disabled'}`)
      fetchRestaurant()
    } catch (error) {
      toast.error('Failed to update auto-renew')
    }
  }

  const fetchBackupHistory = async () => {
    try {
      const res = await api.get('/restaurant/backup/history')
      setBackupHistory(res.data?.data?.backups || [])
      setBackupSchedules(res.data?.data?.schedules || [])
    } catch {
      // Settings page can still load if backup access is disabled for the role.
    }
  }

  const createBackup = async (type = 'full') => {
    try {
      setBackupBusy(true)
      const res = await api.post('/restaurant/backup/create', {
        type,
        sections: type === 'partial' ? backupSections : [],
      })
      toast.success('Backup created')
      await fetchBackupHistory()
      const id = res.data?.data?.backup?._id
      if (id) downloadBackup(id)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create backup')
    } finally {
      setBackupBusy(false)
    }
  }

  const downloadBackup = async (id) => {
    try {
      const res = await api.get(`/restaurant/backup/download/${id}`, { responseType: 'blob' })
      const blobUrl = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = `backup-${id}.qrbak`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(blobUrl)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to download backup')
    }
  }

  const deleteBackup = async (id) => {
    if (!window.confirm('Delete this encrypted backup?')) return
    try {
      await api.delete(`/restaurant/backup/${id}`)
      toast.success('Backup deleted')
      fetchBackupHistory()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete backup')
    }
  }

  const saveBackupSchedule = async (frequency) => {
    try {
      setBackupBusy(true)
      await api.post('/restaurant/backup/schedule', {
        frequency,
        backupType: 'snapshot',
        sections: backupSections,
        isActive: true,
      })
      toast.success('Backup schedule saved')
      fetchBackupHistory()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save schedule')
    } finally {
      setBackupBusy(false)
    }
  }

  const previewRestore = async () => {
    if (!restoreFile) return toast.error('Choose a .qrbak file first')
    try {
      setBackupBusy(true)
      const form = new FormData()
      form.append('backup', restoreFile)
      form.append('previewOnly', 'true')
      form.append('mode', restoreMode)
      const res = await api.post('/restaurant/backup/restore', form)
      setRestorePreview(res.data?.data)
      toast.success('Restore preview ready')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to preview restore')
    } finally {
      setBackupBusy(false)
    }
  }

  const runRestore = async () => {
    if (!restoreFile) return toast.error('Choose a .qrbak file first')
    if (!restorePreview) return toast.error('Preview the backup before restoring')
    if (!window.confirm(`Restore backup using ${restoreMode} mode?`)) return
    try {
      setBackupBusy(true)
      const form = new FormData()
      form.append('backup', restoreFile)
      form.append('mode', restoreMode)
      await api.post('/restaurant/backup/restore', form)
      toast.success('Restore completed')
      setRestorePreview(null)
      setRestoreFile(null)
      fetchBackupHistory()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Restore failed')
    } finally {
      setBackupBusy(false)
    }
  }

  const toggleBackupSection = (section) => {
    setBackupSections((prev) =>
      prev.includes(section) ? prev.filter((item) => item !== section) : [...prev, section],
    )
  }

  const formatBackupSize = (bytes = 0) => {
    const size = Number(bytes || 0)
    if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`
    return `${Math.max(1, Math.round(size / 1024))} KB`
  }

  const latestBackup = backupHistory[0]
  const completedBackups = backupHistory.filter((backup) => backup.status === 'completed').length

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Restaurant Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your restaurant profile, header photo, and customer-facing branding</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <NotificationSettingsPanel />

        <Card
          title="Backup & Restore"
          icon={FiDatabase}
          actions={
            <Button type="button" variant="outline" size="sm" onClick={fetchBackupHistory} disabled={backupBusy}>
              <FiRefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          }
        >
          <div className="space-y-6">
            <div className="grid gap-3 md:grid-cols-3">
              {[
                { label: 'Backups', value: completedBackups },
                { label: 'Last backup', value: latestBackup ? new Date(latestBackup.createdAt).toLocaleDateString() : 'None' },
                { label: 'Schedules', value: backupSchedules.filter((schedule) => schedule.isActive).length },
              ].map((item) => (
                <div key={item.label} className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-950">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-gray-400">{item.label}</p>
                  <p className="mt-2 text-xl font-black text-gray-950 dark:text-gray-100">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
              <section className="space-y-5">
                <div>
                  <div className="flex flex-wrap gap-3">
                    <Button type="button" onClick={() => createBackup('full')} disabled={backupBusy}>
                      <FiArchive className="mr-2 h-4 w-4" />
                      Full Backup
                    </Button>
                    <Button type="button" variant="secondary" onClick={() => createBackup('partial')} disabled={backupBusy}>
                      Partial Backup
                    </Button>
                    <Button type="button" variant="outline" onClick={() => createBackup('incremental')} disabled={backupBusy}>
                      Incremental
                    </Button>
                  </div>
                </div>

                <div className="rounded-lg border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-black uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">Backup Sections</p>
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-black text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                      {backupSections.length} selected
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                    {['menu', 'tables', 'inventory', 'employees', 'accounting', 'payroll', 'settings', 'promotions', 'analytics', 'logs'].map((section) => (
                      <button
                        key={section}
                        type="button"
                        onClick={() => toggleBackupSection(section)}
                        className={`min-h-11 rounded-lg border px-3 text-sm font-bold capitalize transition hover:-translate-y-0.5 ${
                          backupSections.includes(section)
                            ? 'border-primary-500 bg-primary-50 text-primary-800 shadow-sm dark:bg-gray-800 dark:text-gray-100'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-primary-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-300'
                        }`}
                      >
                        {section}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-bold text-gray-900 dark:text-gray-100">Scheduled Backups</p>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {backupSchedules.length ? `${backupSchedules.length} schedule${backupSchedules.length === 1 ? '' : 's'} configured` : 'No active backup schedule'}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {['daily', 'weekly', 'monthly'].map((frequency) => (
                        <Button key={frequency} type="button" size="sm" variant="outline" onClick={() => saveBackupSchedule(frequency)} disabled={backupBusy}>
                          {frequency}
                        </Button>
                      ))}
                    </div>
                  </div>
                  {backupSchedules.length > 0 && (
                    <div className="mt-4 divide-y divide-gray-100 rounded-lg border border-gray-100 dark:divide-gray-800 dark:border-gray-800">
                      {backupSchedules.map((schedule) => (
                        <div key={schedule._id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                          <span className="font-bold capitalize text-gray-800 dark:text-gray-100">{schedule.frequency}</span>
                          <span className="text-right text-gray-500 dark:text-gray-400">{new Date(schedule.nextRunAt).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>

              <section className="rounded-lg border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-gray-900 dark:text-gray-100">Restore Backup</p>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{restoreFile ? restoreFile.name : 'No backup file selected'}</p>
                  </div>
                  {restorePreview && (
                    <span className="rounded-full bg-accent-50 px-3 py-1 text-xs font-black text-accent-700 dark:bg-gray-800 dark:text-accent-300">
                      Previewed
                    </span>
                  )}
                </div>

                <div className="mt-5 space-y-3">
                  <input
                    id="restore-backup-input"
                    type="file"
                    accept=".qrbak,application/octet-stream"
                    onChange={(e) => {
                      setRestoreFile(e.target.files?.[0] || null)
                      setRestorePreview(null)
                    }}
                    className="hidden"
                  />
                  <label
                    htmlFor="restore-backup-input"
                    className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-white px-4 py-5 text-center transition hover:border-primary-300 dark:border-gray-700 dark:bg-gray-900"
                  >
                    <FiUpload className="h-6 w-6 text-primary-600" />
                    <span className="mt-2 text-sm font-bold text-gray-900 dark:text-gray-100">Choose encrypted backup</span>
                    <span className="mt-1 max-w-full truncate text-xs text-gray-500 dark:text-gray-400">{restoreFile?.name || '.qrbak'}</span>
                  </label>

                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                    Restore mode
                    <select
                      value={restoreMode}
                      onChange={(e) => {
                        setRestoreMode(e.target.value)
                        setRestorePreview(null)
                      }}
                      className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                    >
                      <option value="merge">Merge</option>
                      <option value="replace">Replace</option>
                      <option value="create_new_branch">Create new branch</option>
                    </select>
                  </label>

                  <div className="grid grid-cols-2 gap-2">
                    <Button type="button" variant="outline" onClick={previewRestore} disabled={backupBusy}>Preview</Button>
                    <Button type="button" onClick={runRestore} disabled={backupBusy || !restorePreview}>Restore</Button>
                  </div>
                </div>

                {restorePreview && (
                  <div className="mt-5 rounded-lg border border-gray-100 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-gray-400">Preview</p>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                      {Object.entries(restorePreview.counts || {}).slice(0, 10).map(([key, count]) => (
                        <div key={key} className="flex items-center justify-between gap-2 rounded-md bg-gray-50 px-2 py-1.5 dark:bg-gray-950">
                          <span className="truncate capitalize text-gray-600 dark:text-gray-300">{key}</span>
                          <span className="font-black text-gray-900 dark:text-gray-100">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            </div>

            <div className="overflow-hidden rounded-lg border border-gray-100 dark:border-gray-800">
              <table className="min-w-full divide-y divide-gray-100 text-sm dark:divide-gray-800">
                <thead className="bg-gray-50 text-left text-xs font-black uppercase tracking-wider text-gray-500 dark:bg-gray-900 dark:text-gray-400">
                  <tr>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Created</th>
                    <th className="px-4 py-3">Size</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white dark:divide-gray-800 dark:bg-gray-950">
                  {backupHistory.length === 0 ? (
                    <tr><td colSpan="5" className="px-4 py-6 text-center text-gray-500">No backups yet.</td></tr>
                  ) : backupHistory.map((backup) => (
                    <tr key={backup._id} className="transition hover:bg-gray-50 dark:hover:bg-gray-900">
                      <td className="px-4 py-3 font-bold capitalize text-gray-900 dark:text-gray-100">{backup.type}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{new Date(backup.createdAt).toLocaleString()}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{formatBackupSize(backup.size)}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-black capitalize ${
                          backup.status === 'completed'
                            ? 'bg-accent-50 text-accent-700 dark:bg-gray-800 dark:text-accent-300'
                            : backup.status === 'failed'
                              ? 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-200'
                              : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
                        }`}>
                          {backup.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button type="button" onClick={() => downloadBackup(backup._id)} className="rounded-lg p-2 text-primary-700 hover:bg-primary-50 dark:text-primary-300 dark:hover:bg-gray-800">
                            <FiDownload />
                          </button>
                          <button type="button" onClick={() => deleteBackup(backup._id)} className="rounded-lg p-2 text-red-600 hover:bg-red-50 dark:hover:bg-gray-800">
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>

        <Card
          title="Appearance - Theme Customization"
          icon={FiImage}
          actions={
            <Button type="button" variant="outline" size="sm" onClick={resetThemeDraft} disabled={themeSaving}>
              <FiRefreshCw className="mr-2 h-4 w-4" />
              {themeSaving ? 'Saving...' : 'Reset default'}
            </Button>
          }
        >
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
                  onClick={() => updateThemeDraft({ mode: value }, true)}
                  disabled={themeSaving}
                  className={`flex items-center justify-between rounded-lg border px-4 py-3 text-sm font-bold transition hover:-translate-y-0.5 ${
                    themeDraft.mode === value
                      ? 'border-primary-500 bg-primary-50 text-primary-800 shadow-sm dark:bg-gray-800 dark:text-gray-100'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-primary-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {label}
                  </span>
                  {themeDraft.mode === value && <FiCheck className="h-4 w-4" />}
                </button>
              ))}
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">Palettes</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Hover to inspect, click to preview instantly across the app.</p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {PREDEFINED_THEMES.map((theme) => (
                  <ThemePaletteCard
                    key={theme.id}
                    theme={theme}
                    selected={themeDraft.activeTheme === theme.id}
                    onSelect={() => updateThemeDraft({ activeTheme: theme.id }, true)}
                  />
                ))}
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
              <div className="rounded-lg border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                  Font family
                  <select
                    value={themeDraft.fontFamily}
                    onChange={(e) => updateThemeDraft({ fontFamily: e.target.value }, true)}
                    disabled={themeSaving}
                    className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary-400 disabled:cursor-not-allowed disabled:opacity-70 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                  >
                    {FONT_OPTIONS.map((font) => (
                      <option key={font.value} value={font.value}>{font.label}</option>
                    ))}
                  </select>
                </label>
                <p className="mt-3 text-xs font-semibold text-gray-500 dark:text-gray-400">
                  Font and palette choices save immediately.
                </p>
              </div>

              <div className="rounded-lg border border-gray-100 bg-app-card p-4 shadow-sm dark:border-gray-800">
                <h3 className="font-bold text-gray-900 dark:text-gray-100">Live preview</h3>
                <div className="mt-4 overflow-hidden rounded-lg border border-app-border bg-app-background">
                  <div className="flex">
                    <div className="w-24 bg-primary-700 p-3 text-white">
                      <div className="mb-4 h-8 w-8 rounded-lg bg-white/20" />
                      <div className="space-y-2">
                        <div className="h-2 rounded bg-white/70" />
                        <div className="h-2 rounded bg-white/35" />
                        <div className="h-2 rounded bg-white/35" />
                      </div>
                    </div>
                    <div className="flex-1 p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <div>
                          <div className="h-3 w-24 rounded bg-primary-100" />
                          <div className="mt-2 h-2 w-16 rounded bg-secondary-100" />
                        </div>
                        <div className="rounded-lg bg-primary-600 px-3 py-2 text-xs font-bold text-white">Button</div>
                      </div>
                      <div className="rounded-lg border border-app-border bg-app-card p-3 shadow-sm">
                        <div className="mb-2 h-2 w-20 rounded bg-accent-200" />
                        <div className="h-8 rounded bg-surface-100" />
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <BrandUpload
                id="favicon-input"
                label="Favicon"
                preview={faviconPreview}
                onChange={handleBrandAssetChange(setFaviconFile, setFaviconPreview)}
                hint={`Square 4x4 style image, recommended 512x512 px. ${IMAGE_SIZE_HINT}.`}
              />
              <BrandUpload
                id="brand-bg-input"
                label="Brand background image"
                preview={brandBackgroundPreview}
                onChange={handleBrandAssetChange(setBrandBackgroundFile, setBrandBackgroundPreview)}
                hint={`Wide banner, recommended 1920x1080 px. ${IMAGE_SIZE_HINT}.`}
              />
            </div>

            <div className="rounded-lg border border-dashed border-primary-200 bg-primary-50 p-4 text-sm text-primary-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100">
              Theme settings are saved at restaurant level and are ready for branch overrides, premium themes, seasonal palettes, and superadmin theme controls.
            </div>
          </div>
        </Card>

        <Card title="Restaurant Information">
          <div className="space-y-6">
            <section className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4 dark:border-gray-800 dark:bg-gray-900/60">
              <h3 className="text-sm font-black uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">Basic Details</h3>
              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Restaurant Name <span className="text-xs text-gray-500 dark:text-gray-400">(Read-only - Registered from PAN)</span>
                  </label>
                  <div className="px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 font-medium cursor-not-allowed">
                    {restaurant?.name || 'Loading...'}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Your restaurant name is registered from your PAN and cannot be changed.
                  </p>
                </div>
                <Input
                  label="Description"
                  placeholder="Brief description of your restaurant"
                  {...register('description')}
                />
              </div>
            </section>

            <section className="rounded-2xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
              <h3 className="text-sm font-black uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">Contact & Location</h3>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <Input
                  label="Phone Number"
                  {...register('phone')}
                  error={errors.phone?.message}
                />
                <Input label="City" {...register('city')} />
                <div className="md:col-span-2">
                  <Input
                    label="Address"
                    {...register('address')}
                    error={errors.address?.message}
                  />
                </div>
                <Input label="State" {...register('state')} />
                <Input label="Pincode" {...register('pincode')} />
              </div>
            </section>

            <section className="rounded-2xl border border-primary-100 bg-primary-50/50 p-4 dark:border-gray-800 dark:bg-gray-900">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-[0.16em] text-primary-700 dark:text-primary-300">Country & Currency</h3>
                  <p className="mt-1 text-xs font-semibold text-gray-500 dark:text-gray-400">
                    Choose the restaurant country. Currency updates automatically, and you can still select a different symbol if needed.
                  </p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-primary-700 shadow-sm dark:bg-gray-800 dark:text-primary-200">
                  Current: {selectedCurrency}
                </span>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Country
                  <select
                    {...register('country')}
                    onChange={handleCountryChange}
                    className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                  >
                    {COUNTRY_OPTIONS.map((option) => (
                      <option key={option.country} value={option.country}>{option.country}</option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Currency
                  <select
                    {...register('currency')}
                    className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                  >
                    {COUNTRY_OPTIONS.map((option) => (
                      <option key={option.code} value={option.currency}>{option.label}</option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Timezone
                  <select
                    {...register('timezone')}
                    className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                  >
                    {COUNTRY_OPTIONS.map((option) => (
                      <option key={option.timezone} value={option.timezone}>{option.timezone}</option>
                    ))}
                  </select>
                </label>
              </div>
            </section>

            <section className="rounded-2xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
              <h3 className="text-sm font-black uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">Opening Hours</h3>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <Input label="Opening Time" type="time" {...register('openingTime')} />
                <Input label="Closing Time" type="time" {...register('closingTime')} />
              </div>
            </section>
          </div>
        </Card>

        {/* Logo Upload */}
        <Card title="Profile Photo / Restaurant Logo">
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Upload your restaurant profile image. Use a square 4x4 style photo, recommended 512x512 px. Max 1 MB.
            </p>
            
            {/* Logo Preview */}
            {logoPreview && (
              <div className="relative inline-block">
                <div className="w-32 h-32 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700 overflow-hidden flex items-center justify-center">
                  <img src={logoPreview} alt="Logo preview" className="max-w-full max-h-full object-contain" />
                </div>
                <button
                  type="button"
                  onClick={() => setShowLogoPreview(true)}
                  className="absolute top-2 right-2 p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <FiEye size={16} />
                </button>
              </div>
            )}
            
            {/* Logo Upload Input */}
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center hover:border-primary-500 transition">
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="hidden"
                id="logo-input"
              />
              <label htmlFor="logo-input" className="cursor-pointer">
                <div className="flex flex-col items-center gap-2">
                  <FiUpload size={24} className="text-gray-400 dark:text-gray-500" />
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Click to upload logo</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG, WEBP. Square 512x512 px. Max 1 MB.</p>
                </div>
              </label>
            </div>
            
            {logoFile && (
              <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                <span className="text-sm text-green-800 dark:text-green-300">
                  ✓ Logo ready to upload: {logoFile.name}
                </span>
                <button
                  type="button"
                  onClick={clearLogo}
                  className="p-1 hover:bg-green-200 rounded transition"
                >
                  <FiX size={16} className="text-green-600" />
                </button>
              </div>
            )}
          </div>
        </Card>

        {/* Background Photo Upload */}
        <Card title="Customer Panel Background">
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Upload a background photo that will be displayed in the customer panel. Recommended size: 1920x1080 px. Max 1 MB.
            </p>
            
            {/* Background Preview */}
            {backgroundPreview && (
              <div className="relative inline-block w-full">
                <div className="w-full h-40 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700 overflow-hidden flex items-center justify-center">
                  <img src={backgroundPreview} alt="Background preview" className="w-full h-full object-cover" />
                </div>
                <button
                  type="button"
                  onClick={() => setShowBackgroundPreview(true)}
                  className="absolute top-2 right-2 p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <FiEye size={16} />
                </button>
              </div>
            )}
            
            {/* Background Upload Input */}
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center hover:border-primary-500 transition">
              <input
                type="file"
                accept="image/*"
                onChange={handleBackgroundChange}
                className="hidden"
                id="background-input"
              />
              <label htmlFor="background-input" className="cursor-pointer">
                <div className="flex flex-col items-center gap-2">
                  <FiUpload size={24} className="text-gray-400 dark:text-gray-500" />
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Click to upload background photo</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG, WEBP. 1920x1080 px. Max 1 MB.</p>
                </div>
              </label>
            </div>
            
            {backgroundFile && (
              <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                <span className="text-sm text-green-800 dark:text-green-300">
                  ✓ Background ready to upload: {backgroundFile.name}
                </span>
                <button
                  type="button"
                  onClick={clearBackground}
                  className="p-1 hover:bg-green-200 rounded transition"
                >
                  <FiX size={16} className="text-green-600" />
                </button>
              </div>
            )}
          </div>
        </Card>

        {/* Save Button */}
        <div className="flex gap-3">
          <Button type="submit" loading={loading}>
            Save All Changes
          </Button>
          <Button 
            type="button" 
            variant="secondary"
            onClick={() => window.location.reload()}
          >
            Cancel
          </Button>
        </div>
      </form>

      {/* Subscription Settings */}
      <Card title="Subscription Settings">
        <div className="flex justify-between items-center">
          <div>
            <p className="font-medium">Auto-renew Subscription</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Automatically renew your plan when it expires</p>
          </div>
          <button
            onClick={toggleAutoRenew}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              restaurant?.autoRenew ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                restaurant?.autoRenew ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </Card>

      {/* Image Preview Modals */}
      {showLogoPreview && logoPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg max-w-md w-full">
            <div className="p-4 border-b dark:border-gray-800 flex justify-between items-center">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Logo Preview</h3>
              <button
                onClick={() => setShowLogoPreview(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition"
              >
                <FiX size={20} />
              </button>
            </div>
            <div className="p-6 flex justify-center bg-gray-50 dark:bg-gray-800">
              <img src={logoPreview} alt="Logo" className="max-w-full max-h-96 object-contain" />
            </div>
          </div>
        </div>
      )}

      {showBackgroundPreview && backgroundPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg max-w-2xl w-full">
            <div className="p-4 border-b dark:border-gray-800 flex justify-between items-center">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Background Preview</h3>
              <button
                onClick={() => setShowBackgroundPreview(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition"
              >
                <FiX size={20} />
              </button>
            </div>
            <div className="p-6 flex justify-center bg-gray-50 dark:bg-gray-800">
              <img src={backgroundPreview} alt="Background" className="max-w-full max-h-96 object-cover rounded" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Settings
