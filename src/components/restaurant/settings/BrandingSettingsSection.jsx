import React from 'react'
import { FiEye, FiImage, FiUpload, FiX } from 'react-icons/fi'
import Card from '../../common/Card'

export default function BrandingSettingsSection({
  logoPreview,
  backgroundPreview,
  logoFile,
  backgroundFile,
  onLogoChange,
  onBackgroundChange,
  onClearLogo,
  onClearBackground,
  onShowLogoPreview,
  onShowBackgroundPreview,
}) {
  return (
    <div className="space-y-6">
      <Card title="Profile Photo / Restaurant Logo" icon={FiImage}>
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Square 4×4 style photo, recommended 512×512 px. Max 1 MB.
          </p>
          {logoPreview && (
            <div className="relative inline-block">
              <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-lg border border-gray-300 bg-gray-100 dark:border-gray-700 dark:bg-gray-800">
                <img src={logoPreview} alt="Logo preview" className="max-h-full max-w-full object-contain" />
              </div>
              <button
                type="button"
                onClick={onShowLogoPreview}
                className="absolute right-2 top-2 rounded-lg bg-blue-600 p-1.5 text-white transition hover:bg-blue-700"
              >
                <FiEye size={16} />
              </button>
            </div>
          )}
          <div className="rounded-lg border-2 border-dashed border-gray-300 p-6 text-center transition hover:border-primary-500 dark:border-gray-700">
            <input type="file" accept="image/*" onChange={onLogoChange} className="hidden" id="logo-input" />
            <label htmlFor="logo-input" className="flex cursor-pointer flex-col items-center gap-2">
              <FiUpload size={24} className="text-gray-400 dark:text-gray-500" />
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Click to upload logo</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG, WEBP. Max 1 MB.</p>
            </label>
          </div>
          {logoFile && (
            <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-900/20">
              <span className="text-sm text-green-800 dark:text-green-300">
                ✓ Logo ready: {logoFile.name}
              </span>
              <button type="button" onClick={onClearLogo} className="rounded p-1 transition hover:bg-green-200">
                <FiX size={16} className="text-green-600" />
              </button>
            </div>
          )}
        </div>
      </Card>

      <Card title="Customer Panel Background">
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Background for the customer panel. Recommended 1920×1080 px. Max 1 MB.
          </p>
          {backgroundPreview && (
            <div className="relative inline-block w-full">
              <div className="flex h-40 w-full items-center justify-center overflow-hidden rounded-lg border border-gray-300 bg-gray-100 dark:border-gray-700 dark:bg-gray-800">
                <img src={backgroundPreview} alt="Background preview" className="h-full w-full object-cover" />
              </div>
              <button
                type="button"
                onClick={onShowBackgroundPreview}
                className="absolute right-2 top-2 rounded-lg bg-blue-600 p-1.5 text-white transition hover:bg-blue-700"
              >
                <FiEye size={16} />
              </button>
            </div>
          )}
          <div className="rounded-lg border-2 border-dashed border-gray-300 p-6 text-center transition hover:border-primary-500 dark:border-gray-700">
            <input
              type="file"
              accept="image/*"
              onChange={onBackgroundChange}
              className="hidden"
              id="background-input"
            />
            <label htmlFor="background-input" className="flex cursor-pointer flex-col items-center gap-2">
              <FiUpload size={24} className="text-gray-400 dark:text-gray-500" />
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Click to upload background photo
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG, WEBP. Max 1 MB.</p>
            </label>
          </div>
          {backgroundFile && (
            <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-900/20">
              <span className="text-sm text-green-800 dark:text-green-300">
                ✓ Background ready: {backgroundFile.name}
              </span>
              <button type="button" onClick={onClearBackground} className="rounded p-1 transition hover:bg-green-200">
                <FiX size={16} className="text-green-600" />
              </button>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
