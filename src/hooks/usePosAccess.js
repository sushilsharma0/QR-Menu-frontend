import { useMemo } from 'react'
import { useAuth } from './useAuth'

/**
 * POS RBAC: owner = full access; manager ≈ owner for billing/reports; cashier = payments; waiter = orders only.
 */
export function usePosAccess() {
  const { user } = useAuth()

  return useMemo(() => {
    const isOwner = user?.role === 'restaurant' && user?.scope === 'restaurant'
    const employeeRole = user?.scope === 'employee' ? user?.role : null

    return {
      isOwner,
      employeeRole,
      canTakeOrder:
        isOwner || ['waiter', 'cashier', 'manager', 'kitchen'].includes(employeeRole),
      canBilling: isOwner || ['cashier', 'manager'].includes(employeeRole),
      canManager: isOwner || employeeRole === 'manager',
      canReports: isOwner || employeeRole === 'manager',
      canShift: isOwner || ['cashier', 'manager'].includes(employeeRole),
      isWaiter: employeeRole === 'waiter',
    }
  }, [user])
}
