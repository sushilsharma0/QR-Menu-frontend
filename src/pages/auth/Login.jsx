import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import {
  FiArrowRight,
  FiBriefcase,
  FiCoffee,
  FiGrid,
  FiLock,
  FiMail,
  FiShield,
  FiZap,
  FiUser,
  FiUsers,
} from 'react-icons/fi'
import { FcGoogle } from 'react-icons/fc'
import { useAuth } from '../../hooks/useAuth'
import api from '../../services/api'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'

function VendorLoginPolicyHint() {
  const [policy, setPolicy] = useState(null)
  useEffect(() => {
    api
      .get('/restaurant/auth/login-policy', { skipErrorToast: true })
      .then((res) => setPolicy(res.data?.data))
      .catch(() => {})
  }, [])
  if (!policy?.maxAttempts) return null
  return (
    <div className="mb-5 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-300">
      After <strong>{policy.maxAttempts}</strong> wrong passwords within {policy.windowMinutes} minutes, your
      vendor account is locked for {policy.lockMinutes} minutes. Contact platform administration to unlock early.
    </div>
  )
}

const VALID_ROLES = ['restaurant', 'employee', 'platform']
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

const portalMeta = {
  restaurant: {
    title: 'Vendor Login',
    eyebrow: 'Restaurant workspace',
    description: 'Manage menus, orders, tables, billing, staff and KYC from your restaurant dashboard.',
    icon: FiCoffee,
    accent: 'bg-emerald-500',
  },
  employee: {
    title: 'Staff Login',
    eyebrow: 'Kitchen, cashier and waiter',
    description: 'Staff sign in with the username and restaurant ID provided by the vendor account.',
    icon: FiUsers,
    accent: 'bg-sky-500',
  },
  platform: {
    title: 'Platform Admin',
    eyebrow: 'Internal operations',
    description: 'A separate secure area for subscriptions, restaurant approvals, admins and platform settings.',
    icon: FiShield,
    accent: 'bg-slate-900',
  },
}

const GoogleSignIn = ({ onSuccess, disabled }) => {
  const buttonRef = useRef(null)
  const onSuccessRef = useRef(onSuccess)
  onSuccessRef.current = onSuccess
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || disabled) return undefined

    const renderButton = () => {
      if (!window.google?.accounts?.id || !buttonRef.current) return
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => onSuccessRef.current?.(response.credential),
      })
      buttonRef.current.innerHTML = ''
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'pill',
        logo_alignment: 'left',
        width: buttonRef.current.offsetWidth || 360,
      })
      setReady(true)
    }

    if (window.google?.accounts?.id) {
      renderButton()
      return undefined
    }

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = renderButton
    document.head.appendChild(script)

    return () => {
      script.onload = null
    }
  }, [disabled])

  if (!GOOGLE_CLIENT_ID) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
        <div className="flex items-start gap-3">
          <FcGoogle className="mt-0.5 h-5 w-5 shrink-0" />
          <p>
            Add <span className="font-mono">VITE_GOOGLE_CLIENT_ID</span> and <span className="font-mono">GOOGLE_CLIENT_ID</span> to enable Google sign-in.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-white to-emerald-50/50 p-4 shadow-sm dark:border-gray-800 dark:from-gray-950 dark:to-emerald-950/20">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <FcGoogle className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-bold text-gray-950 dark:text-white">Google vendor access</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Quick sign-in for restaurant owners</p>
        </div>
      </div>
      <div ref={buttonRef} className="min-h-[44px] w-full [&>div]:!w-full [&_iframe]:!mx-auto" />
      {!ready && (
        <button
          type="button"
          disabled
          className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-500 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400"
        >
          <FcGoogle className="h-5 w-5" />
          Loading Google sign-in
        </button>
      )}
      <div className="mt-4 flex items-center gap-2 rounded-lg bg-white/70 px-3 py-2 text-xs text-gray-500 dark:bg-gray-900/70 dark:text-gray-400">
        <FiZap className="h-4 w-4 text-emerald-600" />
        <span>No password needed when your Google email matches your vendor account.</span>
      </div>
    </div>
  )
}

const Login = () => {
  const { login, loginWithGoogle, loginBranchEmail } = useAuth()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const roleQuery = searchParams.get('role')
  const staffPortal = searchParams.get('staff')
  const restaurantIdFromUrl = searchParams.get('restaurantId')?.trim() || ''

  const roleFromPath = location.pathname.startsWith('/platform')
    ? 'platform'
    : location.pathname.startsWith('/staff')
      ? 'employee'
      : 'restaurant'
  const initialRole = location.pathname.startsWith('/platform') && VALID_ROLES.includes(roleQuery)
    ? roleQuery
    : roleFromPath
  const [role, setRole] = useState(initialRole)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm()

  const watchEmail = watch('email')
  const isBranchLogin = role === 'restaurant' && String(watchEmail || '').toLowerCase().includes('@branch.com')

  const activeMeta = portalMeta[role]
  const ActiveIcon = activeMeta.icon
  const isPlatformOnly = role === 'platform'
  const availablePortals = isPlatformOnly
    ? [['platform', portalMeta.platform]]
    : [
        ['restaurant', portalMeta.restaurant],
        ['employee', portalMeta.employee],
      ]

  useEffect(() => {
    if (location.pathname.startsWith('/platform') && VALID_ROLES.includes(roleQuery)) {
      setRole(roleQuery)
    } else {
      setRole(roleFromPath)
    }
  }, [roleFromPath, roleQuery])

  useEffect(() => {
    if (role === 'employee' && restaurantIdFromUrl) {
      setValue('restaurantId', restaurantIdFromUrl)
    }
  }, [role, restaurantIdFromUrl, setValue])

  const staffCopy = useMemo(() => {
    if (staffPortal === 'kitchen') return 'Kitchen staff can continue with their assigned username and restaurant ID.'
    if (staffPortal === 'cashier') return 'Cashiers can continue with their assigned username and restaurant ID.'
    if (staffPortal === 'waiter') return 'Waiters can continue with their assigned username and restaurant ID.'
    return 'Use the staff details created by your restaurant vendor.'
  }, [staffPortal])

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      if (role === 'restaurant' && String(data.email || '').toLowerCase().includes('@branch.com')) {
        await loginBranchEmail(
          data.email,
          data.restaurantIdBranch,
          data.password,
        )
      } else if (role === 'employee') {
        await login(data.username, data.password, 'employee', data.restaurantId)
      } else {
        await login(data.email, data.password, role)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSuccess = async (credential) => {
    setGoogleLoading(true)
    try {
      await loginWithGoogle(credential)
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#ecfeff,transparent_32%),linear-gradient(135deg,#f8fafc,#ffffff_44%,#f0fdf4)] px-4 py-6 text-gray-950 dark:bg-gray-950 dark:bg-none dark:text-gray-100 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] w-full max-w-6xl items-center gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="space-y-8">
          <Link to="/" className="inline-flex items-center gap-3 text-sm font-semibold text-gray-700 hover:text-gray-950 dark:text-gray-300 dark:hover:text-white">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-950 text-white dark:bg-white dark:text-gray-950">
              <FiGrid className="h-5 w-5" />
            </span>
            QR Restro Nepal
          </Link>

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700 dark:text-emerald-300">
              {isPlatformOnly ? 'Internal access' : 'Choose your workspace'}
            </p>
            <h1 className="mt-4 max-w-xl text-4xl font-bold leading-tight text-gray-950 dark:text-white sm:text-5xl">
              {isPlatformOnly ? 'Platform admin login is separate.' : 'Vendor and staff access for restaurant operations.'}
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-gray-600 dark:text-gray-300">
              {isPlatformOnly
                ? 'Use this secure area for subscriptions, restaurant approvals, platform admins, billing settings and operations.'
                : 'Restaurant owners are vendors here. Their login, registration, and Google sign-in are kept apart from internal platform administration.'}
            </p>
          </div>

          <div className="grid gap-3">
            {availablePortals.map(([key, item]) => {
              const Icon = item.icon
              const selected = role === key
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setRole(key)}
                  className={`group flex items-center gap-4 rounded-lg border bg-white/85 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:bg-gray-900/80 ${
                    selected
                      ? 'border-gray-950 ring-2 ring-gray-950/10 dark:border-white dark:ring-white/10'
                      : 'border-gray-200 hover:border-gray-300 dark:border-gray-800 dark:hover:border-gray-700'
                  }`}
                >
                  <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-white ${item.accent}`}>
                    <Icon className="h-6 w-6" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-gray-950 dark:text-white">{item.title}</span>
                    <span className="mt-1 block text-sm text-gray-500 dark:text-gray-400">{item.description}</span>
                  </span>
                  <FiArrowRight className={`h-5 w-5 text-gray-400 transition ${selected ? 'translate-x-1 text-gray-900 dark:text-white' : 'group-hover:translate-x-1'}`} />
                </button>
              )
            })}
          </div>
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-2xl shadow-gray-200/70 dark:border-gray-800 dark:bg-gray-900 dark:shadow-black/30 sm:p-8">
          <div className="mb-7 flex items-start gap-4">
            <span className={`flex h-14 w-14 items-center justify-center rounded-lg text-white ${activeMeta.accent}`}>
              <ActiveIcon className="h-7 w-7" />
            </span>
            <div>
              <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">{activeMeta.eyebrow}</p>
              <h2 className="mt-1 text-2xl font-bold text-gray-950 dark:text-white">{activeMeta.title}</h2>
            </div>
          </div>

          {role === 'employee' && (
            <div className="mb-5 rounded-lg border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-900 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-100">
              {staffCopy}
            </div>
          )}

          {role === 'restaurant' && isBranchLogin && (
            <div className="mb-5 rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
              Branch outlet login: enter your <strong>@branch.com</strong> username, <strong>Restaurant ID</strong>, and your password.
            </div>
          )}

          {role === 'platform' && (
            <div className="mb-5 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-300">
              Platform access is intentionally separate from vendor registration and staff login.
            </div>
          )}

          {role === 'restaurant' && !isBranchLogin && <VendorLoginPolicyHint />}

          {role === 'restaurant' && !isBranchLogin && (
            <div className="mb-6">
              <GoogleSignIn onSuccess={handleGoogleSuccess} disabled={googleLoading} />
              <div className="my-6 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                <span className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
                or use email / mobile
                <span className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {role === 'platform' && (
              <Input
                label="Email Address"
                icon={FiMail}
                type="email"
                placeholder="admin@company.com"
                {...register('email', { required: 'Email is required' })}
                error={errors.email?.message}
              />
            )}

            {role === 'restaurant' && (
              <>
                <Input
                  label={isBranchLogin ? 'Branch username' : 'Email or Mobile Number'}
                  icon={FiMail}
                  type="text"
                  autoComplete={isBranchLogin ? 'username' : 'email'}
                  placeholder={isBranchLogin ? 'outletname@branch.com' : 'vendor@restaurant.com or 98XXXXXXXX'}
                  {...register('email', {
                    required: isBranchLogin ? 'Branch username is required' : 'Email or mobile number is required',
                  })}
                  error={errors.email?.message}
                />
                {isBranchLogin && (
                  <>
                    <Input
                      label="Restaurant ID"
                      icon={FiBriefcase}
                      placeholder="REST-2041 or Mongo id"
                      {...register('restaurantIdBranch', {
                        required: 'Restaurant ID is required for branch login',
                      })}
                      error={errors.restaurantIdBranch?.message}
                    />
                  </>
                )}
              </>
            )}

            {role === 'employee' && (
              <>
                <Input
                  label="Username"
                  icon={FiUser}
                  placeholder="staff username"
                  {...register('username', { required: 'Username is required' })}
                  error={errors.username?.message}
                />
              <Input
                label="Restaurant ID"
                icon={FiBriefcase}
                placeholder="REST-2041 or technical id"
                {...register('restaurantId', { required: 'Restaurant ID is required' })}
                error={errors.restaurantId?.message}
              />
              </>
            )}

            <Input
              label="Password"
              icon={FiLock}
              type="password"
              placeholder="Enter password"
              {...register('password', { required: 'Password is required' })}
              error={errors.password?.message}
            />

            <div
              className={`flex flex-wrap items-center gap-3 text-sm ${
                role === 'restaurant' && isBranchLogin ? 'justify-end' : 'justify-between'
              }`}
            >
              {!(role === 'restaurant' && isBranchLogin) && (
                <Link to="/forgot-password" className="font-medium text-primary-600 hover:text-primary-700">
                  Forgot password?
                </Link>
              )}
              {role === 'restaurant' && !isBranchLogin && (
                <Link to="/vendor/register" className="font-semibold text-emerald-700 hover:text-emerald-800 dark:text-emerald-300">
                  Register vendor
                </Link>
              )}
              {role === 'restaurant' && isBranchLogin && (
                <span className="text-xs text-gray-500 dark:text-gray-400">Password resets are done from the main restaurant dashboard.</span>
              )}
            </div>

            <Button type="submit" loading={loading || googleLoading} className="w-full py-3">
              Sign in to{' '}
              {role === 'restaurant'
                ? isBranchLogin
                  ? 'Branch Dashboard'
                  : 'Vendor Dashboard'
                : role === 'employee'
                  ? 'Staff Workspace'
                  : 'Platform'}
            </Button>
          </form>

          <div className="mt-6 rounded-lg bg-gray-50 p-4 text-xs text-gray-600 dark:bg-gray-950 dark:text-gray-400">
            {role === 'platform' ? (
              <p><span className="font-semibold text-gray-800 dark:text-gray-200">Demo:</span> superadmin@qrmenu.com / Admin@123</p>
            ) : role === 'restaurant' ? (
              <p>
                <span className="font-semibold text-gray-800 dark:text-gray-200">Vendor demo:</span> test@restaurant.com / Test@123456.
                <span className="mt-2 block">Branch demo: use credentials from Branch Management after creating an outlet (…@branch.com + Restaurant ID).</span>
              </p>
            ) : (
              <p>Ask your restaurant vendor for your staff username, password, and restaurant ID.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

export default Login
