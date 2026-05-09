import React from 'react'
import { Outlet, useLocation, Navigate } from 'react-router-dom'
import RestaurantSidebar from './RestaurantSidebar'
import Header from '../common/Header'
import RestaurantTrialKycBanner from './RestaurantTrialKycBanner'
import { useAuth } from '../../hooks/useAuth'
import { useTenantRoutes } from '../../hooks/useTenantRoutes'
import { isRestaurantPathAllowedWhenBillingLocked } from '../../utils/tenantPaths'

const RestaurantLayout = () => {
  const { user } = useAuth()
  const location = useLocation()
  const { restaurantBase, hasTenant } = useTenantRoutes()

  const billingLocked =
    user?.role === 'restaurant' && user?.scope !== 'employee' && user?.needsPlanUpgrade === true

  const path = location.pathname || ''
  const mustRedirectToSubscribe =
    billingLocked &&
    hasTenant &&
    restaurantBase &&
    !isRestaurantPathAllowedWhenBillingLocked(path)

  const main = mustRedirectToSubscribe ? (
    <Navigate to={`${restaurantBase}/subscription`} replace />
  ) : (
    <Outlet />
  )

  return (
    <div className="restaurant-portal flex h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <RestaurantSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6 dark:bg-gray-950">
          <RestaurantTrialKycBanner />
          {main}
        </main>
      </div>
    </div>
  )
}

export default RestaurantLayout
