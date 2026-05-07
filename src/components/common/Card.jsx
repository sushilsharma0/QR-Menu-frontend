import React from 'react'

const Card = ({ children, title, icon: Icon, className = '', actions }) => {
  return (
    <div
      className={`rounded-xl border border-gray-100 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 ${className}`}
    >
      {(title || actions) && (
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-gray-800">
          <div className="flex items-center gap-2">
            {Icon && <Icon className="h-5 w-5 text-primary-600" />}
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
          </div>
          {actions && <div className="dark:text-gray-200">{actions}</div>}
        </div>
      )}
      <div className="p-6 dark:text-gray-100">{children}</div>
    </div>
  )
}

export default Card
