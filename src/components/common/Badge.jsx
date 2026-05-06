import React from 'react'

const Badge = ({ children, variant = 'default', className = '' }) => {
  const variants = {
    default: 'bg-surface-100 text-primary-800',
    primary: 'bg-primary-100 text-primary-800',
    success: 'bg-accent-100 text-accent-800',
    warning: 'bg-attention-100 text-attention-800',
    danger: 'bg-secondary-100 text-secondary-800',
  }

  return (
    <span className={`px-2 py-1 text-xs rounded-full ${variants[variant]} ${className}`}>
      {children}
    </span>
  )
}

export default Badge