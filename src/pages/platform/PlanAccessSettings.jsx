import React, { useEffect, useMemo, useState } from 'react'
import toast from '@utils/toast'
import { FiCheck, FiRefreshCw, FiSave, FiSliders, FiX } from 'react-icons/fi'
import api from '../../services/api'
import { usePlatformPageLoad } from '../../hooks/usePlatformPageLoad'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import { PlatformPageHeader } from '../../components/platform/PlatformUI'

const LIMIT_FIELDS = [
  { key: 'maxTables', label: 'Max tables', hint: 'How many tables/QR codes a trial restaurant can create.' },
  { key: 'maxEmployees', label: 'Max employees', hint: 'How many staff accounts can be added during trial.' },
  { key: 'maxCategories', label: 'Max categories', hint: 'How many menu categories can be created during trial.' },
  { key: 'maxMenuItems', label: 'Max menu items', hint: 'How many menu items can be created during trial.' },
]

const defaultLimits = {
  maxTables: 0,
  maxEmployees: 0,
  maxCategories: 0,
  maxMenuItems: 0,
}

function FeatureGrid({ group, flags, onToggle }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {group.items.map((opt) => {
        const enabled = flags[opt.key] !== false
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => onToggle(opt.key)}
            title={opt.description}
            className={`rounded-lg border px-3 py-2.5 text-left transition ${
              enabled
                ? 'border-primary-500 bg-primary-50 text-primary-900 shadow-sm dark:bg-gray-800 dark:text-gray-100'
                : 'border-gray-200 bg-white text-gray-500 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-400'
            }`}
          >
            <span className="flex items-center gap-2 text-sm font-semibold">
              {enabled ? (
                <FiCheck className="h-4 w-4 flex-shrink-0 text-emerald-600" />
              ) : (
                <FiX className="h-4 w-4 flex-shrink-0 text-gray-400" />
              )}
              {opt.label}
            </span>
            {opt.description ? (
              <span className="mt-1 block text-xs font-normal text-gray-500 dark:text-gray-400">
                {opt.description}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}

export default function PlanAccessSettings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [trialDays, setTrialDays] = useState(14)
  const [trialFlags, setTrialFlags] = useState({})
  const [trialLimits, setTrialLimits] = useState(defaultLimits)
  const [options, setOptions] = useState([])
  const [groups, setGroups] = useState([])

  const sections = useMemo(
    () =>
      groups.length
        ? groups.map((g) => ({
            ...g,
            items: options.filter((o) => o.group === g.id),
          }))
        : [{ id: 'all', label: 'Features', items: options }],
    [groups, options],
  )

  const enabledCount = useMemo(
    () => options.filter((o) => trialFlags[o.key] !== false).length,
    [options, trialFlags],
  )

  const load = async () => {
    try {
      setLoading(true)
      const res = await api.get('/platform/plan-access-settings')
      const data = res.data?.data || {}
      setTrialDays(data.trialDays ?? 14)
      setTrialFlags(data.trialFeatureFlags || {})
      setTrialLimits({ ...defaultLimits, ...(data.trialLimits || {}) })
      setOptions(data.featureOptions || [])
      setGroups(data.groups || [])
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load trial settings')
    } finally {
      setLoading(false)
    }
  }

  usePlatformPageLoad(() => {
    load()
  }, [])

  const save = async () => {
    try {
      setSaving(true)
      await api.put('/platform/plan-access-settings', {
        trialDays: Number(trialDays),
        trialFeatureFlags: trialFlags,
        trialLimits,
      })
      toast.success('Trial settings saved')
      load()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const toggleFeature = (key) => {
    setTrialFlags((prev) => ({ ...prev, [key]: prev[key] === false }))
  }

  const setAllFeatures = (enabled) => {
    const next = {}
    options.forEach((o) => {
      next[o.key] = enabled
    })
    setTrialFlags(next)
  }

  const updateLimit = (key, value) => {
    setTrialLimits((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-gray-500">Loading…</div>
    )
  }

  return (
    <div className="space-y-6">
      <PlatformPageHeader
        title="Trial settings"
        subtitle="Set how many days new restaurants get a trial and which features they can use until they subscribe."
        actions={
          <Button type="button" variant="outline" size="sm" onClick={load} disabled={saving}>
            <FiRefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        }
      />

      <Card title="Trial duration">
        <div className="max-w-xs">
          <Input
            label="Trial days for new restaurants"
            type="number"
            min={1}
            max={365}
            value={trialDays}
            onChange={(e) => setTrialDays(e.target.value)}
          />
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Applied when a restaurant completes email verification. After this period, features lock until a paid plan is assigned.
          </p>
        </div>
      </Card>

      <Card title="Trial limits" icon={FiSliders}>
        <div className="mb-4 max-w-3xl text-sm text-gray-600 dark:text-gray-400">
          Set quantity limits for restaurants while they are on trial. Use <strong>0</strong> for unlimited.
          These limits update active trial restaurants in realtime.
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {LIMIT_FIELDS.map((field) => (
            <div key={field.key} className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-950">
              <Input
                label={field.label}
                type="number"
                min={0}
                max={999999}
                value={trialLimits[field.key] ?? 0}
                onChange={(e) => updateLimit(field.key, e.target.value)}
              />
              <p className="mt-2 text-xs leading-5 text-gray-500 dark:text-gray-400">{field.hint}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Trial features" icon={FiSliders}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <strong>{enabledCount}</strong> of <strong>{options.length}</strong> features enabled for restaurants on trial.
            Disabled features are hidden or locked in the restaurant portal.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setAllFeatures(true)}>
              Enable all
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setAllFeatures(false)}>
              Disable all
            </Button>
          </div>
        </div>
        <div className="space-y-6">
          {sections.map((group) =>
            group.items.length === 0 ? null : (
              <section key={group.id}>
                <p className="mb-2 text-xs font-black uppercase tracking-[0.16em] text-gray-400">
                  {group.label}
                </p>
                <FeatureGrid group={group} flags={trialFlags} onToggle={toggleFeature} />
              </section>
            ),
          )}
        </div>
      </Card>

      <div className="flex justify-end">
        <Button type="button" onClick={save} disabled={saving}>
          <FiSave className="mr-2 h-4 w-4" />
          {saving ? 'Saving…' : 'Save trial settings'}
        </Button>
      </div>
    </div>
  )
}
