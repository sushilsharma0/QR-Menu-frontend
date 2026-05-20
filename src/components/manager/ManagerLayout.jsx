import React from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { BranchProvider } from '../../context/BranchContext'
import { isManagerEmployeeUser } from '../../utils/tenantPaths'
import ManagerSidebar from './ManagerSidebar'
import ManagerHeader from './ManagerHeader'

const ManagerLayout = () => {
  const { user } = useAuth()
  const location = useLocation()
  const isPosRoute = /\/manager\/[^/]+\/[^/]+\/pos(\/|$)/.test(location.pathname || '')

  if (!isManagerEmployeeUser(user)) {
    return <Navigate to="/login" replace />
  }

  if (user?.mustChangePassword) {
    return <Navigate to="/employee/change-password" replace state={{ from: location }} />
  }

  if (isPosRoute) {
    return (
      <BranchProvider>
        <div className="manager-portal h-screen overflow-hidden bg-[#feefa5] text-gray-900 dark:bg-gray-950 dark:text-gray-100">
          <Outlet />
        </div>
      </BranchProvider>
    )
  }

  return (
    <BranchProvider>
      <div className="manager-portal flex h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
        <ManagerSidebar />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <ManagerHeader />
          <main className="flex-1 overflow-y-auto bg-gray-50 p-4 dark:bg-gray-950 md:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </BranchProvider>
  )
}

export default ManagerLayout
