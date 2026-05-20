import { useMemo } from 'react'
import { useAuth } from './useAuth'
import { PERMISSION_KEYS } from '../constants/platformPermissions'

export function usePlatformAccess() {
  const { user } = useAuth()

  return useMemo(() => {
    const role = user?.role
    const isSuperAdmin = role === 'super_admin'
    const isPlatformStaff = role === 'super_admin' || role === 'admin' || role === 'support'
    const isPlatformAdmin = isPlatformStaff
    const permissions = user?.permissions || {}

    const hasPermission = (key) => {
      if (!isPlatformStaff) return false
      if (isSuperAdmin) return true
      return Boolean(permissions[key])
    }

    const hasAnyPermission = (keys = []) => keys.some((key) => hasPermission(key))

    return {
      user,
      role,
      isSuperAdmin,
      isPlatformStaff,
      isPlatformAdmin,
      permissions,
      hasPermission,
      hasAnyPermission,
      enabledCount: isSuperAdmin
        ? PERMISSION_KEYS.length
        : PERMISSION_KEYS.filter((key) => permissions[key]).length,
    }
  }, [user])
}
