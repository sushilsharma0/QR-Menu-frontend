import React, { useState } from 'react'

const Tabs = ({ tabs, defaultTab, onChange }) => {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.key)

  const handleTabChange = (key) => {
    setActiveTab(key)
    onChange?.(key)
  }

  return (
    <div>
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex flex-wrap gap-x-6 gap-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleTabChange(tab.key)}
              className={`whitespace-nowrap py-2.5 px-1 text-sm font-semibold border-b-2 transition-all ${
                activeTab === tab.key
                  ? 'border-primary-500 text-primary-600 dark:border-primary-400 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="mt-6">
        {tabs.find((tab) => tab.key === activeTab)?.content}
      </div>
    </div>
  )
}

export default Tabs