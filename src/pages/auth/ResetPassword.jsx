import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { FiLock, FiKey } from 'react-icons/fi'
import toast from 'react-hot-toast'
import api from '../../services/api'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'

const ResetPassword = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, watch, formState: { errors } } = useForm()
  const newPassword = watch('newPassword')

  const onSubmit = async (data) => {
    try {
      setLoading(true)
      await api.post('/restaurant/auth/reset-password', {
        email: data.email,
        otp: data.otp,
        newPassword: data.newPassword
      })
      toast.success('Password reset successful! Please login.')
      navigate('/login')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-600">QR Menu SaaS</h1>
          <p className="text-gray-500 mt-2">Create new password</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label="Email Address"
              icon={FiKey}
              type="email"
              placeholder="Enter your email"
              {...register('email', { required: 'Email is required' })}
              error={errors.email?.message}
            />

            <Input
              label="OTP Code"
              icon={FiKey}
              placeholder="Enter 6-digit OTP"
              {...register('otp', { 
                required: 'OTP is required',
                minLength: { value: 6, message: 'OTP must be 6 digits' },
                maxLength: { value: 6, message: 'OTP must be 6 digits' }
              })}
              error={errors.otp?.message}
            />

            <Input
              label="New Password"
              icon={FiLock}
              type="password"
              placeholder="Enter new password"
              {...register('newPassword', { 
                required: 'Password is required',
                minLength: { value: 8, message: 'Password must be at least 8 characters' }
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
                validate: value => value === newPassword || 'Passwords do not match'
              })}
              error={errors.confirmPassword?.message}
            />

            <Button type="submit" loading={loading} className="w-full">
              Reset Password
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ResetPassword