import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { useSearchParams } from 'react-router-dom'
import toast from '@utils/toast'
import { FiX } from 'react-icons/fi'
import api from '../../services/api'
import Button from '../../components/common/Button'
import { useAuth } from '../../hooks/useAuth'
import { usePlanAccess } from '../../hooks/usePlanAccess'
import { useTheme } from '../../context/ThemeContext'
import { DEFAULT_THEME_SETTINGS, normalizeThemeSettings } from '../../theme/themePresets'
import {
  currencyForCountry,
  DEFAULT_BACKUP_SECTIONS,
  IMAGE_MAX_BYTES,
} from '../../components/restaurant/settings/settingsConstants'
import { useCountriesCatalog } from '../../hooks/useCountriesCatalog'
import { useLocationCascade } from '../../hooks/useLocationCascade'
import { getSectionById } from '../../components/restaurant/settings/settingsConfig'
import LoyaltySettingsSection from '../../components/restaurant/settings/LoyaltySettingsSection'
import SettingsHub from '../../components/restaurant/settings/SettingsHub'
import SettingsSectionShell from '../../components/restaurant/settings/SettingsSectionShell'
import NotificationsSettingsSection from '../../components/restaurant/settings/NotificationsSettingsSection'
import BackupSettingsSection from '../../components/restaurant/settings/BackupSettingsSection'
import ThemeSettingsSection from '../../components/restaurant/settings/ThemeSettingsSection'
import ProfileSettingsSection from '../../components/restaurant/settings/ProfileSettingsSection'
import { useRestaurantAutoRefresh } from '../../context/RestaurantRealtimeContext'
import BrandingSettingsSection from '../../components/restaurant/settings/BrandingSettingsSection'
import SubscriptionSettingsSection from '../../components/restaurant/settings/SubscriptionSettingsSection'

const FORM_SECTIONS = new Set(['profile', 'branding', 'themes'])

const Settings = () => {
  const { isFeatureEnabled } = usePlanAccess()
  const [loading, setLoading] = useState(false)
  const [restaurant, setRestaurant] = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)
  const [backgroundPreview, setBackgroundPreview] = useState(null)
  const [logoFile, setLogoFile] = useState(null)
  const [backgroundFile, setBackgroundFile] = useState(null)
  const [faviconPreview, setFaviconPreview] = useState(null)
  const [brandBackgroundPreview, setBrandBackgroundPreview] = useState(null)
  const faviconFileRef = useRef(null)
  const brandBackgroundFileRef = useRef(null)
  const [showLogoPreview, setShowLogoPreview] = useState(false)
  const [showBackgroundPreview, setShowBackgroundPreview] = useState(false)
  const [themeDraft, setThemeDraft] = useState(() => normalizeThemeSettings(DEFAULT_THEME_SETTINGS))
  const [themeSaving, setThemeSaving] = useState(false)
  const [backupBusy, setBackupBusy] = useState(false)
  const [backupHistory, setBackupHistory] = useState([])
  const [backupSchedules, setBackupSchedules] = useState([])
  const [restorePreview, setRestorePreview] = useState(null)
  const [restoreFile, setRestoreFile] = useState(null)
  const [restoreMode, setRestoreMode] = useState('merge')
  const [backupSections, setBackupSections] = useState([...DEFAULT_BACKUP_SECTIONS])
  const [searchParams, setSearchParams] = useSearchParams()
  const activeSection = searchParams.get('section')
  const { mergeUser } = useAuth()
  const { updateTheme, applyRemoteTheme, resetTheme } = useTheme()
  const { register, handleSubmit, setValue, watch, control, formState: { errors } } = useForm({
    defaultValues: {
      country: 'Nepal',
      currency: 'Rs.',
      timezone: 'Asia/Kathmandu',
    },
  })
  const {
    rows: countryRows,
    loading: countriesLoading,
    currencyOptions: catalogCurrencyOptions,
    resolveRow,
    timezoneOptionsFor,
    ensureSavedLocale,
  } = useCountriesCatalog()

  const selectedCountry = watch('country') || restaurant?.country || 'Nepal'
  const selectedState = watch('state') || restaurant?.state || ''
  const selectedDistrict = watch('district') || restaurant?.district || ''
  const selectedLocalLevel = watch('localLevel') || restaurant?.localLevel || ''
  const selectedCurrency = watch('currency') || restaurant?.settings?.currency || resolveRow(selectedCountry)?.currency || 'Rs.'
  const selectedTimezone = watch('timezone') || restaurant?.settings?.timezone || resolveRow(selectedCountry)?.timezone || 'Asia/Kathmandu'

  const {
    statesLoading,
    districtsLoading,
    stateOptions: cascadeStateOptions,
    districtOptions: cascadeDistrictOptions,
    localLevelOptions: cascadeLocalLevelOptions,
    hasStates,
    hasDistricts,
    districtsError,
  } = useLocationCascade({
    countryName: selectedCountry,
    selectedState,
    selectedDistrict,
    selectedLocalLevel,
  })

  const stateOptions = useMemo(
    () => cascadeStateOptions,
    [cascadeStateOptions],
  )

  const districtOptions = useMemo(
    () => cascadeDistrictOptions,
    [cascadeDistrictOptions],
  )

  const localLevelOptions = useMemo(() => {
    const base = [...cascadeLocalLevelOptions]
    if (selectedLocalLevel && !base.some((o) => o.value === selectedLocalLevel)) {
      base.unshift({ value: selectedLocalLevel, label: `${selectedLocalLevel} (current)` })
    }
    return base
  }, [cascadeLocalLevelOptions, selectedLocalLevel])

  const countryOptions = useMemo(
    () => ensureSavedLocale(restaurant).map((r) => ({ value: r.country, label: r.label || r.country })),
    [countryRows, restaurant?.country, restaurant?.settings?.currency, restaurant?.settings?.timezone],
  )

  const currencyOptions = useMemo(() => {
    const base = [...catalogCurrencyOptions]
    const current = selectedCurrency || restaurant?.settings?.currency
    if (current && !base.some((o) => o.value === current)) {
      base.unshift({ value: current, label: `${current} (current)` })
    }
    return base
  }, [catalogCurrencyOptions, selectedCurrency, restaurant?.settings?.currency])

  const timezoneOptions = useMemo(() => {
    const base = timezoneOptionsFor(selectedCountry)
    if (selectedTimezone && !base.some((o) => o.value === selectedTimezone)) {
      return [{ value: selectedTimezone, label: selectedTimezone.replace(/_/g, ' ') }, ...base]
    }
    return base
  }, [timezoneOptionsFor, selectedCountry, selectedTimezone])

  const fetchRestaurant = async () => {
    try {
      const res = await api.get('/restaurant/auth/profile')
      setRestaurant(res.data.data)
      
      // Set form values (name is read-only)
      setValue('name', res.data.data.name)
      setValue('phone', res.data.data.phone)
      setValue('address', res.data.data.address)
      setValue('city', res.data.data.city || '')
      setValue('state', res.data.data.state || '')
      setValue('district', res.data.data.district || '')
      setValue('localLevel', res.data.data.localLevel || '')
      setValue('pincode', res.data.data.pincode || '')
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
          timezone: updatedRestaurant?.settings?.timezone,
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

  const handleCountrySelect = (countryName) => {
    const option = resolveRow(countryName) || currencyForCountry(countryName)
    setValue('country', option.country, { shouldDirty: true, shouldValidate: true })
    setValue('currency', option.currency, { shouldDirty: true, shouldValidate: true })
    setValue('timezone', option.timezone, { shouldDirty: true, shouldValidate: true })
    setValue('state', '', { shouldDirty: true })
    setValue('district', '', { shouldDirty: true })
    setValue('localLevel', '', { shouldDirty: true })
  }

  const onSubmit = async (data) => {
    try {
      setLoading(true)
      const formData = new FormData()

      // Only append values that are actually present â€” otherwise FormData
      // serialises `undefined` / `null` to the literal strings "undefined"
      // / "null", which then get persisted into MongoDB.
      const appendIfPresent = (key, value) => {
        if (value === undefined || value === null) return
        const str = String(value)
        if (!str.trim()) return
        formData.append(key, str)
      }

      if (String(data.phone || '').trim()) {
        formData.append('phone', String(data.phone).trim())
      }
      formData.append('state', String(data.state || restaurant?.state || '').trim())
      formData.append('district', String(data.district || restaurant?.district || '').trim())
      formData.append('localLevel', String(data.localLevel || restaurant?.localLevel || '').trim())
      formData.append('city', String(data.city || restaurant?.city || '').trim())
      formData.append('address', String(data.address || restaurant?.address || '').trim())
      formData.append('pincode', String(data.pincode || '').trim())
      formData.append('country', String(data.country || restaurant?.country || 'Nepal').trim())
      formData.append('currency', String(data.currency || restaurant?.settings?.currency || 'Rs.').trim())
      formData.append('timezone', String(data.timezone || restaurant?.settings?.timezone || 'Asia/Kathmandu').trim())
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
      if (faviconFileRef.current) {
        formData.append('favicon', faviconFileRef.current)
      }
      if (brandBackgroundFileRef.current) {
        formData.append('brandBackgroundImage', brandBackgroundFileRef.current)
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
          timezone: updatedRestaurant?.settings?.timezone,
          themeSettings: updatedRestaurant?.settings?.themeSettings,
        })
        applyRemoteTheme(updatedRestaurant?.settings?.themeSettings)
      }
      
      toast.success('Settings updated successfully')
      setLogoFile(null)
      setBackgroundFile(null)
      faviconFileRef.current = null
      brandBackgroundFileRef.current = null
      await fetchRestaurant()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update settings')
    } finally {
      setLoading(false)
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

  useRestaurantAutoRefresh(() => {
    fetchRestaurant()
    fetchBackupHistory()
  }, [])

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

  const setActiveSection = (sectionId) => {
    if (!sectionId) {
      setSearchParams({}, { replace: true })
      return
    }
    setSearchParams({ section: sectionId }, { replace: true })
  }

  const openSection = (sectionId) => {
    if (sectionId === 'backup' && !isFeatureEnabled('backup')) return
    if (!getSectionById(sectionId)) return
    setActiveSection(sectionId)
  }

  useEffect(() => {
    if (!activeSection) return
    if (activeSection === 'backup' && !isFeatureEnabled('backup')) {
      setSearchParams({}, { replace: true })
      return
    }
    if (!getSectionById(activeSection)) {
      setSearchParams({}, { replace: true })
    }
  }, [activeSection, isFeatureEnabled, setSearchParams])

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'notifications':
        return <NotificationsSettingsSection />
      case 'loyalty':
        return <LoyaltySettingsSection />
      case 'backup':
        return (
          <BackupSettingsSection
            backupBusy={backupBusy}
            backupHistory={backupHistory}
            backupSchedules={backupSchedules}
            backupSections={backupSections}
            completedBackups={completedBackups}
            latestBackup={latestBackup}
            restoreFile={restoreFile}
            restorePreview={restorePreview}
            restoreMode={restoreMode}
            formatBackupSize={formatBackupSize}
            onRefresh={fetchBackupHistory}
            onCreateBackup={createBackup}
            onToggleSection={toggleBackupSection}
            onSaveSchedule={saveBackupSchedule}
            onRestoreFileChange={(e) => {
              setRestoreFile(e.target.files?.[0] || null)
              setRestorePreview(null)
            }}
            onRestoreModeChange={(e) => {
              setRestoreMode(e.target.value)
              setRestorePreview(null)
            }}
            onPreviewRestore={previewRestore}
            onRunRestore={runRestore}
            onDownload={downloadBackup}
            onDelete={deleteBackup}
          />
        )
      case 'themes':
        return (
          <ThemeSettingsSection
            themeDraft={themeDraft}
            themeSaving={themeSaving}
            faviconPreview={faviconPreview}
            brandBackgroundPreview={brandBackgroundPreview}
            onResetTheme={resetThemeDraft}
            onUpdateTheme={updateThemeDraft}
            onFaviconChange={handleBrandAssetChange((file) => { faviconFileRef.current = file }, setFaviconPreview)}
            onBrandBackgroundChange={handleBrandAssetChange((file) => { brandBackgroundFileRef.current = file }, setBrandBackgroundPreview)}
          />
        )
      case 'profile':
        return (
          <ProfileSettingsSection
            restaurant={restaurant}
            register={register}
            control={control}
            setValue={setValue}
            errors={errors}
            selectedCountry={selectedCountry}
            selectedState={selectedState}
            selectedCurrency={selectedCurrency}
            selectedTimezone={selectedTimezone}
            countryOptions={countryOptions}
            currencyOptions={currencyOptions}
            timezoneOptions={timezoneOptions}
            countriesLoading={countriesLoading}
            onCountrySelect={handleCountrySelect}
            stateOptions={stateOptions}
            districtOptions={districtOptions}
            localLevelOptions={localLevelOptions}
            statesLoading={statesLoading}
            districtsLoading={districtsLoading}
            hasDistricts={hasDistricts}
            districtsError={districtsError}
            hasStates={hasStates}
          />
        )
      case 'branding':
        return (
          <BrandingSettingsSection
            logoPreview={logoPreview}
            backgroundPreview={backgroundPreview}
            logoFile={logoFile}
            backgroundFile={backgroundFile}
            onLogoChange={handleLogoChange}
            onBackgroundChange={handleBackgroundChange}
            onClearLogo={clearLogo}
            onClearBackground={clearBackground}
            onShowLogoPreview={() => setShowLogoPreview(true)}
            onShowBackgroundPreview={() => setShowBackgroundPreview(true)}
          />
        )
      case 'subscription':
        return (
          <SubscriptionSettingsSection restaurant={restaurant} />
        )
      default:
        return null
    }
  }

  const saveFooter = FORM_SECTIONS.has(activeSection) ? (
    <>
      <Button type="submit" loading={loading}>
        Save changes
      </Button>
      <Button type="button" variant="secondary" onClick={() => window.location.reload()}>
        Cancel
      </Button>
    </>
  ) : null

  if (!activeSection) {
    return (
      <div className="mx-auto max-w-6xl">
        <SettingsHub onSelectSection={openSection} isFeatureEnabled={isFeatureEnabled} />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl">
      <form onSubmit={handleSubmit(onSubmit)}>
        <SettingsSectionShell
          sectionId={activeSection}
          onBack={() => setActiveSection(null)}
          footer={saveFooter}
        >
          {renderSectionContent()}
        </SettingsSectionShell>
      </form>

      {showLogoPreview && logoPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white dark:bg-gray-900">
            <div className="flex items-center justify-between border-b p-4 dark:border-gray-800">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Logo Preview</h3>
              <button
                type="button"
                onClick={() => setShowLogoPreview(false)}
                className="rounded p-1 transition hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <FiX size={20} />
              </button>
            </div>
            <div className="flex justify-center bg-gray-50 p-6 dark:bg-gray-800">
              <img src={logoPreview} alt="Logo" className="max-h-96 max-w-full object-contain" />
            </div>
          </div>
        </div>
      )}

      {showBackgroundPreview && backgroundPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-lg bg-white dark:bg-gray-900">
            <div className="flex items-center justify-between border-b p-4 dark:border-gray-800">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Background Preview</h3>
              <button
                type="button"
                onClick={() => setShowBackgroundPreview(false)}
                className="rounded p-1 transition hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <FiX size={20} />
              </button>
            </div>
            <div className="flex justify-center bg-gray-50 p-6 dark:bg-gray-800">
              <img src={backgroundPreview} alt="Background" className="max-h-96 max-w-full rounded object-cover" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Settings
