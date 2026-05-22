import React from 'react'

const MenuImageSuggestions = ({ suggestions, loading, query, failedIds, onImageError, onSelect }) => {
  const cleanQuery = String(query || '').trim()
  const visibleSuggestions = suggestions.filter((image) => !failedIds.includes(image.id))
  if (cleanQuery.length < 3) return null
  if (!loading && visibleSuggestions.length === 0) return null

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gray-700">Image suggestions</p>
          <p className="text-xs text-gray-500">Matching &ldquo;{cleanQuery}&rdquo;</p>
        </div>
        {loading && <p className="text-xs text-gray-500">Searching...</p>}
      </div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {visibleSuggestions.map((image) => (
          <button
            key={image.id}
            type="button"
            onClick={() => onSelect(image.url)}
            className="group overflow-hidden rounded-lg border border-gray-200 bg-white text-left transition hover:border-primary-400 hover:ring-2 hover:ring-primary-100"
            title={image.title}
          >
            <img
              src={image.thumbnail}
              alt={image.title || cleanQuery}
              className="aspect-square w-full object-cover transition group-hover:scale-105"
              loading="lazy"
              onError={() => onImageError(image.id)}
            />
          </button>
        ))}
      </div>
    </div>
  )
}

export default MenuImageSuggestions
