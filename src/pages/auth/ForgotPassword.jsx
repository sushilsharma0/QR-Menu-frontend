import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { FiArrowLeft, FiMail } from 'react-icons/fi'
import toast from 'react-hot-toast'
import api from '../../services/api'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'

const ForgotPassword = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm()

  const onSubmit = async (data) => {
    try {
      setLoading(true)
      await api.post('/restaurant/auth/forgot-password', data)
      toast.success('OTP sent to your email')
      navigate(`/reset-password?email=${encodeURIComponent(data.email)}`)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,#ecfeff,transparent_32%),linear-gradient(135deg,#f8fafc,#ffffff_44%,#f0fdf4)] p-4 text-gray-950 dark:bg-gray-950 dark:bg-none dark:text-gray-100">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-950 dark:text-white">Reset Password</h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400">We will send a 6-digit code to your vendor email.</p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-xl dark:border-gray-800 dark:bg-gray-900">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label="Vendor Email Address"
              icon={FiMail}
              type="email"
              placeholder="owner@restaurant.com"
              {...register('email', { required: 'Email is required' })}
              error={errors.email?.message}
            />

            <Button type="submit" loading={loading} className="w-full py-3">
              Send Reset Code
            </Button>
          </form>

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

export default ForgotPassword
