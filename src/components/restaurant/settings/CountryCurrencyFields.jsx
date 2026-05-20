import React, { useMemo } from 'react'
import { Controller } from 'react-hook-form'
import Select from '../../common/Select'

export default function CountryCurrencyFields({
  control,
  setValue,
  selectedCountry,
  selectedCurrency,
  selectedTimezone,
  countryOptions,
  currencyOptions,
  timezoneOptions,
  loading,
  onCountrySelect,
}) {
  const tzOptions = useMemo(() => {
    if (timezoneOptions?.length) return timezoneOptions
    return selectedTimezone ? [{ value: selectedTimezone, label: selectedTimezone }] : []
  }, [timezoneOptions, selectedTimezone])

  return (
    <div className="mt-4 grid gap-4 md:grid-cols-3">
      <Controller
        name="country"
        control={control}
        render={({ field }) => (
          <Select
            label="Country"
            searchable
            searchPlaceholder="Search country…"
            placeholder={loading ? 'Loading countries…' : 'Select country'}
            disabled={loading}
            options={countryOptions}
            value={field.value || ''}
            onValueChange={(value) => {
              field.onChange(value)
              onCountrySelect?.(value)
            }}
            hint={loading ? 'Fetching country list…' : 'Search and pick your country'}
          />
        )}
      />

      <Controller
        name="currency"
        control={control}
        render={({ field }) => (
          <Select
            label="Currency symbol"
            searchable
            searchPlaceholder="Search currency…"
            placeholder="Select currency"
            disabled={loading}
            options={currencyOptions}
            value={field.value || ''}
            onValueChange={(value) => {
              field.onChange(value)
              setValue('currency', value, { shouldDirty: true, shouldValidate: true })
            }}
            hint="Shown on menus, bills, and reports"
          />
        )}
      />

      <Controller
        name="timezone"
        control={control}
        render={({ field }) => (
          <Select
            label="Timezone"
            searchable
            searchPlaceholder="Search timezone…"
            placeholder={tzOptions.length ? 'Select timezone' : 'Pick a country first'}
            disabled={loading || !tzOptions.length}
            options={tzOptions}
            value={field.value || ''}
            onValueChange={(value) => {
              field.onChange(value)
              setValue('timezone', value, { shouldDirty: true, shouldValidate: true })
            }}
            hint={selectedCountry ? `Zones for ${selectedCountry}` : 'Set after choosing a country'}
          />
        )}
      />

      <div className="md:col-span-3 flex flex-wrap items-center gap-2 rounded-xl border border-primary-100/80 bg-white/80 px-3 py-2 text-xs dark:border-gray-700 dark:bg-gray-950/60">
        <span className="font-semibold text-gray-500 dark:text-gray-400">Preview</span>
        <span className="rounded-full bg-primary-50 px-2.5 py-1 font-bold text-primary-800 dark:bg-primary-950/50 dark:text-primary-200">
          {selectedCountry || '—'}
        </span>
        <span className="text-gray-400">·</span>
        <span className="font-bold text-gray-900 dark:text-gray-100">{selectedCurrency || '—'}</span>
        <span className="text-gray-400">·</span>
        <span className="font-mono text-[11px] text-gray-600 dark:text-gray-300">
          {selectedTimezone || '—'}
        </span>
      </div>
    </div>
  )
}
