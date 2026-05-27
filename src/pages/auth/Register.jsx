import React, { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import {
  FiArrowLeft,
  FiArrowRight,
  FiBriefcase,
  FiCheckCircle,
  FiCoffee,
  FiGift,
  FiKey,
  FiLock,
  FiMail,
  FiMapPin,
  FiPhone,
  FiShield,
  FiShoppingBag,
  FiUsers,
} from 'react-icons/fi'
import toast from '@utils/toast'
import api from '../../services/api'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import AuthContactCard from '../../components/auth/AuthContactCard'
import { PLATFORM_LOGO_SRC } from '../../constants/platformBrand'

const Register = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [checkingReferral, setCheckingReferral] = useState(false)
  const [referralStatus, setReferralStatus] = useState(null)
  const [step, setStep] = useState('details')
  const [pendingEmail, setPendingEmail] = useState('')
  const [otpDigits, setOtpDigits] = useState(() => Array(6).fill(''))
  const [siteConfig, setSiteConfig] = useState(null)
  const otpRefs = useRef([])
  const { register, handleSubmit, watch, formState: { errors } } = useForm()
  const password = watch('password')
  const referralCodeValue = watch('referralCode')

  useEffect(() => {
    let cancelled = false

    api
      .get('/customer/landing/site-config', { skipErrorToast: true })
      .then((res) => {
        if (!cancelled) setSiteConfig(res.data?.data || null)
      })
      .catch(() => {
        if (!cancelled) setSiteConfig(null)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const onSubmit = async (data) => {
    try {
      setLoading(true)
      const response = await api.post('/restaurant/auth/register', {
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
        address: data.address,
        referralCode: data.referralCode,
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

  const checkReferralCode = async () => {
    const code = String(referralCodeValue || '').trim()
    if (!code) {
      setReferralStatus(null)
      toast.error('Enter referral code first')
      return
    }

    try {
      setCheckingReferral(true)
      const response = await api.post('/restaurant/auth/check-referral-code', {
        referralCode: code,
      })
      const restaurantName = response.data?.data?.restaurantName
      setReferralStatus({
        type: 'success',
        message: restaurantName ? `Valid code from ${restaurantName}` : 'Referral code is valid',
      })
      toast.success('Referral code is valid')
    } catch (error) {
      setReferralStatus({
        type: 'error',
        message: error.response?.data?.message || 'Referral code is invalid',
      })
      toast.error(error.response?.data?.message || 'Referral code is invalid')
    } finally {
      setCheckingReferral(false)
    }
  }

const leftFeatures = [
    { icon: FiCoffee, title: 'Menu Setup', desc: 'Create digital menus and ordering flows' },
    { icon: FiUsers, title: 'Team Ready', desc: 'Invite kitchen, cashier, and waiter staff' },
    { icon: FiShield, title: 'Secure Onboarding', desc: 'Verify email before opening your dashboard' },
]

const OTP_SLOT_KEYS = ['otp-1', 'otp-2', 'otp-3', 'otp-4', 'otp-5', 'otp-6']

  const benefitCards = ['Free trial', 'KYC ready', 'Referral month']
  const brandName = siteConfig?.softwareName?.trim() || 'QR Restro Nepal'
  const brandSubtitle = siteConfig?.brandSubtitle?.trim() || 'Nepal'
  const brandLogo = siteConfig?.landingLogo?.trim() || PLATFORM_LOGO_SRC

  return (
    <div className="flex min-h-screen overflow-hidden bg-white font-sans">
      <div
        className="relative hidden w-[47%] shrink-0 overflow-hidden lg:block"
        style={{
          background: 'linear-gradient(160deg, #4a1b10 0%, #7d3218 48%, #2f150d 100%)',
        }}
      >
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

        <div className="relative z-10 h-full px-12 py-14 xl:px-36">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#ffc49b]/35 bg-white shadow-lg shadow-[#4a1608]/25">
              <img
                src={brandLogo}
                alt=""
                className="h-full w-full scale-[1.35] object-contain"
              />
            </span>
            <div className="min-w-0">
              <p className="max-w-[18rem] truncate text-sm font-bold leading-tight text-white">
                {brandName}
              </p>
              <p className="mt-0.5 max-w-[18rem] truncate text-xs uppercase tracking-[0.28em] text-[#ffc49b]">
                {brandSubtitle}
              </p>
            </div>
          </div>

          <div className="mt-20 space-y-5 xl:mt-20">
            <div>
              <h1 className="text-5xl font-semibold leading-tight text-white">Start your</h1>
              <h1 className="text-5xl font-semibold leading-tight text-[#ff7a24]">
                Vendor account <span aria-hidden="true">{'\u{1F44B}'}</span>
              </h1>
            </div>
            <p className="max-w-sm text-base leading-8 text-gray-100">
              Register your restaurant, verify your email, and begin setting up menus, staff, billing, and QR ordering.
            </p>

            <div className="space-y-7 pt-10">
              {leftFeatures.map(({ icon: Icon, title, desc }) => (
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

        <div className="absolute right-16 top-[44%] z-20 -translate-y-1/2 translate-x-1/2">
          <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-white text-[#b74717] shadow-2xl">
            <FiShoppingBag className="h-9 w-9" />
          </div>
        </div>
      </div>

      <div className="flex flex-1 items-start justify-center overflow-y-auto px-6 py-12 lg:pl-20 lg:pr-24 lg:pt-16">
        <section className="w-full max-w-[520px] space-y-6">

          <div className="flex items-center gap-4">
            <span className="flex h-16 w-16 items-center justify-center rounded-xl border border-[#f1b089]/40 bg-[#fff7ed] text-[#a43a12] shadow-sm">
              <FiShoppingBag className="h-9 w-9" />
            </span>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#8f2a05]">Vendor onboarding</p>
              <h2 className="mt-1 text-2xl font-semibold text-gray-950">Create account</h2>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {benefitCards.map((item) => (
              <div key={item} className="rounded-xl border border-gray-100 bg-gray-50 p-4 shadow-sm">
                <FiCheckCircle className="h-5 w-5 text-[#a43a12]" />
                <p className="mt-3 text-sm font-semibold text-gray-900">{item}</p>
              </div>
            ))}
          </div>

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

              <div className="w-full">
                <label htmlFor="referral-code" className="mb-1 block text-sm font-medium text-gray-700">
                  Referral Code
                </label>
                <div className="flex overflow-hidden rounded-lg border border-gray-300 bg-white shadow-sm focus-within:border-[#9a3412] focus-within:ring-2 focus-within:ring-[#9a3412]/25">
                  <div className="flex items-center pl-3 text-gray-400">
                    <FiGift className="h-4 w-4" />
                  </div>
                  <input
                    id="referral-code"
                    type="text"
                    placeholder="Optional code"
                    className="min-w-0 flex-1 border-0 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-gray-900 outline-none placeholder:font-normal placeholder:normal-case placeholder:tracking-normal"
                    {...register('referralCode', {
                      onChange: () => setReferralStatus(null),
                    })}
                  />
                  <button
                    type="button"
                    onClick={checkReferralCode}
                    disabled={checkingReferral || !String(referralCodeValue || '').trim()}
                    className="shrink-0 border-l border-gray-200 bg-[#fff7ed] px-5 text-sm font-bold text-[#8f2a05] transition hover:bg-[#fde6d3] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {checkingReferral ? 'Checking' : 'Check'}
                  </button>
                </div>
                {(errors.referralCode?.message || referralStatus?.message) && (
                  <p
                    className={`mt-1 text-xs ${
                      referralStatus?.type === 'success' ? 'text-green-700' : 'text-red-600'
                    }`}
                  >
                    {errors.referralCode?.message || referralStatus?.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#8f2a05] py-3.5 text-sm font-semibold text-white shadow-md shadow-[#8f2a05]/20 transition hover:bg-[#6f2106] disabled:opacity-60"
              >
                Send Verification Code
                {!loading && <FiArrowRight className="h-4 w-4" />}
              </button>

              <p className="text-center text-xs leading-5 text-gray-500">
                By creating a vendor account, you agree to our{' '}
                <Link
                  to="/terms-and-conditions"
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-[#8f2a05] hover:text-[#5f1d08]"
                >
                  Terms and Conditions
                </Link>
                .
              </p>
            </form>
          ) : (
            <form onSubmit={onVerify} className="space-y-5">
              <div className="rounded-lg border border-[#f1b089]/50 bg-[#fff7ed] px-4 py-3 text-sm text-[#7c260b]">
                We sent a 6-digit verification code to <span className="font-semibold">{pendingEmail}</span>.
                Wrong email? Use <span className="font-semibold">Edit details</span> to update your information and resend the code.
              </div>

              <div>
                <label id="register-verification-code-label" className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                  <FiKey className="h-4 w-4 text-[#a43a12]" />
                  Verification Code
                </label>
                <div className="grid grid-cols-6 gap-2 sm:gap-3" onPaste={handleOtpPaste}>
                  {otpDigits.map((digit, index) => (
                    <input
                      key={OTP_SLOT_KEYS[index]}
                      aria-labelledby="register-verification-code-label"
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
                      className="aspect-square w-full rounded-lg border border-gray-300 bg-white text-center text-2xl font-bold text-gray-950 shadow-sm outline-none transition focus:border-[#9a3412] focus:ring-2 focus:ring-[#9a3412]/25"
                    />
                  ))}
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Paste the full code or type each digit.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#8f2a05] py-3.5 text-sm font-semibold text-white shadow-md shadow-[#8f2a05]/20 transition hover:bg-[#6f2106] disabled:opacity-60"
              >
                Verify and Activate Vendor
                {!loading && <FiArrowRight className="h-4 w-4" />}
              </button>

              <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setOtpDigits(Array(6).fill(''))
                    setStep('details')
                  }}
                  className="font-medium text-gray-500 hover:text-gray-900"
                >
                  Edit details
                </button>
                <button
                  type="button"
                  onClick={resendCode}
                  disabled={resending}
                  className="font-semibold text-[#8f2a05] hover:text-[#5f1d08] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {resending ? 'Sending...' : 'Resend code'}
                </button>
              </div>
            </form>
          )}

          <p className="text-center text-sm text-gray-600">
            Already have a vendor account?{' '}
            <Link to="/vendor/login" className="font-semibold text-[#8f2a05] hover:text-[#5f1d08]">
              Sign in
            </Link>
          </p>

          <AuthContactCard
            title="Need help creating your account?"
            description="Contact support for onboarding, verification, pricing, or vendor setup guidance."
          />
        </section>
      </div>
    </div>
  )
}

export default Register
