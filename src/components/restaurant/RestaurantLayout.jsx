import React from 'react'
import { Outlet } from 'react-router-dom'
import RestaurantSidebar from './RestaurantSidebar'
import Header from '../common/Header'
import RestaurantTrialKycBanner from './RestaurantTrialKycBanner'

const RestaurantLayout = () => {
  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <RestaurantSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 dark:bg-gray-950">
          <RestaurantTrialKycBanner />
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default RestaurantLayout