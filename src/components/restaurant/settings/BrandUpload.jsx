import React from 'react'
import { FiUpload } from 'react-icons/fi'

export default function BrandUpload({ id, label, preview, onChange, hint }) {
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
        <label
          htmlFor={id}
          className="inline-flex cursor-pointer items-center gap-2 text-sm font-bold text-primary-700 dark:text-primary-300"
        >
          <FiUpload className="h-4 w-4" />
          Upload
        </label>
      </div>
    </div>
  )
}
