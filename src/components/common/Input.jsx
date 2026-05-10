import React, { forwardRef, useState } from 'react'
import { FiEye, FiEyeOff } from 'react-icons/fi'
import NepaliDateInput from './NepaliDateInput'

const Input = forwardRef(({ 
  label, 
  error, 
  icon: Icon,
  className = '',
  type = 'text',
  passwordToggle = true,
  ...props 
}, ref) => {
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === 'password'

  if (type === 'date') {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {label}
          </label>
        )}
        <NepaliDateInput ref={ref} className={className} {...props} />
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>
    )
  }
  const inputType = isPassword && passwordToggle
    ? (showPassword ? 'text' : 'password')
    : type

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          </div>
        )}
        <input
          ref={ref}
          type={inputType}
          className={`
            w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg 
            focus:ring-2 focus:ring-primary-500 focus:border-primary-500 
            outline-none transition-all bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100
            ${Icon ? 'pl-10' : ''}
            ${isPassword && passwordToggle ? 'pr-10' : ''}
            ${error ? 'border-red-500 focus:ring-red-500' : ''}
            ${className}
          `}
          {...props}
        />
        {isPassword && passwordToggle && (
          <button
            type="button"
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus-visible:text-primary-600"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            tabIndex={-1}
          >
            {showPassword ? (
              <FiEyeOff className="h-5 w-5" aria-hidden />
            ) : (
              <FiEye className="h-5 w-5" aria-hidden />
            )}
          </button>
        )}
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
})

Input.displayName = 'Input'

export default Input