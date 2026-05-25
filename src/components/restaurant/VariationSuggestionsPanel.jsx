import React, { useMemo } from 'react'
import { FiLayers, FiZap } from 'react-icons/fi'
import Button from '../common/Button'
import { buildVariationSuggestion } from '../../utils/menuVariationSuggestions'

const VariationSuggestionsPanel = ({
  itemName = '',
  categoryName = '',
  basePrice = 0,
  variationGroups = [],
  onApply,
}) => {
  const suggestion = useMemo(
    () => buildVariationSuggestion({ name: itemName, categoryName, basePrice }),
    [itemName, categoryName, basePrice],
  )

  if (!suggestion || variationGroups.length > 0) return null

  const preview = suggestion.groups?.[0]
  const previewOptions = (preview?.options || []).map((o) => o.name).join(' · ')

  return (
    <div className="rounded-2xl border border-dashed border-primary-200 bg-gradient-to-br from-primary-50/80 to-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white shadow-md">
          <FiZap className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-primary-900">Suggested setup: {suggestion.label}</p>
          <p className="mt-1 text-xs font-semibold leading-relaxed text-primary-800/80">{suggestion.hint}</p>
          {previewOptions && (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[11px] font-bold text-gray-700 ring-1 ring-primary-100">
              <FiLayers className="h-3.5 w-3.5 text-primary-600" />
              {preview?.displayType === 'dropdown' ? 'Dropdown' : preview?.displayType}: {previewOptions}
            </p>
          )}
          <p className="mt-2 text-[11px] text-gray-500">{suggestion.priceHint}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" size="sm" onClick={() => onApply(suggestion)}>
              Apply suggestion
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VariationSuggestionsPanel
