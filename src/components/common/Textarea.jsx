import React, { forwardRef } from 'react'

const Textarea = forwardRef(
  (
    {
      label,
      error,
      icon: Icon,
      className = '',
      rows = 4,
      ...props
    },
    ref
  ) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}

        <div className="relative">
          {Icon && (
            <div className="absolute top-3 left-3 pointer-events-none">
              <Icon className="h-5 w-5 text-gray-400" />
            </div>
          )}

          <textarea
            ref={ref}
            rows={rows}
            className={`
              w-full px-4 py-2 border border-gray-300 rounded-lg
              focus:ring-2 focus:ring-primary-500 focus:border-primary-500
              outline-none transition-all resize-none
              ${Icon ? 'pl-10' : ''}
              ${error ? 'border-red-500 focus:ring-red-500' : ''}
              ${className}
            `}
            {...props}
          />
        </div>

        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'

export default Textarea