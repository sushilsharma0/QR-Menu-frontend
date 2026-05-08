import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { FiLock, FiMail, FiShield, FiUser } from 'react-icons/fi'
import api from '../../services/api'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import { useAuth } from '../../hooks/useAuth'

const Profile = () => {
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()
  const { register, handleSubmit, watch, formState: { errors } } = useForm()
  const newPassword = watch('newPassword')

  const onSubmit = async (data) => {
    try {
      setLoading(true)
      await api.post('/restaurant/auth/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      })
      toast.success('Password changed successfully')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100">Profile & Security</h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">Review your restaurant account and update your password.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <Card>
          <div className="flex flex-col items-center text-center">
            <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-3xl bg-primary-100 shadow-lg shadow-primary-900/10 dark:bg-gray-800">
              {user?.logo ? (
                <img src={user.logo} alt={user?.name || 'Profile'} className="h-full w-full object-cover" />
              ) : (
                <FiUser className="h-10 w-10 text-primary-600 dark:text-primary-300" />
              )}
            </div>
            <h2 className="mt-5 text-xl font-black text-gray-950 dark:text-gray-100">{user?.name || 'Restaurant account'}</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
            <div className="mt-5 grid w-full gap-3 text-left">
              <div className="flex items-center gap-3 rounded-2xl bg-gray-50 p-3 dark:bg-gray-800">
                <FiMail className="h-4 w-4 text-primary-600 dark:text-primary-300" />
                <span className="truncate text-sm font-semibold text-gray-700 dark:text-gray-200">{user?.email || 'No email'}</span>
              </div>
              <div className="flex items-center gap-3 rounded-2xl bg-gray-50 p-3 dark:bg-gray-800">
                <FiShield className="h-4 w-4 text-primary-600 dark:text-primary-300" />
                <span className="text-sm font-semibold capitalize text-gray-700 dark:text-gray-200">{user?.role || 'restaurant'}</span>
              </div>
            </div>
          </div>
        </Card>

        <Card title="Change Password">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="mb-2 flex items-center gap-3 rounded-2xl bg-primary-50 p-4 text-primary-800 dark:bg-gray-800 dark:text-primary-200">
              <FiLock className="h-5 w-5" />
              <p className="text-sm font-semibold">Use a strong password to protect restaurant orders, billing, and staff access.</p>
            </div>
            <Input
              label="Current Password"
              type="password"
              placeholder="Enter current password"
              {...register('currentPassword', { required: 'Current password is required' })}
              error={errors.currentPassword?.message}
            />
            <Input
              label="New Password"
              type="password"
              placeholder="Enter new password"
              {...register('newPassword', {
                required: 'New password is required',
                minLength: { value: 8, message: 'Password must be at least 8 characters' }
              })}
              error={errors.newPassword?.message}
            />
            <Input
              label="Confirm New Password"
              type="password"
              placeholder="Confirm new password"
              {...register('confirmPassword', {
                required: 'Please confirm your password',
                validate: value => value === newPassword || 'Passwords do not match'
              })}
              error={errors.confirmPassword?.message}
            />
            <Button type="submit" loading={loading} className="w-full">
              Change Password
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}

export default Profile
