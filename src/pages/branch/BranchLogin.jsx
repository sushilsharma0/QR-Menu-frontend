import React, { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import toast from '@utils/toast'
import { useAuth } from '../../hooks/useAuth'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'

export default function BranchLogin() {
  const { loginBranch, loginBranchEmail } = useAuth()
  const params = useParams()
  const hasRouteLink = Boolean(params.restaurantId && params.portalKey && params.branchSlug)

  const [manualRestaurantId, setManualRestaurantId] = useState('')
  const [manualPortalKey, setManualPortalKey] = useState('')
  const [manualBranchSlug, setManualBranchSlug] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    const restaurantId = hasRouteLink ? params.restaurantId : manualRestaurantId.trim()
    const portalKey = hasRouteLink ? params.portalKey : manualPortalKey.trim()
    const branchSlug = hasRouteLink ? params.branchSlug : manualBranchSlug.trim()

    if (!hasRouteLink && username.trim().toLowerCase().includes('@branch.com')) {
      if (!manualRestaurantId.trim() || !password) {
        toast.error('Enter Restaurant ID, branch username, and password.')
        return
      }
      setLoading(true)
      try {
        await loginBranchEmail(username.trim(), manualRestaurantId.trim(), password)
      } finally {
        setLoading(false)
      }
      return
    }

    if (!restaurantId || !portalKey || !branchSlug || !username.trim() || !password) {
      toast.error('Fill in all sign-in fields.')
      return
    }
    setLoading(true)
    try {
      await loginBranch(restaurantId, portalKey, branchSlug, username, password)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-primary-50 px-4 py-16 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="mx-auto max-w-md rounded-3xl border border-amber-100 bg-white/90 p-8 shadow-xl backdrop-blur dark:border-gray-800 dark:bg-gray-900/90">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary-700 dark:text-primary-300">Branch access</p>
        <h1 className="mt-2 text-2xl font-semibold text-gray-950 dark:text-gray-100">Sign in to your branch</h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {hasRouteLink
            ? 'Use the username and password from your branch manager.'
            : 'Prefer the unified vendor login: enter your …@branch.com username, Restaurant ID, and password on the main sign-in page.'}

        </p>

        {!hasRouteLink && (
          <p className="mt-3 text-sm">
            <Link to="/login?role=restaurant" className="font-semibold text-primary-700 hover:underline dark:text-primary-300">
              Open unified login (recommended)
            </Link>
          </p>
        )}

        <form className="mt-8 space-y-4" onSubmit={onSubmit}>
          {!hasRouteLink && (
            <>
              <Input
                label="Restaurant outlet id or REST- id"
                value={manualRestaurantId}
                onChange={(ev) => setManualRestaurantId(ev.target.value)}
                placeholder="REST-2041 or technical id"
                autoComplete="off"
                required={!username.trim().toLowerCase().includes('@branch.com')}
              />
              <Input
                label="Branch security key"
                value={manualPortalKey}
                onChange={(ev) => setManualPortalKey(ev.target.value)}
                placeholder="12-character key (legacy link sign-in)"
                autoComplete="off"
              />
              <Input
                label="Branch URL slug"
                value={manualBranchSlug}
                onChange={(ev) => setManualBranchSlug(ev.target.value)}
                placeholder="pizza-hub-pokhara"
                autoComplete="off"
              />
            </>
          )}
          <Input label="Username or branch email" value={username} onChange={(ev) => setUsername(ev.target.value)} autoComplete="username" required />
          <Input label="Password" type="password" value={password} onChange={(ev) => setPassword(ev.target.value)} autoComplete="current-password" required />
          <Button type="submit" className="w-full" loading={loading}>
            Sign in
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          <Link to="/login?role=restaurant" className="font-semibold text-primary-700 hover:underline dark:text-primary-300">
            Restaurant owner login
          </Link>
        </p>
      </div>
    </div>
  )
}
