import React from 'react'

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  loading = false,
  disabled = false,
  className = '',
  onClick,
  type = 'button',
  ...props 
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900'
  
  const variants = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 shadow-sm hover:shadow',
    secondary: 'bg-secondary-100 text-secondary-800 hover:bg-secondary-200 focus:ring-secondary-500 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700',
    danger: 'bg-secondary-600 text-white hover:bg-secondary-700 focus:ring-secondary-500',
    success: 'bg-accent-600 text-white hover:bg-accent-700 focus:ring-accent-500',
    outline: 'border border-surface-300 bg-white text-primary-800 hover:bg-surface-50 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800',
    ghost: 'text-primary-700 hover:bg-surface-100 focus:ring-primary-500 dark:text-gray-200 dark:hover:bg-gray-800',
  }
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  }
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      data-loading={loading ? 'true' : undefined}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${disabled || loading ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export default Button
