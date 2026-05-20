import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from '@utils/toast'
import api from '../../../services/api'
import Card from '../../common/Card'
import Button from '../../common/Button'
import Input from '../../common/Input'
import { FiLock } from 'react-icons/fi'

export default function PlatformPasswordSection() {
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  const onSubmit = async (data) => {
    try {
      setLoading(true)
      await api.post('/platform/auth/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      })
      toast.success('Password changed successfully')
      reset()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card title="Change password" icon={FiLock}>
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-md space-y-4">
        <Input
          label="Current password"
          type="password"
          autoComplete="current-password"
          {...register('currentPassword', { required: 'Required' })}
          error={errors.currentPassword?.message}
        />
        <Input
          label="New password"
          type="password"
          autoComplete="new-password"
          {...register('newPassword', { required: 'Required', minLength: { value: 8, message: 'At least 8 characters' } })}
          error={errors.newPassword?.message}
        />
        <Input
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          {...register('confirmPassword', {
            required: 'Confirm your password',
            validate: (value, formValues) => value === formValues.newPassword || 'Passwords do not match',
          })}
          error={errors.confirmPassword?.message}
        />
        <Button type="submit" loading={loading}>
          Update password
        </Button>
      </form>
    </Card>
  )
}
