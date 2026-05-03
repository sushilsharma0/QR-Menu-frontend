import React, { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { FiLock, FiHome } from 'react-icons/fi'
import { useAuth } from '../../hooks/useAuth'
import api from '../../services/api'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import { defaultPortalPathForUser } from '../../utils/tenantPaths'

const EmployeeChangePassword = () => {
  const { user, token, mergeUser } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm()

  if (!token || user?.scope !== 'employee') {
    return <Navigate to="/login" replace />
  }

  const onSubmit = async ({ currentPassword, newPassword, confirmPassword }) => {
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match')
      return
    }
    setLoading(true)
    try {
      await api.patch('/restaurant/employees/change-password', {
        currentPassword,
        newPassword,
      })
      mergeUser({ mustChangePassword: false })
      toast.success('Password updated')
      navigate(defaultPortalPathForUser(user), { replace: true })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center gap-2 mb-2 text-primary-600">
          <FiHome className="h-6 w-6" />
          <span className="font-semibold">QR Menu SaaS</span>
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-1">Set a new password</h1>
        <p className="text-sm text-gray-600 mb-6">
          {user?.mustChangePassword
            ? 'For security, replace your temporary password before using the app.'
            : 'Choose a strong password for your account.'}
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Current password"
            icon={FiLock}
            type="password"
            autoComplete="current-password"
            {...register('currentPassword', { required: 'Required' })}
            error={errors.currentPassword?.message}
          />
          <Input
            label="New password"
            icon={FiLock}
            type="password"
            autoComplete="new-password"
            {...register('newPassword', { required: 'Required' })}
            error={errors.newPassword?.message}
          />
          <Input
            label="Confirm new password"
            icon={FiLock}
            type="password"
            autoComplete="new-password"
            {...register('confirmPassword', { required: 'Required' })}
            error={errors.confirmPassword?.message}
          />
          <Button type="submit" loading={loading} className="w-full">
            Update password
          </Button>
        </form>
      </div>
    </div>
  )
}

export default EmployeeChangePassword
