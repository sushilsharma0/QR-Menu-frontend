import React from 'react'

const Loader = ({ size = 'md', fullScreen = false }) => {
  const sizes = {
    sm: 'h-6 w-6',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  }

  const spinner = (
    <div className="flex justify-center items-center">
      <div className={`animate-spin rounded-full border-b-2 border-primary-600 ${sizes[size]}`}></div>
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm dark:bg-gray-950/80">
        <div className="rounded-3xl border border-surface-200 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-gray-900">
          {spinner}
          <p className="mt-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    )
  }

  return spinner
}

export default Loader
