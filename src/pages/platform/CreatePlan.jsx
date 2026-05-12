import React, { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import { FiArrowLeft, FiCheckCircle, FiCreditCard, FiList, FiPlus, FiSliders } from 'react-icons/fi'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { DEFAULT_CURRENCY_SYMBOL } from '../../utils/currency'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import { PlatformMetric, PlatformPageHeader } from '../../components/platform/PlatformUI'

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
  maxTables: 'Max Tables',
  maxEmployees: 'Max Employees',
  maxCategories: 'Max Categories',
  maxMenuItems: 'Max Menu Items',
}

const CreatePlan = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [billing, setBilling] = useState(null)
  const [featureOptions, setFeatureOptions] = useState([])
  const [selectedFeatureFlags, setSelectedFeatureFlags] = useState({})
  const [limitState, setLimitState] = useState({
    maxTables: { selectValue: '0', customValue: '' },
    maxEmployees: { selectValue: '0', customValue: '' },
    maxCategories: { selectValue: '0', customValue: '' },
    maxMenuItems: { selectValue: '0', customValue: '' },
  })
  const { register, handleSubmit, setValue, control, watch, formState: { errors } } = useForm()
  const priceExclWatch = watch('priceExclVat')

  useEffect(() => {
    api.get('/platform/billing/settings')
      .then((res) => setBilling(res.data.data))
      .catch(() => setBilling(null))
  }, [])

  useEffect(() => {
    api.get('/platform/subscriptions/plan-feature-options')
      .then((res) => {
        const options = res.data?.data?.features || []
        setFeatureOptions(options)
        setSelectedFeatureFlags((prev) => {
          const next = {}
          options.forEach((opt) => {
            next[opt.key] = prev[opt.key] !== false
          })
          return next
        })
      })
      .catch(() => {
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
  const { fields, append, remove } = useFieldArray({ control, name: 'features' })

  useEffect(() => {
    if (id) fetchPlan()
    else {
      append({ feature: '' })
    }
  }, [id])

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
        plan.priceExclVat != null ? plan.priceExclVat : plan.pricing?.priceExclVat ?? ''
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
      setSelectedFeatureFlags((prev) => ({ ...prev, ...incomingFlags }))
      plan.features?.forEach(f => append({ feature: f }))
    } catch (error) {
      toast.error('Failed to fetch plan')
    }
  }

  const onSubmit = async (data) => {
    try {
      setLoading(true)
      const limits = {}
      for (const key of LIMIT_KEYS) {
        const state = limitState[key]
        if (state.selectValue === CUSTOM_LIMIT_VALUE) {
          const parsed = Number(state.customValue)
          if (Number.isNaN(parsed) || parsed < 0) {
            toast.error(`${LIMIT_LABELS[key]} custom value must be a valid non-negative number`)
            setLoading(false)
            return
          }
          limits[key] = parsed
        } else {
          limits[key] = Number(state.selectValue || 0)
        }
      }

      const payload = {
        ...data,
        limits,
        featureFlags: selectedFeatureFlags,
        features: data.features?.map(f => f.feature).filter(Boolean) || [],
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
    <div className="mx-auto max-w-5xl space-y-6">
      <PlatformPageHeader
        badge={id ? 'Edit Package' : 'New Package'}
        title={`${id ? 'Edit' : 'Create'} Subscription Plan`}
        description="Configure plan pricing, VAT preview, restaurant limits, and feature bullets."
        icon={FiCreditCard}
        actions={<Button type="button" variant="secondary" onClick={() => navigate('/platform/subscriptions')}><FiArrowLeft className="mr-2" />Back</Button>}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <PlatformMetric label="Pricing" value={pricePreview ? `${pricePreview.sym}${pricePreview.total.toFixed(2)}` : 'Set price'} sub="Grand total incl. VAT" icon={FiCreditCard} accent="from-blue-500 to-indigo-500" />
        <PlatformMetric label="Limits" value={LIMIT_KEYS.length} sub="Restaurant resources" icon={FiSliders} accent="from-emerald-500 to-teal-500" />
        <PlatformMetric
          label="Features"
          value={Object.values(selectedFeatureFlags).filter(Boolean).length}
          sub="Enabled platform features"
          icon={FiList}
          accent="from-amber-500 to-orange-500"
        />
      </div>

      <Card title="Plan Builder" icon={FiCreditCard}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            label="Plan Name"
            {...register('name', { required: 'Plan name is required' })}
            error={errors.name?.message}
          />

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Plan Type</label>
            <select {...register('planType', { required: 'Plan type is required' })} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100">
              <option value="">Select Type</option>
              <option value="basic">Basic</option>
              <option value="standard">Standard</option>
              <option value="premium">Premium</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Duration (days)"
              type="number"
              {...register('duration', { required: 'Duration is required', min: 1 })}
              error={errors.duration?.message}
            />
            <Input
              label="Duration Label"
              placeholder="e.g., Monthly, Yearly"
              {...register('durationLabel')}
            />
          </div>

          <Input
            label="Price excluding VAT (base amount)"
            type="number"
            step="0.01"
            {...register('priceExclVat', { required: 'Base price is required', min: 0 })}
            error={errors.priceExclVat?.message}
          />
          {billing && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Platform VAT rate: <strong>{Number(billing.vatRatePercent ?? 0).toFixed(2)}%</strong> (change under Settings → Billing &amp; VAT).
            </p>
          )}
          {pricePreview && (
            <div className="space-y-1 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
              <p className="font-medium text-gray-900 dark:text-gray-100">Charge preview (what restaurants pay)</p>
              <p>Subtotal (excl. VAT): {pricePreview.sym}{pricePreview.excl.toFixed(2)}</p>
              <p>VAT ({pricePreview.rate}%): {pricePreview.sym}{pricePreview.vat.toFixed(2)}</p>
              <p className="border-t border-gray-200 pt-1 font-semibold text-gray-900 dark:border-gray-700 dark:text-gray-100">
                Grand total (incl. VAT): {pricePreview.sym}{pricePreview.total.toFixed(2)}
              </p>
            </div>
          )}

          <div className="border-t border-gray-200 pt-4 dark:border-gray-800">
            <h3 className="mb-3 flex items-center gap-2 font-semibold text-gray-900 dark:text-gray-100"><FiSliders /> Plan Limits</h3>
            <div className="grid grid-cols-2 gap-4">
              {LIMIT_KEYS.map((key) => (
                <div key={key}>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{LIMIT_LABELS[key]}</label>
                  <select
                    value={limitState[key].selectValue}
                    onChange={(e) => setLimitState((prev) => ({
                      ...prev,
                      [key]: {
                        ...prev[key],
                        selectValue: e.target.value,
                      },
                    }))}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                  >
                    {LIMIT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                    <option value={CUSTOM_LIMIT_VALUE}>Custom</option>
                  </select>
                  {limitState[key].selectValue === CUSTOM_LIMIT_VALUE && (
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={limitState[key].customValue}
                      onChange={(e) => setLimitState((prev) => ({
                        ...prev,
                        [key]: {
                          ...prev[key],
                          customValue: e.target.value,
                        },
                      }))}
                      placeholder="Enter custom limit"
                      className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                    />
                  )}
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Set to Unlimited when you do not want to restrict that resource.</p>
          </div>

          <div className="border-t border-gray-200 pt-4 dark:border-gray-800">
            <h3 className="mb-3 flex items-center gap-2 font-semibold text-gray-900 dark:text-gray-100"><FiCheckCircle /> Restaurant platform feature access</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {featureOptions.map((opt) => (
                <label key={opt.key} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedFeatureFlags[opt.key] !== false}
                      onChange={(e) =>
                        setSelectedFeatureFlags((prev) => ({
                          ...prev,
                          [opt.key]: e.target.checked,
                        }))
                      }
                      className="mt-1"
                    />
                    <span>
                      <span className="block font-semibold text-gray-900 dark:text-gray-100">{opt.label}</span>
                      <span className="block text-xs text-gray-500 dark:text-gray-400">{opt.description}</span>
                    </span>
                  </div>
                </label>
              ))}
            </div>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              These toggles decide which restaurant modules are included in this subscription plan.
            </p>
          </div>

          <div className="border-t border-gray-200 pt-4 dark:border-gray-800">
            <h3 className="mb-3 flex items-center gap-2 font-semibold text-gray-900 dark:text-gray-100"><FiCheckCircle /> Features</h3>
            {fields.map((field, index) => (
              <div key={field.id} className="flex gap-2 mb-2">
                <Input
                  placeholder="Enter feature"
                  {...register(`features.${index}.feature`)}
                  className="flex-1"
                />
                <button type="button" onClick={() => remove(index)} className="px-3 py-2 text-red-500 hover:text-red-700">Remove</button>
              </div>
            ))}
            <button type="button" onClick={() => append({ feature: '' })} className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700">
              <FiPlus className="mr-1" /> Add Feature
            </button>
          </div>

          <label className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
            <input type="checkbox" {...register('isPopular')} />
            <span className="text-sm">Mark as Popular</span>
          </label>

          <div className="flex gap-3 pt-4">
            <Button type="submit" loading={loading}>{id ? 'Update' : 'Create'} Plan</Button>
            <Button type="button" variant="secondary" onClick={() => navigate('/platform/subscriptions')}>Cancel</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

export default CreatePlan
