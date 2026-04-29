import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import api from '../../services/api'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Card from '../../components/common/Card'

const EmployeeForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, setValue, formState: { errors } } = useForm()

  useEffect(() => {
    if (id) fetchEmployee()
  }, [id])

  const fetchEmployee = async () => {
    try {
      const res = await api.get(`/restaurant/employees/${id}`)
      const emp = res.data.data
      setValue('name', emp.name)
      setValue('email', emp.email)
      setValue('phone', emp.phone)
      setValue('username', emp.username)
      setValue('role', emp.role)
      setValue('isActive', emp.isActive)
    } catch (error) {
      toast.error('Failed to fetch employee')
    }
  }

  const onSubmit = async (data) => {
    try {
      setLoading(true)
      if (id) {
        await api.put(`/restaurant/employees/${id}`, data)
        toast.success('Employee updated')
      } else {
        const res = await api.post('/restaurant/employees', data)
        toast.success(`Employee created. Default password: ${res.data.data.defaultPassword}`)
      }
      navigate('/restaurant/employees')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{id ? 'Edit' : 'Add'} Employee</h1>
        <p className="text-gray-500 mt-1">Create or update employee details</p>
      </div>

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            label="Full Name"
            placeholder="Enter full name"
            {...register('name', { required: 'Name is required' })}
            error={errors.name?.message}
          />

          <Input
            label="Email"
            type="email"
            placeholder="Enter email"
            {...register('email')}
            error={errors.email?.message}
          />

          <Input
            label="Phone"
            placeholder="Enter phone number"
            {...register('phone')}
            error={errors.phone?.message}
          />

          <Input
            label="Username"
            placeholder="Enter username"
            {...register('username', { required: 'Username is required' })}
            error={errors.username?.message}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              {...register('role', { required: 'Role is required' })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select Role</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="kitchen">Kitchen Staff</option>
              <option value="cashier">Cashier</option>
              <option value="waiter">Waiter</option>
            </select>
            {errors.role && <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>}
          </div>

          <label className="flex items-center gap-2">
            <input type="checkbox" {...register('isActive')} className="w-4 h-4" />
            <span className="text-sm text-gray-700">Active</span>
          </label>

          {!id && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                Default password will be set to: <strong>username@123</strong>
              </p>
              <p className="text-xs text-blue-600 mt-1">Employee must change password on first login</p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button type="submit" loading={loading}>
              {id ? 'Update' : 'Create'} Employee
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate('/restaurant/employees')}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

export default EmployeeForm