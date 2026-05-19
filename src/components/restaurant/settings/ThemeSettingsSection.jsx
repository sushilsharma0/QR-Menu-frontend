import React from 'react'
import { FiCheck, FiImage, FiMoon, FiRefreshCw, FiSun } from 'react-icons/fi'
import Card from '../../common/Card'
import Button from '../../common/Button'
import { FONT_OPTIONS, PREDEFINED_THEMES } from '../../../theme/themePresets'
import ThemePaletteCard from './ThemePaletteCard'
import BrandUpload from './BrandUpload'
import { IMAGE_SIZE_HINT } from './settingsConstants'

export default function ThemeSettingsSection({
  themeDraft,
  themeSaving,
  faviconPreview,
  brandBackgroundPreview,
  onResetTheme,
  onUpdateTheme,
  onFaviconChange,
  onBrandBackgroundChange,
}) {
  return (
    <Card
      title="Appearance & themes"
      icon={FiImage}
      actions={
        <Button type="button" variant="outline" size="sm" onClick={onResetTheme} disabled={themeSaving}>
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
              onClick={() => onUpdateTheme({ mode: value }, true)}
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
          <h3 className="text-sm font-black uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">
            Palettes
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Click a palette to preview instantly across the app.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {PREDEFINED_THEMES.map((theme) => (
              <ThemePaletteCard
                key={theme.id}
                theme={theme}
                selected={themeDraft.activeTheme === theme.id}
                onSelect={() => onUpdateTheme({ activeTheme: theme.id }, true)}
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
                onChange={(e) => onUpdateTheme({ fontFamily: e.target.value }, true)}
                disabled={themeSaving}
                className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary-400 disabled:cursor-not-allowed disabled:opacity-70 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
              >
                {FONT_OPTIONS.map((font) => (
                  <option key={font.value} value={font.value}>
                    {font.label}
                  </option>
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
                    <div className="rounded-lg bg-primary-600 px-3 py-2 text-xs font-bold text-white">
                      Button
                    </div>
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
            onChange={onFaviconChange}
            hint={`Square image, recommended 512×512 px. ${IMAGE_SIZE_HINT}.`}
          />
          <BrandUpload
            id="brand-bg-input"
            label="Brand background image"
            preview={brandBackgroundPreview}
            onChange={onBrandBackgroundChange}
            hint={`Wide banner, recommended 1920×1080 px. ${IMAGE_SIZE_HINT}.`}
          />
        </div>

        <div className="rounded-lg border border-dashed border-primary-200 bg-primary-50 p-4 text-sm text-primary-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100">
          Theme settings apply across your restaurant portal and customer-facing panels.
        </div>
      </div>
    </Card>
  )
}
