import React from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import RestaurantSidebar from './RestaurantSidebar'
import Header from '../common/Header'
import RestaurantTrialKycBanner from './RestaurantTrialKycBanner'
import PlanReadOnlyBanner from './PlanReadOnlyBanner'
import { BranchProvider } from '../../context/BranchContext'

const RestaurantLayout = () => {
  const location = useLocation()
  const path = location.pathname || ''
  const isPosRoute = /\/restaurant\/[^/]+\/[^/]+\/pos(\/|$)/.test(path)

  if (isPosRoute) {
    return (
      <BranchProvider>
        <div className="restaurant-portal h-screen overflow-hidden bg-[#feefa5] text-gray-900 dark:bg-gray-950 dark:text-gray-100">
          <Outlet />
        </div>
      </BranchProvider>
    )
  }

  return (
    <BranchProvider>
      <div className="restaurant-portal flex h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
        <RestaurantSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="portal-main flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950">
            <RestaurantTrialKycBanner />
            <PlanReadOnlyBanner />
            <Outlet />
          </main>
        </div>
      </div>
    </BranchProvider>
  )
}

export default RestaurantLayout
