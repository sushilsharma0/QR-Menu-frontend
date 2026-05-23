import React from 'react'
import { Outlet, Navigate, useParams, useLocation } from 'react-router-dom'
import BranchSidebar from './BranchSidebar'
import Header from '../common/Header'
import RestaurantTrialKycBanner from '../restaurant/RestaurantTrialKycBanner'
import { useAuth } from '../../hooks/useAuth'
import { useTenantRoutes } from '../../hooks/useTenantRoutes'
import { BranchProvider } from '../../context/BranchContext'
import { RestaurantRealtimeProvider } from '../../context/RestaurantRealtimeContext'
import { branchPortalBase } from '../../utils/tenantPaths'

const BRANCH_OUTLET = <Outlet />

const BranchLayout = () => {
  const { user } = useAuth()
  const location = useLocation()
  const { restaurantId, portalKey, branchSlug } = useParams()
  useTenantRoutes()

  const path = location.pathname || ''
  const isPosRoute = /^\/branch\/[^/]+\/[^/]+\/[^/]+\/pos(\/|$)/.test(path)

  const slugMismatch =
    user?.scope === 'branch_user' &&
    branchSlug &&
    user.branchSlug &&
    String(user.branchSlug) !== String(branchSlug)

  const ridMismatch =
    user?.scope === 'branch_user' &&
    restaurantId &&
    user.restaurantId &&
    String(user.restaurantId) !== String(restaurantId)

  const keyMismatch =
    user?.scope === 'branch_user' &&
    portalKey &&
    user.branchPortalKey &&
    String(user.branchPortalKey).toLowerCase() !== String(portalKey).toLowerCase()

  if (user?.scope === 'branch_user' && (slugMismatch || ridMismatch || keyMismatch)) {
    const base = branchPortalBase(user.restaurantId, user.branchPortalKey, user.branchSlug)
    return <Navigate to={`${base}/dashboard`} replace />
  }

  if (isPosRoute) {
    return (
      <RestaurantRealtimeProvider>
        <BranchProvider>
          <div className="restaurant-portal h-screen overflow-hidden bg-[#feefa5] text-gray-900 dark:bg-gray-950 dark:text-gray-100">
            <Outlet />
          </div>
        </BranchProvider>
      </RestaurantRealtimeProvider>
    )
  }

  return (
    <RestaurantRealtimeProvider>
    <BranchProvider>
      <div className="restaurant-portal flex h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
        <BranchSidebar />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto bg-gray-50 p-6 dark:bg-gray-950">
            <RestaurantTrialKycBanner />
            {BRANCH_OUTLET}
          </main>
        </div>
      </div>
    </BranchProvider>
    </RestaurantRealtimeProvider>
  )
}

export default BranchLayout
