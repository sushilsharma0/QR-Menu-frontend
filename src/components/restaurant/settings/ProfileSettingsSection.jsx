import React from 'react'
import Card from '../../common/Card'
import Input from '../../common/Input'
import { FiSettings } from 'react-icons/fi'
import CountryCurrencyFields from './CountryCurrencyFields'
import ContactLocationFields from './ContactLocationFields'

export default function ProfileSettingsSection({
  restaurant,
  register,
  control,
  setValue,
  errors,
  selectedCountry,
  selectedState,
  selectedCurrency,
  selectedTimezone,
  countryOptions,
  currencyOptions,
  timezoneOptions,
  countriesLoading,
  onCountrySelect,
  stateOptions,
  districtOptions,
  localLevelOptions,
  statesLoading,
  districtsLoading,
  hasStates,
  hasDistricts,
  districtsError,
}) {
  return (
    <Card title="Restaurant Information" icon={FiSettings}>
      <div className="space-y-6">
        <section className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4 dark:border-gray-800 dark:bg-gray-900/60">
          <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">
            Basic Details
          </h3>
          <div className="mt-4 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Restaurant Name{' '}
                <span className="text-xs text-gray-500 dark:text-gray-400">(Read-only, from PAN)</span>
              </label>
              <div className="cursor-not-allowed rounded-lg border border-gray-300 bg-gray-100 px-4 py-3 font-medium text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100">
                {restaurant?.name || 'Loading...'}
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
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
          <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">
            Contact & Location
          </h3>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Searchable lists from a public location database. PIN and street address are optional.
          </p>
          <div className="mt-4">
            <ContactLocationFields
              control={control}
              register={register}
              setValue={setValue}
              errors={errors}
              countryOptions={countryOptions}
              countriesLoading={countriesLoading}
              onCountrySelect={onCountrySelect}
              stateOptions={stateOptions}
              districtOptions={districtOptions}
              localLevelOptions={localLevelOptions}
              statesLoading={statesLoading}
              districtsLoading={districtsLoading}
              selectedCountry={selectedCountry}
              selectedState={selectedState}
              hasStates={hasStates}
              hasDistricts={hasDistricts}
              districtsError={districtsError}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-primary-100 bg-primary-50/50 p-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-primary-700 dark:text-primary-300">
                Country & Currency
              </h3>
              <p className="mt-1 text-xs font-semibold text-gray-500 dark:text-gray-400">
                Currency and timezone follow the country chosen in Contact &amp; Location.
              </p>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-primary-700 shadow-sm dark:bg-gray-800 dark:text-primary-200">
              Current: {selectedCurrency}
            </span>
          </div>
          <CountryCurrencyFields
            control={control}
            setValue={setValue}
            selectedCountry={selectedCountry}
            selectedCurrency={selectedCurrency}
            selectedTimezone={selectedTimezone}
            countryOptions={countryOptions}
            currencyOptions={currencyOptions}
            timezoneOptions={timezoneOptions}
            loading={countriesLoading}
            onCountrySelect={onCountrySelect}
          />
        </section>

        <section className="rounded-2xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">
            Opening Hours
          </h3>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <Input label="Opening Time" type="time" {...register('openingTime')} />
            <Input label="Closing Time" type="time" {...register('closingTime')} />
          </div>
        </section>
      </div>
    </Card>
  )
}
