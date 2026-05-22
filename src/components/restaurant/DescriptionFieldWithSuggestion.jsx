import React, { useMemo } from 'react'
import Textarea from '../common/Textarea'
import { buildDescriptionSuggestion } from '../../utils/menuDescriptionSuggestions'

const DescriptionFieldWithSuggestion = ({
  label = 'Description',
  name,
  categoryName = '',
  kind = 'menuItem',
  register,
  setValue,
  watch,
  error,
  rows = 4,
  placeholder = 'Write something...',
}) => {
  const descriptionField = register('description')
  const currentDescription = watch('description', '')

  const suggestion = useMemo(
    () => buildDescriptionSuggestion({ name, categoryName, kind }),
    [name, categoryName, kind],
  )

  const trimmedCurrent = String(currentDescription || '').trim()
  const canApply = Boolean(suggestion) && (!trimmedCurrent || trimmedCurrent === suggestion)

  const applySuggestion = () => {
    if (!canApply) return
    setValue('description', suggestion, { shouldDirty: true, shouldValidate: true })
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Tab' && !event.shiftKey && canApply) {
      event.preventDefault()
      applySuggestion()
    }
  }

  return (
    <div>
      <Textarea
        label={label}
        rows={rows}
        placeholder={placeholder}
        {...descriptionField}
        onKeyDown={(event) => {
          handleKeyDown(event)
        }}
        error={error}
      />
      {canApply && (
        <div className="mt-2 rounded-lg border border-dashed border-gray-200 bg-gray-50 px-3 py-2">
          <p className="text-xs font-medium text-gray-600">
            Suggested description
            <span className="ml-1 font-normal text-gray-400">(press Tab to apply)</span>
          </p>
          <button
            type="button"
            onClick={applySuggestion}
            className="mt-1 w-full text-left text-sm text-gray-700 hover:text-primary-700"
          >
            {suggestion}
          </button>
        </div>
      )}
    </div>
  )
}

export default DescriptionFieldWithSuggestion
