import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { FiPlus } from 'react-icons/fi'
import Button from '../common/Button'
import Input from '../common/Input'
import {
  CMS_KEY_PRESETS,
  CMS_TYPES,
  CMS_TYPE_BY_VALUE,
  getCmsFieldsForType,
} from '../../config/cmsTypeConfig'

function FieldHelp({ text }) {
  if (!text) return null
  return <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{text}</p>
}

function CmsField({ field, register, errors, readOnly }) {
  if (!field?.show) return null
  const name = field.name
  if (field.rows) {
    return (
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{field.label}</label>
        <FieldHelp text={field.help} />
        <textarea
          rows={field.rows}
          placeholder={field.placeholder}
          readOnly={readOnly}
          className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          {...register(name)}
        />
      </div>
    )
  }
  return (
    <div>
      <Input
        label={field.label}
        placeholder={field.placeholder}
        readOnly={readOnly}
        {...register(name, field.required ? { required: `${field.label} is required` } : {})}
        error={errors[name]?.message}
      />
      <FieldHelp text={field.help} />
    </div>
  )
}

export default function CmsContentForm({ editing, onSubmit, onCancel }) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      type: 'banner',
      isActive: true,
      sortOrder: 0,
    },
  })

  const contentType = watch('type') || 'banner'
  const fieldMap = getCmsFieldsForType(contentType)
  const typeInfo = CMS_TYPE_BY_VALUE[contentType]
  const presets = CMS_KEY_PRESETS[contentType] || []

  useEffect(() => {
    if (!editing) return
    reset({
      key: editing.key || '',
      title: editing.title || '',
      content: editing.content || '',
      type: editing.type || 'banner',
      isActive: editing.isActive !== false,
      metaTitle: editing.metaTitle || '',
      metaDescription: editing.metaDescription || '',
      image: editing.image || '',
      sortOrder: editing.sortOrder ?? 0,
    })
  }, [editing, reset])

  const applyPreset = (preset) => {
    setValue('key', preset.key)
  }

  const buildField = (name) => {
    const cfg = fieldMap[name]
    if (!cfg?.show) return null
    return { ...cfg, name }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/50">
        <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{typeInfo?.label || 'Content'}</p>
        <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">{typeInfo?.description}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="cms-content-type" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Content type</label>
          <select
            id="cms-content-type"
            {...register('type')}
            disabled={!!editing}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          >
            {CMS_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          {editing && (
            <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">Type cannot change after creation.</p>
          )}
        </div>
        {fieldMap.sortOrder?.show && (
          <Input
            label={fieldMap.sortOrder.label}
            type="number"
            {...register('sortOrder', { valueAsNumber: true })}
          />
        )}
      </div>

      {buildField('key') && (
        <div>
          <CmsField field={buildField('key')} register={register} errors={errors} readOnly={!!editing} />
          {!editing && presets.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {presets.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => applyPreset(p)}
                  className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:border-primary-300 hover:text-primary-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {['title', 'metaTitle', 'metaDescription', 'image', 'content'].map((name) => (
        <CmsField key={name} field={buildField(name)} register={register} errors={errors} />
      ))}

      <label className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
        <input type="checkbox" {...register('isActive')} />
        <span className="text-sm font-medium">Published (visible on landing when active)</span>
      </label>

      <div className="flex gap-3">
        <Button type="submit">
          <FiPlus className="mr-2" />
          {editing ? 'Update content' : 'Create content'}
        </Button>
        {editing && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}
