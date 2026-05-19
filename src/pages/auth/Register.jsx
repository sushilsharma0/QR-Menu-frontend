import React, { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { FiArrowLeft, FiBriefcase, FiCheckCircle, FiCoffee, FiKey, FiLock, FiMail, FiMapPin, FiPhone, FiZap } from 'react-icons/fi'
import { FcGoogle } from 'react-icons/fc'
import toast from '@utils/toast'
import api from '../../services/api'
import { useAuth } from '../../hooks/useAuth'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

const VendorGoogleButton = ({ onSuccess, disabled }) => {
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
        text: 'signup_with',
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

  if (!GOOGLE_CLIENT_ID) return null

  return (
    <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-white to-emerald-50/50 p-4 shadow-sm dark:border-gray-800 dark:from-gray-950 dark:to-emerald-950/20">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <FcGoogle className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-bold text-gray-950 dark:text-white">Start with Google</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Create a vendor account faster</p>
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
          Loading Google sign-up
        </button>
      )}
      <div className="mt-4 flex items-center gap-2 rounded-lg bg-white/70 px-3 py-2 text-xs text-gray-500 dark:bg-gray-900/70 dark:text-gray-400">
        <FiZap className="h-4 w-4 text-emerald-600" />
        <span>Google signup skips the email code because Google already verifies your email.</span>
      </div>
    </div>
  )
}

const Register = () => {
  const navigate = useNavigate()
  const { loginWithGoogle } = useAuth()
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [step, setStep] = useState('details')
  const [pendingEmail, setPendingEmail] = useState('')
  const [otpDigits, setOtpDigits] = useState(Array(6).fill(''))
  const otpRefs = useRef([])
  const { register, handleSubmit, watch, formState: { errors } } = useForm()
  const password = watch('password')

  const onSubmit = async (data) => {
    try {
      setLoading(true)
      const response = await api.post('/restaurant/auth/register', {
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
        address: data.address,
        previousEmail: pendingEmail || undefined,
      })
      setPendingEmail(response.data?.data?.email || data.email)
      setOtpDigits(Array(6).fill(''))
      setStep('verify')
      toast.success(response.data?.message || 'Verification code sent to your email')
      toast('Enter the code from your email to activate the vendor account.', {
        duration: 7500,
      })
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const onVerify = async (event) => {
    event.preventDefault()
    const otp = otpDigits.join('')
    if (otp.length !== 6) {
      toast.error('Enter the 6-digit verification code')
      otpRefs.current[otp.length]?.focus()
      return
    }

    try {
      setLoading(true)
      await api.post('/restaurant/auth/verify-registration', {
        email: pendingEmail,
        otp,
      })
      toast.success('Email verified. Sign in to start your free trial.')
      toast('After login, your trial and super-admin feature permissions decide what is enabled. KYC and plans are available from your account.', {
        duration: 7500,
      })
      navigate('/vendor/login')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  const updateOtpDigit = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1)
    setOtpDigits((current) => {
      const next = [...current]
      next[index] = digit
      return next
    })
    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index, event) => {
    if (event.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault()
      otpRefs.current[index - 1]?.focus()
    }
    if (event.key === 'ArrowRight' && index < 5) {
      event.preventDefault()
      otpRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpPaste = (event) => {
    event.preventDefault()
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pasted) return
    const next = Array(6).fill('')
    pasted.split('').forEach((digit, index) => {
      next[index] = digit
    })
    setOtpDigits(next)
    otpRefs.current[Math.min(pasted.length, 6) - 1]?.focus()
  }

  const resendCode = async () => {
    try {
      setResending(true)
      const response = await api.post('/restaurant/auth/resend-registration-code', {
        email: pendingEmail,
      })
      toast.success(response.data?.message || 'Verification code resent')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to resend code')
    } finally {
      setResending(false)
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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,#dcfce7,transparent_30%),linear-gradient(135deg,#f8fafc,#ffffff_48%,#eff6ff)] px-4 py-6 text-gray-950 dark:bg-gray-950 dark:bg-none dark:text-gray-100 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] w-full max-w-6xl items-center gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="space-y-7">
          <Link to="/vendor/login" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-950 dark:text-gray-300 dark:hover:text-white">
            <FiArrowLeft className="h-4 w-4" />
            Back to vendor login
          </Link>

          <div>
            <span className="inline-flex items-center gap-2 rounded-lg bg-emerald-100 px-3 py-2 text-sm font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
              <FiCoffee className="h-4 w-4" />
              Restaurant is vendor
            </span>
            <h1 className="mt-5 max-w-xl text-4xl font-bold leading-tight text-gray-950 dark:text-white sm:text-5xl">
              Register your restaurant vendor account.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-gray-600 dark:text-gray-300">
              Create the owner account first. After login, complete KYC, set up the profile, invite staff, and start building the digital menu.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {['14-day trial', 'KYC ready', 'Staff tools'].map((item) => (
              <div key={item} className="rounded-lg border border-gray-200 bg-white/80 p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900/80">
                <FiCheckCircle className="h-5 w-5 text-emerald-600" />
                <p className="mt-3 text-sm font-semibold text-gray-900 dark:text-white">{item}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-2xl shadow-gray-200/70 dark:border-gray-800 dark:bg-gray-900 dark:shadow-black/30 sm:p-8">
          <div className="mb-7">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-700 dark:text-emerald-300">Vendor onboarding</p>
            <h2 className="mt-2 text-2xl font-bold text-gray-950 dark:text-white">Create account</h2>
          </div>

          {step === 'details' && (
            <div>
              <VendorGoogleButton onSuccess={handleGoogleSuccess} disabled={googleLoading} />
              {GOOGLE_CLIENT_ID && (
                <div className="my-6 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                  <span className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
                  or register with email
                  <span className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
                </div>
              )}
            </div>
          )}

          {step === 'details' ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Restaurant Name"
                icon={FiBriefcase}
                placeholder="Enter restaurant name"
                {...register('name', { required: 'Restaurant name is required' })}
                error={errors.name?.message}
              />

              <Input
                label="Email Address"
                icon={FiMail}
                type="email"
                placeholder="owner@restaurant.com"
                {...register('email', { required: 'Email is required' })}
                error={errors.email?.message}
              />

              <Input
                label="Phone Number"
                icon={FiPhone}
                placeholder="Enter phone number"
                {...register('phone', {
                  required: 'Phone number is required',
                  validate: value => String(value || '').replace(/\D/g, '').length >= 7 || 'Enter a valid mobile number',
                })}
                error={errors.phone?.message}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Password"
                  icon={FiLock}
                  type="password"
                  placeholder="Create password"
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 8, message: 'Password must be at least 8 characters' },
                  })}
                  error={errors.password?.message}
                />

                <Input
                  label="Confirm Password"
                  icon={FiLock}
                  type="password"
                  placeholder="Confirm password"
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: value => value === password || 'Passwords do not match',
                  })}
                  error={errors.confirmPassword?.message}
                />
              </div>

              <Input
                label="Address"
                icon={FiMapPin}
                placeholder="Enter restaurant address"
                {...register('address', { required: 'Address is required' })}
                error={errors.address?.message}
              />

              <Button type="submit" loading={loading || googleLoading} className="w-full py-3">
                Send Verification Code
              </Button>
            </form>
          ) : (
            <form onSubmit={onVerify} className="space-y-5">
              <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100">
                We sent a 6-digit verification code to <span className="font-semibold">{pendingEmail}</span>.
                Wrong email? Use <span className="font-semibold">Edit details</span> to update your information and resend the code.
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <FiKey className="h-4 w-4 text-emerald-600" />
                  Verification Code
                </label>
                <div className="grid grid-cols-6 gap-2 sm:gap-3" onPaste={handleOtpPaste}>
                  {otpDigits.map((digit, index) => (
                    <input
                      key={index}
                      ref={(node) => {
                        otpRefs.current[index] = node
                      }}
                      type="text"
                      inputMode="numeric"
                      autoComplete={index === 0 ? 'one-time-code' : 'off'}
                      maxLength={1}
                      value={digit}
                      onChange={(event) => updateOtpDigit(index, event.target.value)}
                      onKeyDown={(event) => handleOtpKeyDown(index, event)}
                      aria-label={`Verification code digit ${index + 1}`}
                      className="aspect-square w-full rounded-lg border border-gray-300 bg-white text-center text-2xl font-bold text-gray-950 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                    />
                  ))}
                </div>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Paste the full code or type each digit.
                </p>
              </div>

              <Button type="submit" loading={loading} className="w-full py-3">
                Verify and Activate Vendor
              </Button>

              <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setOtpDigits(Array(6).fill(''))
                    setStep('details')
                  }}
                  className="font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                >
                  Edit details
                </button>
                <button
                  type="button"
                  onClick={resendCode}
                  disabled={resending}
                  className="font-semibold text-emerald-700 hover:text-emerald-800 disabled:cursor-not-allowed disabled:opacity-50 dark:text-emerald-300"
                >
                  {resending ? 'Sending...' : 'Resend code'}
                </button>
              </div>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-300">
            Already have a vendor account?{' '}
            <Link to="/vendor/login" className="font-semibold text-emerald-700 hover:text-emerald-800 dark:text-emerald-300">
              Sign in
            </Link>
          </p>
        </section>
      </div>
    </div>
  )
}

export default Register
