import { useMemo } from 'react'
import { useAuth } from './useAuth'
import {
  BILLING_GRANULAR_PERMISSION_KEYS,
  LEGACY_FULL_BILLING_KEY,
  PERMISSION_KEYS,
  countGrantedPrivileges,
} from '../constants/platformPermissions'

export function usePlatformAccess() {
  const { user } = useAuth()

  return useMemo(() => {
    const role = user?.role
    const isSuperAdmin = role === 'super_admin'
    const isPlatformStaff = role === 'super_admin' || role === 'admin' || role === 'support'
    const isPlatformAdmin = isPlatformStaff
    const permissions = user?.permissions || {}

    const hasBillingSlice = (key) => {
      if (permissions[LEGACY_FULL_BILLING_KEY] === true && BILLING_GRANULAR_PERMISSION_KEYS.includes(key)) return true
      return Boolean(permissions[key])
    }

    const hasPermission = (key) => {
      if (!isPlatformStaff) return false
      if (isSuperAdmin) return true
      if (BILLING_GRANULAR_PERMISSION_KEYS.includes(key)) return hasBillingSlice(key)
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
      enabledCount: isSuperAdmin ? PERMISSION_KEYS.length : countGrantedPrivileges(permissions),
    }
  }, [user])
}
