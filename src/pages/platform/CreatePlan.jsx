import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import { FiArrowLeft, FiCreditCard, FiList, FiPlus, FiSliders, FiTag } from 'react-icons/fi'
import toast from '@utils/toast'
import api from '../../services/api'
import { DEFAULT_CURRENCY_SYMBOL } from '../../utils/currency'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import { PlatformMetric, PlatformPageHeader } from '../../components/platform/PlatformUI'
import PlanFeatureSelector from '../../components/platform/PlanFeatureSelector'
import { mergeMarketingBullets } from '../../utils/planMarketingBullets'

const LIMIT_OPTIONS = [
  { value: '0', label: 'Unlimited' },
  { value: '5', label: '5' },
  { value: '10', label: '10' },
  { value: '25', label: '25' },
  { value: '50', label: '50' },
  { value: '100', label: '100' },
]
const CUSTOM_LIMIT_VALUE = '__custom__'
const LIMIT_KEYS = ['maxTables', 'maxEmployees', 'maxCategories', 'maxMenuItems']
const LIMIT_LABELS = {
  maxTables: 'Max tables',
  maxEmployees: 'Max staff',
  maxCategories: 'Max categories',
  maxMenuItems: 'Max menu items',
}

const CreatePlan = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [billing, setBilling] = useState(null)
  const [featureOptions, setFeatureOptions] = useState([])
  const [featureGroups, setFeatureGroups] = useState([])
  const [selectedFeatureFlags, setSelectedFeatureFlags] = useState({})
  const [limitState, setLimitState] = useState({
    maxTables: { selectValue: '0', customValue: '' },
    maxEmployees: { selectValue: '0', customValue: '' },
    maxCategories: { selectValue: '0', customValue: '' },
    maxMenuItems: { selectValue: '0', customValue: '' },
  })
  const { register, handleSubmit, setValue, getValues, control, watch, formState: { errors } } = useForm()
  const priceExclWatch = watch('priceExclVat')
  const skipBulletsSyncRef = useRef(false)
  const planLoadedRef = useRef(false)

  useEffect(() => {
    api.get('/platform/billing/settings')
      .then((res) => setBilling(res.data.data))
      .catch(() => setBilling(null))
  }, [])

  useEffect(() => {
    api
      .get('/platform/subscriptions/plan-feature-options')
      .then((res) => {
        const options = res.data?.data?.features || []
        const groups = res.data?.data?.groups || []
        setFeatureOptions(options)
        setFeatureGroups(groups)
        setSelectedFeatureFlags((prev) => {
          const next = { ...prev }
          options.forEach((opt) => {
            if (next[opt.key] === undefined) next[opt.key] = true
          })
          return next
        })
      })
      .catch(() => {
        toast.error('Could not load plan modules')
        setFeatureOptions([])
      })
  }, [])

  const pricePreview = useMemo(() => {
    if (!billing) return null
    const excl = Number(priceExclWatch)
    if (priceExclWatch === '' || priceExclWatch == null || Number.isNaN(excl) || excl < 0) return null
    const rate = Number(billing.vatRatePercent) || 0
    const vat = Math.round(excl * (rate / 100) * 100) / 100
    const total = Math.round((excl + vat) * 100) / 100
    return {
      excl,
      vat,
      total,
      rate,
      sym: billing.currencySymbol || DEFAULT_CURRENCY_SYMBOL,
    }
  }, [billing, priceExclWatch])

  const enabledModules = useMemo(
    () => featureOptions.filter((o) => selectedFeatureFlags[o.key] !== false).length,
    [featureOptions, selectedFeatureFlags],
  )

  const { fields, append, remove, replace: replaceBullets } = useFieldArray({ control, name: 'features' })

  const applyMarketingBullets = useCallback(
    (flags, existingBullets) => {
      const merged = mergeMarketingBullets({
        featureOptions,
        featureGroups,
        flags,
        existingBullets,
      })
      if (merged.length) {
        replaceBullets(merged.map((feature) => ({ feature })))
      } else {
        replaceBullets([{ feature: '' }])
      }
    },
    [featureOptions, featureGroups, replaceBullets],
  )

  const handleFeatureFlagsChange = useCallback(
    (flags) => {
      setSelectedFeatureFlags(flags)
      if (skipBulletsSyncRef.current) return
      const current = (getValues('features') || []).flatMap((row) => {
        const feature = row?.feature
        return feature ? [feature] : []
      })
      applyMarketingBullets(flags, current)
    },
    [applyMarketingBullets, getValues],
  )

  const fetchPlan = async () => {
    try {
      const res = await api.get(`/platform/subscriptions/plans/${id}`)
      const plan = res.data.data
      setValue('name', plan.name)
      setValue('planType', plan.planType)
      setValue('duration', plan.duration)
      setValue('durationLabel', plan.durationLabel)
      setValue(
        'priceExclVat',
        plan.priceExclVat != null ? plan.priceExclVat : plan.pricing?.priceExclVat ?? '',
      )
      const nextLimitState = {}
      LIMIT_KEYS.forEach((key) => {
        const rawValue = Number(plan.limits?.[key] ?? 0)
        const hasPreset = LIMIT_OPTIONS.some((opt) => Number(opt.value) === rawValue)
        nextLimitState[key] = hasPreset
          ? { selectValue: String(rawValue), customValue: '' }
          : { selectValue: CUSTOM_LIMIT_VALUE, customValue: String(rawValue) }
      })
      setLimitState(nextLimitState)
      setValue('isPopular', plan.isPopular)
      const incomingFlags = plan.featureFlags && typeof plan.featureFlags === 'object' ? plan.featureFlags : {}
      skipBulletsSyncRef.current = true
      const nextFlags = {}
      featureOptions.forEach((opt) => {
        nextFlags[opt.key] =
          incomingFlags[opt.key] !== undefined ? incomingFlags[opt.key] !== false : true
      })
      Object.keys(incomingFlags).forEach((key) => {
        if (incomingFlags[key] !== undefined) nextFlags[key] = incomingFlags[key] !== false
      })
      setSelectedFeatureFlags(nextFlags)

      const savedBullets = plan.features?.length
        ? plan.features
        : mergeMarketingBullets({
            featureOptions,
            featureGroups,
            flags: nextFlags,
            existingBullets: [],
          })
      replaceBullets(
        savedBullets.length ? savedBullets.map((feature) => ({ feature })) : [{ feature: '' }],
      )
      planLoadedRef.current = true
      skipBulletsSyncRef.current = false
    } catch {
      toast.error('Failed to fetch plan')
    }
  }

  useEffect(() => {
    planLoadedRef.current = false
  }, [id])

  useEffect(() => {
    if (!featureOptions.length || planLoadedRef.current) return
    if (id) {
      fetchPlan()
      return
    }
    planLoadedRef.current = true
    const flags = {}
    featureOptions.forEach((opt) => {
      flags[opt.key] = true
    })
    applyMarketingBullets(flags, [])
  }, [id, featureOptions.length, applyMarketingBullets])

  const onSubmit = async (data) => {
    try {
      setLoading(true)
      const limits = {}
      for (const key of LIMIT_KEYS) {
        const state = limitState[key]
        if (state.selectValue === CUSTOM_LIMIT_VALUE) {
          const parsed = Number(state.customValue)
          if (Number.isNaN(parsed) || parsed < 0) {
            toast.error(`${LIMIT_LABELS[key]} must be a valid non-negative number`)
            setLoading(false)
            return
          }
          limits[key] = parsed
        } else {
          limits[key] = Number(state.selectValue || 0)
        }
      }

      const manualBullets = data.features?.flatMap((f) => (f.feature ? [f.feature] : [])) || []
      const pricingBullets = mergeMarketingBullets({
        featureOptions,
        featureGroups,
        flags: selectedFeatureFlags,
        existingBullets: manualBullets,
      })

      const payload = {
        ...data,
        limits,
        featureFlags: selectedFeatureFlags,
        features: pricingBullets,
      }
      if (id) {
        await api.put(`/platform/subscriptions/plans/${id}`, payload)
        toast.success('Plan updated')
      } else {
        await api.post('/platform/subscriptions/plans', payload)
        toast.success('Plan created')
      }
      navigate('/platform/subscriptions')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PlatformPageHeader
        badge={id ? 'Edit plan' : 'New plan'}
        title={`${id ? 'Edit' : 'Create'} subscription plan`}
        description="Set pricing, resource limits, and which restaurant modules this package includes."
        icon={FiCreditCard}
        actions={
          <Button type="button" variant="secondary" onClick={() => navigate('/platform/subscriptions')}>
            <FiArrowLeft className="mr-2" />
            Back
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <PlatformMetric
          label="Price (incl. VAT)"
          value={pricePreview ? `${pricePreview.sym}${pricePreview.total.toFixed(2)}` : '—'}
          sub="What restaurants pay"
          icon={FiCreditCard}
          accent="from-blue-500 to-indigo-500"
        />
        <PlatformMetric
          label="Modules"
          value={enabledModules}
          sub={`of ${featureOptions.length} enabled`}
          icon={FiList}
          accent="from-amber-500 to-orange-500"
        />
        <PlatformMetric
          label="Limits"
          value={LIMIT_KEYS.length}
          sub="Resource caps"
          icon={FiSliders}
          accent="from-emerald-500 to-teal-500"
        />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card title="Plan details" icon={FiCreditCard}>
          <div className="grid gap-5 lg:grid-cols-2">
            <Input
              label="Plan name"
              placeholder="e.g. Professional Monthly"
              {...register('name', { required: 'Plan name is required' })}
              error={errors.name?.message}
            />
            <div>
              <label htmlFor="create-plan-tier" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Plan tier
              </label>
              <select
                id="create-plan-tier"
                {...register('planType', { required: 'Plan type is required' })}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              >
                <option value="">Select tier</option>
                <option value="basic">Basic</option>
                <option value="standard">Standard</option>
                <option value="premium">Premium</option>
              </select>
            </div>
            <Input
              label="Duration (days)"
              type="number"
              {...register('duration', { required: 'Duration is required', min: 1 })}
              error={errors.duration?.message}
            />
            <Input
              label="Duration label"
              placeholder="Monthly, Yearly…"
              {...register('durationLabel')}
            />
            <div className="lg:col-span-2">
              <Input
                label="Price excluding VAT"
                type="number"
                step="0.01"
                {...register('priceExclVat', { required: 'Base price is required', min: 0 })}
                error={errors.priceExclVat?.message}
              />
              {billing && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Platform VAT: {Number(billing.vatRatePercent ?? 0).toFixed(2)}%
                </p>
              )}
              {pricePreview && (
                <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm dark:border-gray-700 dark:bg-gray-800/80">
                  <p>
                    Subtotal: {pricePreview.sym}
                    {pricePreview.excl.toFixed(2)}
                  </p>
                  <p>
                    VAT ({pricePreview.rate}%): {pricePreview.sym}
                    {pricePreview.vat.toFixed(2)}
                  </p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    Total: {pricePreview.sym}
                    {pricePreview.total.toFixed(2)}
                  </p>
                </div>
              )}
            </div>
            <label className="flex items-center gap-2 lg:col-span-2">
              <input type="checkbox" {...register('isPopular')} />
              <span className="text-sm text-gray-700 dark:text-gray-300">Highlight as popular plan</span>
            </label>
          </div>
        </Card>

        <Card title="Resource limits" icon={FiSliders}>
          <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            Caps for tables, staff, categories, and menu items. Choose Unlimited (0) for no cap.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {LIMIT_KEYS.map((key) => (
              <div key={key}>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {LIMIT_LABELS[key]}
                </label>
                <select
                  value={limitState[key].selectValue}
                  onChange={(e) =>
                    setLimitState((prev) => ({
                      ...prev,
                      [key]: { ...prev[key], selectValue: e.target.value },
                    }))
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                >
                  {LIMIT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                  <option value={CUSTOM_LIMIT_VALUE}>Custom</option>
                </select>
                {limitState[key].selectValue === CUSTOM_LIMIT_VALUE && (
                  <input
                    type="number"
                    min="0"
                    value={limitState[key].customValue}
                    onChange={(e) =>
                      setLimitState((prev) => ({
                        ...prev,
                        [key]: { ...prev[key], customValue: e.target.value },
                      }))
                    }
                    placeholder="Custom limit"
                    className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-700 dark:bg-gray-900"
                  />
                )}
              </div>
            ))}
          </div>
        </Card>

        <Card title="Restaurant modules" icon={FiList}>
          <PlanFeatureSelector
            options={featureOptions}
            groups={featureGroups}
            flags={selectedFeatureFlags}
            onChange={handleFeatureFlagsChange}
            disabled={loading}
          />
        </Card>

        <Card title="Marketing bullets" icon={FiTag}>
          <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
            Shown on the public pricing page. Lines matching selected modules update automatically when you
            toggle modules above. You can add extra bullets (e.g. &quot;Priority support&quot;), they are kept
            unless they match a module name.
          </p>
          <button
            type="button"
            onClick={() => {
              const current = (getValues('features') || []).flatMap((row) => (row?.feature ? [row.feature] : []))
              applyMarketingBullets(selectedFeatureFlags, current)
              toast.success('Pricing bullets synced from modules')
            }}
            className="mb-3 text-xs font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400"
          >
            Sync bullets from modules
          </button>
          {fields.map((field, index) => (
            <div key={field.id} className="mb-2 flex gap-2">
              <Input
                placeholder="e.g. Includes payroll & inventory"
                {...register(`features.${index}.feature`)}
                className="flex-1"
              />
              <button
                type="button"
                onClick={() => remove(index)}
                className="px-3 text-sm text-red-600 hover:text-red-700"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => append({ feature: '' })}
            className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            <FiPlus className="mr-1" />
            Add bullet
          </button>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" loading={loading}>
            {id ? 'Save plan' : 'Create plan'}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/platform/subscriptions')}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}

export default CreatePlan
