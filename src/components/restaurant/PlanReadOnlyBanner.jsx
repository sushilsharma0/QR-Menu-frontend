import React from 'react'
import { Link } from 'react-router-dom'
import { FiLock } from 'react-icons/fi'
import { usePlanAccess } from '../../hooks/usePlanAccess'
import { useTenantRoutes } from '../../hooks/useTenantRoutes'

export default function PlanReadOnlyBanner() {
  const { isPlanReadOnly } = usePlanAccess()
  const { restaurantBase } = useTenantRoutes()

  if (!isPlanReadOnly) return null

  return (
    <div className="mx-4 mb-4 mt-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
      <FiLock className="mt-0.5 h-5 w-5 flex-shrink-0" />
      <div>
        <p className="font-semibold">Read-only mode — plan expired</p>
        <p className="mt-1 opacity-90">
          You can browse your restaurant data, but creating or editing is disabled until you renew your subscription.
        </p>
        <Link
          to={`${restaurantBase}/subscription`}
          className="mt-2 inline-block font-semibold underline"
        >
          Renew subscription
        </Link>
      </div>
    </div>
  )
}
