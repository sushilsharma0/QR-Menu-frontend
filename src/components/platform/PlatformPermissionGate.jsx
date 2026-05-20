import React from 'react'
import { Navigate } from 'react-router-dom'
import { FiLock } from 'react-icons/fi'
import { usePlatformAccess } from '../../hooks/usePlatformAccess'
import { getFirstAllowedPlatformPath } from '../../config/platformNavConfig'
import Card from '../common/Card'

export default function PlatformPermissionGate({ permission, superAdminOnly, staffOnly, children }) {
  const { hasPermission, isSuperAdmin, isPlatformStaff } = usePlatformAccess()

  if (!isPlatformStaff) {
    return <Navigate to="/login" replace />
  }

  if (staffOnly) {
    return children
  }

  if (superAdminOnly && !isSuperAdmin) {
    return <Navigate to={getFirstAllowedPlatformPath(hasPermission, isSuperAdmin)} replace />
  }

  if (permission && !hasPermission(permission)) {
    return <Navigate to={getFirstAllowedPlatformPath(hasPermission, isSuperAdmin)} replace />
  }

  return children
}

export function PlatformAccessDenied({ title = 'Access restricted', message }) {
  return (
    <Card>
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
          <FiLock className="h-7 w-7" />
        </div>
        <h2 className="text-lg font-bold text-gray-950 dark:text-gray-100">{title}</h2>
        <p className="max-w-md text-sm text-gray-500 dark:text-gray-400">
          {message || 'Your account does not have permission for this area. Contact a super admin to request access.'}
        </p>
      </div>
    </Card>
  )
}
