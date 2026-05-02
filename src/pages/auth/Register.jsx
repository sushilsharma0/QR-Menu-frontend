import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { FiMail, FiLock, FiUser, FiPhone, FiMapPin } from 'react-icons/fi'
import toast from 'react-hot-toast'
import api from '../../services/api'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'

const Register = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, watch, formState: { errors } } = useForm()
  const password = watch('password')

  const onSubmit = async (data) => {
    try {
      setLoading(true)
      await api.post('/restaurant/auth/register', data)
      toast.success('Registration successful! Please log in.')
      toast(
        'Kindly verify your KYC after login to unlock all features. Your 14-day free trial starts now.',
        { duration: 7500 }
      )
      navigate('/login')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-600">QR Menu SaaS</h1>
          <p className="text-gray-500 mt-2">Register your restaurant</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Restaurant Name"
              icon={FiUser}
              placeholder="Enter restaurant name"
              {...register('name', { required: 'Restaurant name is required' })}
              error={errors.name?.message}
            />

            <Input
              label="Email Address"
              icon={FiMail}
              type="email"
              placeholder="Enter email"
              {...register('email', { required: 'Email is required' })}
              error={errors.email?.message}
            />

            <Input
              label="Phone Number"
              icon={FiPhone}
              placeholder="Enter phone number"
              {...register('phone', { required: 'Phone number is required' })}
              error={errors.phone?.message}
            />

            <Input
              label="Password"
              icon={FiLock}
              type="password"
              placeholder="Create password"
              {...register('password', { 
                required: 'Password is required',
                minLength: { value: 8, message: 'Password must be at least 8 characters' }
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
                validate: value => value === password || 'Passwords do not match'
              })}
              error={errors.confirmPassword?.message}
            />

            <Input
              label="Address"
              icon={FiMapPin}
              placeholder="Enter restaurant address"
              {...register('address', { required: 'Address is required' })}
              error={errors.address?.message}
            />

            <Button type="submit" loading={loading} className="w-full">
              Register Restaurant
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register