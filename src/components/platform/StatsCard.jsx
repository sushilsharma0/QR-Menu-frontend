import React from 'react'
import { FiTrendingUp, FiTrendingDown } from 'react-icons/fi'

const StatsCard = ({ title, value, icon: Icon, color, trend, trendUp }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`${color} p-3 rounded-lg text-white`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
      {trend && (
        <div className="flex items-center gap-1 mt-4">
          {trendUp ? (
            <FiTrendingUp className="h-4 w-4 text-green-500" />
          ) : (
            <FiTrendingDown className="h-4 w-4 text-red-500" />
          )}
          <span className={`text-sm ${trendUp ? 'text-green-600' : 'text-red-600'}`}>{trend}</span>
          <span className="text-sm text-gray-500">vs last month</span>
        </div>
      )}
    </div>
  )
}

export default StatsCard