import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { AnimatePresence, motion } from 'framer-motion'
import {
  FiArrowRight,
  FiBriefcase,
  FiCoffee,
  FiEye,
  FiEyeOff,
  FiLock,
  FiMail,
  FiShield,
  FiShoppingBag,
  FiUser,
  FiUsers,
} from 'react-icons/fi'
import { FcGoogle } from 'react-icons/fc'
import { useAuth } from '../../hooks/useAuth'
import api from '../../services/api'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'

/* ─── Policy hint (unchanged logic) ──────────────────────────────────────── */
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
    <div className="mb-5 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
      After <strong>{policy.maxAttempts}</strong> wrong passwords within {policy.windowMinutes} minutes, your
      account is locked for {policy.lockMinutes} minutes.
    </div>
  )
}

/* ─── Constants ──────────────────────────────────────────────────────────── */
const VALID_ROLES = ['restaurant', 'employee', 'platform']
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

/* ─── Google sign-in widget ──────────────────────────────────────────────── */
const GoogleSignIn = ({ onSuccess, disabled }) => {
  const buttonRef = useRef(null)
  const onSuccessRef = useRef(onSuccess)
  onSuccessRef.current = onSuccess

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || disabled) return
    const render = () => {
      if (!window.google?.accounts?.id || !buttonRef.current) return
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (r) => onSuccessRef.current?.(r.credential),
      })
      buttonRef.current.innerHTML = ''
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: 'outline', size: 'large', text: 'continue_with',
        shape: 'pill', logo_alignment: 'left',
        width: buttonRef.current.offsetWidth || 360,
      })
    }
    if (window.google?.accounts?.id) { render(); return }
    const s = document.createElement('script')
    s.src = 'https://accounts.google.com/gsi/client'
    s.async = true; s.defer = true; s.onload = render
    document.head.appendChild(s)
    return () => { s.onload = null }
  }, [disabled])

  /* No client-id → amber notice (matches image) */
  if (!GOOGLE_CLIENT_ID) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
        <FcGoogle className="h-5 w-5 shrink-0" />
        <p>
          Add <span className="font-mono font-semibold">VITE_GOOGLE_CLIENT_ID</span> and{' '}
          <span className="font-mono font-semibold">GOOGLE_CLIENT_ID</span> to enable Google sign-in.
        </p>
      </div>
    )
  }

  return <div ref={buttonRef} className="min-h-[44px] w-full" />
}

/* ─── Password input with show/hide toggle ───────────────────────────────── */
const PasswordInput = React.forwardRef(({ label, error, ...props }, ref) => {
  const [show, setShow] = useState(false)
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">{label}</label>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-gray-400">
          <FiLock className="h-4 w-4" />
        </span>
        <input
          ref={ref}
          type={show ? 'text' : 'password'}
          className="w-full rounded-lg border border-gray-200 bg-white py-3 pl-10 pr-12 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-[#9a3412] focus:ring-2 focus:ring-[#9a3412]/20"
          {...props}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute inset-y-0 right-3.5 flex items-center text-gray-400 hover:text-gray-600"
        >
          {show ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
})
PasswordInput.displayName = 'PasswordInput'

/* ─── Text input with left icon ──────────────────────────────────────────── */
const TextInput = React.forwardRef(({ label, icon: Icon, error, rightIcon: RightIcon, ...props }, ref) => (
  <div>
    <label className="mb-1.5 block text-sm font-medium text-gray-700">{label}</label>
    <div className="relative">
      {Icon && (
        <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-gray-400">
          <Icon className="h-4 w-4" />
        </span>
      )}
      <input
        ref={ref}
        className={`w-full rounded-lg border border-gray-200 bg-white py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-[#9a3412] focus:ring-2 focus:ring-[#9a3412]/20 ${Icon ? 'pl-10' : 'pl-4'} ${RightIcon ? 'pr-10' : 'pr-4'}`}
        {...props}
      />
      {RightIcon && (
        <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-[#a43a12]">
          <RightIcon className="h-4 w-4" />
        </span>
      )}
    </div>
    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
  </div>
))
TextInput.displayName = 'TextInput'

/* ─── Left panel features list ───────────────────────────────────────────── */
const features = [
  {
    icon: FiCoffee,
    title: 'Manage Everything',
    desc: 'Menus, orders, tables, billing & more',
  },
  {
    icon: FiUsers,
    title: 'Team Access',
    desc: 'Staff login with secure permissions',
  },
  {
    icon: FiShield,
    title: 'Secure & Reliable',
    desc: 'Your data is protected with top security',
  },
]

/* ─── Main Login component ────────────────────────────────────────────────── */
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

  const initialRole =
    location.pathname.startsWith('/platform') && VALID_ROLES.includes(roleQuery)
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
        await loginBranchEmail(data.email, data.restaurantIdBranch, data.password)
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

  /* ── Right panel heading per role ── */
  const panelMeta = {
    restaurant: {
      icon: FiShoppingBag,
      title: 'Vendor Login',
      subtitle: 'Access your restaurant dashboard',
      buttonLabel: isBranchLogin ? 'Sign in to Branch Dashboard' : 'Sign in to Vendor Dashboard',
    },
    employee: {
      icon: FiUsers,
      title: 'Staff Login',
      subtitle: 'Access your staff workspace',
      buttonLabel: 'Sign in to Staff Workspace',
    },
    platform: {
      icon: FiShield,
      title: 'Platform Admin',
      subtitle: 'Internal platform operations',
      buttonLabel: 'Sign in to Platform',
    },
  }
  const panel = panelMeta[role]
  const PanelIcon = panel.icon

  /* ── Left panel heading per role ── */
  const leftHeading = {
    restaurant: { greeting: 'Welcome back,', name: 'Vendor!', desc: 'Sign in to manage menus, orders, tables, billing and your restaurant operations seamlessly.' },
    employee: { greeting: 'Welcome back,', name: 'Staff!', desc: 'Use your staff credentials to access the kitchen, cashier, or waiter workspace.' },
    platform: { greeting: 'Welcome back,', name: 'Admin!', desc: 'Access platform management, subscriptions, restaurant approvals and settings.' },
  }
  const left = leftHeading[role]

  return (
    <div className="flex h-screen overflow-hidden bg-white font-sans">
      {/* ── LEFT: dark restaurant image panel ── */}
      <div
        className="relative hidden w-[47%] shrink-0 overflow-hidden lg:block"
        style={{
          background: 'linear-gradient(160deg, #4a1b10 0%, #7d3218 48%, #2f150d 100%)',
        }}
      >
        {/* Restaurant BG photo overlay */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=900&q=80')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.78,
            filter: 'blur(1.1px) saturate(0.9) contrast(0.96)',
            transform: 'scale(1.018)',
          }}
        />
        {/* Warm blurred brand gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(90deg, rgba(55,21,12,0.96) 0%, rgba(80,31,17,0.82) 30%, rgba(111,52,29,0.48) 58%, rgba(159,92,55,0.2) 82%, rgba(190,126,88,0.08) 100%), linear-gradient(180deg, rgba(48,18,10,0.08) 0%, rgba(58,22,12,0.5) 100%)',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 70% 50% at 78% 34%, rgba(255,213,184,0.08), transparent 62%), radial-gradient(ellipse 65% 42% at 74% 92%, rgba(148,74,42,0.14), transparent 64%)',
            backdropFilter: 'blur(0.2px)',
          }}
        />
        {/* Decorative brand curved right edge */}
        <div
          className="absolute -right-32 bottom-0 top-0 w-80"
          style={{
            background: 'radial-gradient(ellipse 70% 60% at 0% 50%, rgba(218,155,116,0.16), transparent 72%)',
          }}
        />
        <svg
          className="absolute -right-32 bottom-0 top-0 h-full w-80 text-white"
          viewBox="0 0 320 900"
          preserveAspectRatio="none"
          fill="currentColor"
        >
          <path d="M320,0 L118,0 C170,150 174,265 132,392 C88,528 82,690 154,900 L320,900 Z" />
        </svg>
        <svg
          className="absolute -right-32 bottom-0 top-0 h-full w-80 text-[#c85b22]"
          viewBox="0 0 320 900"
          preserveAspectRatio="none"
          fill="none"
        >
          <path d="M118,0 C170,150 174,265 132,392 C88,528 82,690 154,900" stroke="currentColor" strokeWidth="4" />
        </svg>

        {/* Content */}
        <div className="relative z-10 h-full px-12 py-14 xl:px-36">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#c65a22] to-[#8d310f] text-white shadow-lg shadow-[#4a1608]/25">
              <FiCoffee className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-bold text-white leading-tight">QR Menu SaaS</p>
              <p className="text-xs tracking-[0.28em] text-[#ffc49b]">NEPAL</p>
            </div>
          </div>

          {/* Hero text */}
          <div className="mt-20 space-y-5 xl:mt-20">
            <div>
              <h1 className="text-5xl font-bold leading-tight text-white">{left.greeting}</h1>
              <h1 className="text-5xl font-bold leading-tight text-[#ff7a24]">
                {left.name} <span aria-hidden="true">{'\u{1F44B}'}</span>
              </h1>
            </div>
            <p className="max-w-sm text-base leading-8 text-gray-100">{left.desc}</p>

            {/* Feature list */}
            <div className="space-y-7 pt-10">
              {features.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex items-center gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#ffc49b]/45 bg-[#9a3412]/20 text-[#ffd0ad] backdrop-blur-sm">
                    <Icon className="h-6 w-6" />
                  </span>
                  <div>
                    <p className="text-base font-semibold text-white">{title}</p>
                    <p className="text-sm text-gray-200">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Food image floating circle */}
          <div className="absolute bottom-20 right-3 hidden xl:block">
            <div className="h-64 w-64 overflow-hidden rounded-full border-4 border-[#ffd0ad]/80 bg-white shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80"
                alt="food"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* Floating vendor icon badge */}
        <div className="absolute right-16 top-[44%] z-20 -translate-y-1/2 translate-x-1/2">
          <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-white text-[#b74717] shadow-2xl">
            <FiShoppingBag className="h-9 w-9" />
          </div>
        </div>
      </div>

      {/* ── RIGHT: white login panel ── */}
      <div
        className={`flex min-h-0 flex-1 flex-col justify-center overflow-hidden px-6 lg:pl-20 lg:pr-24 ${
          isBranchLogin ? 'py-6 lg:py-8' : 'py-12 lg:pt-20'
        }`}
      >
        <div className={`mx-auto w-full max-w-[440px] ${isBranchLogin ? 'space-y-5' : 'space-y-7'}`}>
          {/* Mobile logo */}
          <Link to="/" className="flex items-center gap-2 lg:hidden">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#9a3412] text-white">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
              </svg>
            </span>
            <span className="text-sm font-bold text-gray-900">QR Menu SaaS</span>
          </Link>

          {/* Heading */}
          <div className="flex items-center gap-4">
            <span className="flex h-16 w-16 items-center justify-center rounded-xl border border-[#f1b089]/40 bg-[#fff7ed] text-[#a43a12] shadow-sm">
              <PanelIcon className="h-9 w-9" />
            </span>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{panel.title}</h2>
              <p className="text-sm text-gray-500">{panel.subtitle}</p>
            </div>
          </div>

          {role !== 'platform' && (
            <div className="grid grid-cols-2 gap-2 rounded-xl border border-gray-200 bg-gray-50 p-1">
              {[
                { key: 'restaurant', label: 'Vendor', icon: FiShoppingBag },
                { key: 'employee', label: 'Staff', icon: FiUsers },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setRole(key)}
                  className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                    role === key
                      ? 'bg-white text-[#8f2a05] shadow-sm'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* Login mode panel — vendor keeps Google block height; branch uses shorter hint */}
          <div
            className={
              role === 'restaurant' ? (isBranchLogin ? 'h-[72px] shrink-0' : 'min-h-[118px]') : ''
            }
          >
            <AnimatePresence mode="wait" initial={false}>
              {role === 'restaurant' && !isBranchLogin && (
                <motion.div
                  key="vendor-email-mode"
                  initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                  className="space-y-7"
                >
                  <GoogleSignIn onSuccess={handleGoogleSuccess} disabled={googleLoading} />
                  <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
                    <span className="h-px flex-1 bg-gray-200" />
                    OR USE EMAIL
                    <span className="h-px flex-1 bg-gray-200" />
                  </div>
                </motion.div>
              )}

              {role === 'restaurant' && isBranchLogin && (
                <motion.div
                  key="branch-mode"
                  initial={{ opacity: 0, y: 12, scale: 0.98, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -12, scale: 0.98, filter: 'blur(4px)' }}
                  transition={{ type: 'spring', stiffness: 190, damping: 20 }}
                  className="rounded-xl border border-[#f1b089]/60 bg-[#fff7ed] px-4 py-3 text-sm text-[#7c260b] shadow-sm shadow-[#8f2a05]/5"
                >
                  Branch outlet login: enter your <strong>@branch.com</strong> username,{' '}
                  <strong>Restaurant ID</strong>, and password.
                </motion.div>
              )}

              {role === 'employee' && (
                <motion.div
                  key="employee-mode"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-800"
                >
                  {staffCopy}
                </motion.div>
              )}

              {role === 'platform' && (
                <motion.div
                  key="platform-mode"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600"
                >
                  Platform access is intentionally separate from vendor and staff login.
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Form */}
          <motion.form
            layout
            transition={{ layout: { duration: 0.24, ease: 'easeOut' } }}
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-5"
          >
            {/* Email field */}
            {(role === 'platform' || role === 'restaurant') && (
              <TextInput
                label={isBranchLogin ? 'Branch Username' : 'Email Address'}
                icon={FiMail}
                type="text"
                placeholder={
                  role === 'platform'
                    ? 'admin@company.com'
                    : isBranchLogin
                      ? 'outletname@branch.com'
                      : 'vendor@restaurant.com or 98XXXXXXXX'
                }
                rightIcon={FiMail}
                error={errors.email?.message}
                {...register('email', {
                  required: isBranchLogin ? 'Branch username is required' : 'Email or mobile is required',
                })}
              />
            )}

            {/* Branch restaurant ID — fixed slot height keeps panel from growing / scrolling */}
            {role === 'restaurant' && (
              <div className={`shrink-0 overflow-hidden ${isBranchLogin ? 'h-[76px]' : 'h-0'}`}>
                <AnimatePresence initial={false}>
                  {isBranchLogin && (
                    <motion.div
                      key="branch-restaurant-id"
                      initial={{ opacity: 0, height: 0, y: -10, scale: 0.98 }}
                      animate={{ opacity: 1, height: 'auto', y: 0, scale: 1 }}
                      exit={{ opacity: 0, height: 0, y: -10, scale: 0.98 }}
                      transition={{ type: 'spring', stiffness: 210, damping: 24 }}
                      className="overflow-hidden"
                    >
                      <TextInput
                        label="Restaurant ID"
                        icon={FiBriefcase}
                        placeholder="REST-2041 or Mongo id"
                        error={errors.restaurantIdBranch?.message}
                        {...register('restaurantIdBranch', { required: 'Restaurant ID is required' })}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Employee fields */}
            {role === 'employee' && (
              <>
                <TextInput
                  label="Username"
                  icon={FiUser}
                  placeholder="staff username"
                  error={errors.username?.message}
                  {...register('username', { required: 'Username is required' })}
                />
                <TextInput
                  label="Restaurant ID"
                  icon={FiBriefcase}
                  placeholder="REST-2041 or technical id"
                  error={errors.restaurantId?.message}
                  {...register('restaurantId', { required: 'Restaurant ID is required' })}
                />
              </>
            )}

            {/* Password */}
            <PasswordInput
              label="Password"
              placeholder="Enter your password"
              error={errors.password?.message}
              {...register('password', { required: 'Password is required' })}
            />

            {/* Links row */}
            <div
              className={`flex flex-wrap items-center gap-3 text-sm ${
                role === 'restaurant' && isBranchLogin ? 'justify-end' : 'justify-between'
              }`}
            >
              {!(role === 'restaurant' && isBranchLogin) && (
                <Link to="/forgot-password" className="font-medium text-[#8f2a05] hover:text-[#5f1d08]">
                  Forgot password?
                </Link>
              )}
              {role === 'restaurant' && !isBranchLogin && (
                <Link to="/vendor/register" className="font-semibold text-[#8f2a05] hover:text-[#5f1d08]">
                  Register as vendor
                </Link>
              )}
              {role === 'restaurant' && isBranchLogin && (
                <span className="text-xs text-gray-400">Password resets are done from the main restaurant dashboard.</span>
              )}
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading || googleLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#8f2a05] py-3.5 text-sm font-semibold text-white shadow-md shadow-[#8f2a05]/20 transition hover:bg-[#6f2106] disabled:opacity-60"
            >
              {loading || googleLoading ? (
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30 60" />
                </svg>
              ) : null}
              {panel.buttonLabel}
              {!loading && !googleLoading && <FiArrowRight className="h-4 w-4" />}
            </button>
          </motion.form>

          {/* Secure access footer card */}
          <div className="flex items-start gap-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#f1b089]/40 bg-white text-[#a43a12] shadow-sm">
              <FiShield className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-[#8f2a05]">Secure Access</p>
              <p className="mt-0.5 text-xs leading-5 text-gray-500">
                We use industry-standard security to keep your restaurant data safe and private.
              </p>
            </div>
          </div>

          {/* Demo credentials — hidden in branch mode to keep login panel within viewport */}
          {!(role === 'restaurant' && isBranchLogin) && (
            <div className="rounded-lg bg-gray-50 px-4 py-3 text-xs text-gray-500">
              {role === 'platform' ? (
                <p><span className="font-semibold text-gray-700">Demo:</span> superadmin@qrmenu.com / Admin@123</p>
              ) : role === 'restaurant' ? (
                <p>
                  <span className="font-semibold text-gray-700">Vendor demo:</span> test@restaurant.com / Test@123456.
                  <span className="mt-1 block">Branch demo: use credentials from Branch Management after creating an outlet (…@branch.com + Restaurant ID).</span>
                </p>
              ) : (
                <p>Ask your restaurant vendor for your staff username, password, and restaurant ID.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Login
