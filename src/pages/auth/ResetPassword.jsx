import React, { useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { FiArrowLeft, FiKey, FiLock, FiMail } from 'react-icons/fi'
import toast from '@utils/toast'
import api from '../../services/api'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'

const RESET_CODE_DIGIT_IDS = ['reset-code-1', 'reset-code-2', 'reset-code-3', 'reset-code-4', 'reset-code-5', 'reset-code-6']

const ResetPassword = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialEmail = searchParams.get('email') || ''
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState('code')
  const [verifiedEmail, setVerifiedEmail] = useState(initialEmail)
  const verifiedOtpRef = useRef('')
  const [otpDigits, setOtpDigits] = useState(() => Array(6).fill(''))
  const otpRefs = useRef([])
  const {
    register,
    handleSubmit,
    getValues,
    watch,
    formState: { errors },
  } = useForm({ defaultValues: { email: initialEmail } })
  const newPassword = watch('newPassword')

  const otp = otpDigits.join('')

  const updateOtpDigit = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1)
    setOtpDigits((current) => {
      const next = [...current]
      next[index] = digit
      return next
    })
    if (digit && index < 5) otpRefs.current[index + 1]?.focus()
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

  const validateCode = async (data) => {
    if (otp.length !== 6) {
      toast.error('Enter the 6-digit reset code')
      otpRefs.current[otp.length]?.focus()
      return
    }

    try {
      setLoading(true)
      await api.post('/restaurant/auth/validate-reset-code', {
        email: data.email,
        otp,
      })
      setVerifiedEmail(data.email)
      verifiedOtpRef.current = otp
      setStep('password')
      toast.success('Code verified. Create your new password.')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid reset code')
    } finally {
      setLoading(false)
    }
  }

  const resendCode = async () => {
    const email = getValues('email')
    if (!email) {
      toast.error('Enter your email first')
      return
    }
    try {
      setLoading(true)
      await api.post('/restaurant/auth/forgot-password', { email })
      setOtpDigits(Array(6).fill(''))
      toast.success('New reset code sent')
      otpRefs.current[0]?.focus()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to resend code')
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (data) => {
    try {
      setLoading(true)
      await api.post('/restaurant/auth/reset-password', {
        email: verifiedEmail,
        otp: verifiedOtpRef.current,
        newPassword: data.newPassword,
      })
      toast.success('Password reset successful. Please sign in.')
      navigate('/vendor/login')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reset password')
      if (error.response?.status === 400) setStep('code')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,#ecfeff,transparent_32%),linear-gradient(135deg,#f8fafc,#ffffff_44%,#f0fdf4)] p-4 text-gray-950 dark:bg-gray-950 dark:bg-none dark:text-gray-100">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold text-gray-950 dark:text-white">
            {step === 'code' ? 'Verify Reset Code' : 'Create New Password'}
          </h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            {step === 'code'
              ? 'Validate the email code first. Password fields appear after verification.'
              : 'Your code is verified. Set a strong new password.'}
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-xl dark:border-gray-800 dark:bg-gray-900">
          {step === 'code' ? (
            <form onSubmit={handleSubmit(validateCode)} className="space-y-5">
              <Input
                label="Vendor Email Address"
                icon={FiMail}
                type="email"
                placeholder="owner@restaurant.com"
                {...register('email', { required: 'Email is required' })}
                error={errors.email?.message}
              />

              <div>
                <label htmlFor="reset-code-1" className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <FiKey className="h-4 w-4 text-emerald-600" />
                  Reset Code
                </label>
                <div className="grid grid-cols-6 gap-2 sm:gap-3" onPaste={handleOtpPaste}>
                  {RESET_CODE_DIGIT_IDS.map((inputId, index) => (
                    <input
                      key={inputId}
                      ref={(node) => {
                        otpRefs.current[index] = node
                      }}
                      id={inputId}
                      type="text"
                      inputMode="numeric"
                      autoComplete={index === 0 ? 'one-time-code' : 'off'}
                      maxLength={1}
                      value={otpDigits[index]}
                      onChange={(event) => updateOtpDigit(index, event.target.value)}
                      onKeyDown={(event) => handleOtpKeyDown(index, event)}
                      aria-label={`Reset code digit ${index + 1}`}
                      className="aspect-square w-full rounded-lg border border-gray-300 bg-white text-center text-2xl font-semibold text-gray-950 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                    />
                  ))}
                </div>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Paste the full code or type each digit.
                </p>
              </div>

              <Button type="submit" loading={loading} className="w-full py-3">
                Validate Code
              </Button>

              <button
                type="button"
                onClick={resendCode}
                disabled={loading}
                className="w-full text-sm font-semibold text-emerald-700 hover:text-emerald-800 disabled:cursor-not-allowed disabled:opacity-50 dark:text-emerald-300"
              >
                Resend code
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit(resetPassword)} className="space-y-5">
              <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100">
                Code verified for <span className="font-semibold">{verifiedEmail}</span>.
              </div>

              <Input
                label="New Password"
                icon={FiLock}
                type="password"
                placeholder="Enter new password"
                {...register('newPassword', {
                  required: 'Password is required',
                  minLength: { value: 8, message: 'Password must be at least 8 characters' },
                })}
                error={errors.newPassword?.message}
              />

              <Input
                label="Confirm Password"
                icon={FiLock}
                type="password"
                placeholder="Confirm new password"
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: value => value === newPassword || 'Passwords do not match',
                })}
                error={errors.confirmPassword?.message}
              />

              <Button type="submit" loading={loading} className="w-full py-3">
                Change Password
              </Button>

              <button
                type="button"
                onClick={() => setStep('code')}
                className="w-full text-sm font-semibold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >
                Use a different code
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link to="/vendor/login" className="inline-flex items-center justify-center gap-1 text-sm font-semibold text-emerald-700 hover:text-emerald-800 dark:text-emerald-300">
              <FiArrowLeft className="h-4 w-4" />
              Back to vendor login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResetPassword
