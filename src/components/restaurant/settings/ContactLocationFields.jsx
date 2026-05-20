import React from 'react'
import { Controller } from 'react-hook-form'
import Input from '../../common/Input'
import Select from '../../common/Select'

export default function ContactLocationFields({
  control,
  register,
  setValue,
  errors,
  countryOptions,
  countriesLoading,
  onCountrySelect,
  stateOptions,
  districtOptions,
  localLevelOptions,
  statesLoading,
  districtsLoading,
  selectedCountry,
  selectedState,
  hasStates,
  hasDistricts,
  districtsError,
}) {
  const locationDisabled = !selectedCountry || countriesLoading
  const stateDisabled = locationDisabled || statesLoading
  const districtDisabled = locationDisabled || !selectedState || districtsLoading

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Input
          label="Phone number"
          placeholder="+977 98XXXXXXXX"
          {...register('phone')}
          error={errors.phone?.message}
        />
        <Controller
          name="country"
          control={control}
          render={({ field }) => (
            <Select
              label="Country"
              searchable
              searchPlaceholder="Search country…"
              placeholder={countriesLoading ? 'Loading…' : 'Select country'}
              disabled={countriesLoading}
              options={countryOptions}
              value={field.value || ''}
              onValueChange={(value) => {
                field.onChange(value)
                onCountrySelect?.(value)
                setValue('state', '', { shouldDirty: true })
                setValue('district', '', { shouldDirty: true })
                setValue('localLevel', '', { shouldDirty: true })
                setValue('city', '', { shouldDirty: true })
              }}
              hint="Updates currency & timezone below"
            />
          )}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Controller
          name="state"
          control={control}
          render={({ field }) => (
            <Select
              label="State / Province"
              searchable
              searchPlaceholder="Search state…"
              placeholder={
                !selectedCountry
                  ? 'Select country first'
                  : statesLoading
                    ? 'Loading states…'
                    : hasStates
                      ? 'Select state'
                      : 'Type in address below'
              }
              disabled={stateDisabled}
              options={stateOptions}
              value={field.value || ''}
              onValueChange={(value) => {
                field.onChange(value)
                setValue('district', '', { shouldDirty: true })
                setValue('localLevel', '', { shouldDirty: true })
                setValue('city', '', { shouldDirty: true })
              }}
              hint={hasStates ? 'From public location database' : 'No states list for this country'}
            />
          )}
        />
        <Controller
          name="district"
          control={control}
          render={({ field }) => (
            <Select
              label="District"
              searchable
              searchPlaceholder="Search district…"
              placeholder={
                !selectedState
                  ? 'Select state first'
                  : districtsLoading
                    ? 'Loading districts…'
                    : districtsError
                      ? 'Could not load districts'
                      : hasDistricts
                        ? 'Select district'
                        : 'No districts in list'
              }
              disabled={districtDisabled}
              options={districtOptions}
              value={field.value || ''}
              onValueChange={(value) => {
                field.onChange(value)
                setValue('localLevel', '', { shouldDirty: true })
              }}
              hint={
                districtsError
                  ? 'Restart the server once, then try again'
                  : 'Districts load after you pick a state / province'
              }
            />
          )}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Controller
          name="localLevel"
          control={control}
          render={({ field }) => (
            <Select
              label="Local level"
              searchable
              searchPlaceholder="Search area…"
              placeholder={districtDisabled ? 'Select district first' : 'Optional — ward / municipality'}
              disabled={districtDisabled}
              options={localLevelOptions}
              value={field.value || ''}
              onValueChange={field.onChange}
              hint="Optional — ward, municipality, or local area"
            />
          )}
        />
        <div>
          <Input
            label="City (optional)"
            placeholder="Neighborhood or city name"
            {...register('city')}
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Optional if district is enough</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <Input
            label="Street address (optional)"
            placeholder="Building, street, landmark"
            {...register('address')}
            error={errors.address?.message}
          />
        </div>
        <Input
          label="PIN / Postal code (optional)"
          placeholder="Postal code"
          {...register('pincode')}
        />
      </div>
    </div>
  )
}
