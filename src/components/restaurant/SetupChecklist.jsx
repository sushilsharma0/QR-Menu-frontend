import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiCheckCircle, FiChevronRight, FiCircle } from 'react-icons/fi'
import api from '../../services/api'
import { useTenantRoutes } from '../../hooks/useTenantRoutes'

export default function SetupChecklist() {
  const { restaurantBase } = useTenantRoutes()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await api.get('/restaurant/insights/setup-checklist')
        if (!cancelled) setData(res.data?.data || null)
      } catch {
        if (!cancelled) setData(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  if (loading || !data || data.progress >= 100) return null

  return (
    <section className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-primary-50/30 p-5 shadow-sm dark:border-amber-900/40 dark:from-amber-950/20 dark:via-gray-900 dark:to-gray-950">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-300">Getting started</p>
          <h2 className="mt-1 text-lg font-bold text-gray-950 dark:text-gray-100">
            Complete your restaurant setup ({data.progress}%)
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {data.doneRequired} of {data.totalRequired} required steps done
          </p>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-amber-100 sm:max-w-xs dark:bg-amber-900/30">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary-600 to-amber-500 transition-all"
            style={{ width: `${data.progress}%` }}
          />
        </div>
      </div>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {(data.items || []).map((item) => (
          <li key={item.id}>
            <Link
              to={`${restaurantBase}/${item.segment}`}
              className="flex items-center gap-3 rounded-2xl border border-white/80 bg-white/90 px-3 py-2.5 text-sm transition hover:border-primary-200 hover:shadow-md dark:border-gray-800 dark:bg-gray-900/80"
            >
              {item.done ? (
                <FiCheckCircle className="h-5 w-5 shrink-0 text-emerald-600" />
              ) : (
                <FiCircle className="h-5 w-5 shrink-0 text-gray-300" />
              )}
              <span className="min-w-0 flex-1">
                <span className={`font-semibold ${item.done ? 'text-gray-500 line-through' : 'text-gray-900 dark:text-gray-100'}`}>
                  {item.label}
                  {item.optional ? ' (optional)' : ''}
                </span>
                <span className="mt-0.5 block truncate text-xs text-gray-500">{item.detail}</span>
              </span>
              <FiChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
