import React, { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTenantRoutes } from '../../hooks/useTenantRoutes'
import { useForm } from 'react-hook-form'
import toast from '@utils/toast'
import api from '../../services/api'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Card from '../../components/common/Card'

const IMAGE_MAX_BYTES = 1 * 1024 * 1024

const EmployeeForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { restaurantBase } = useTenantRoutes()
  const [loading, setLoading] = useState(false)
  const [photoPreview, setPhotoPreview] = useState('')
  const photoFileRef = useRef(null)
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
      setValue('department', emp.department || '')
      setValue('designation', emp.designation || '')
      setValue('joiningDate', emp.joiningDate ? emp.joiningDate.slice(0, 10) : '')
      setValue('panNumber', emp.panNumber || '')
      setValue('bankName', emp.bankName || '')
      setValue('bankAccountNumber', emp.bankAccountNumber || '')
      setValue('bankBranch', emp.bankBranch || '')
      setValue('salary', emp.salary ?? '')
      setValue('allowance', emp.allowance ?? '')
      setValue('customTdsPercent', emp.customTdsPercent ?? '')
      setValue('customEpfPercent', emp.customEpfPercent ?? '')
      setValue('customEmployerEpfPercent', emp.customEmployerEpfPercent ?? '')
      setPhotoPreview(emp.profileImage || '')
    } catch (error) {
      toast.error('Failed to fetch employee')
    }
  }

  const onPhotoChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (file.size > IMAGE_MAX_BYTES) {
      toast.error('Employee photo must be less than 1 MB')
      event.target.value = ''
      photoFileRef.current = null
      return
    }
    photoFileRef.current = file
    setPhotoPreview(URL.createObjectURL(file))
  }

  const onSubmit = async (data) => {
    try {
      setLoading(true)
      const formData = new FormData()
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) formData.append(key, value)
      })
      if (photoFileRef.current) formData.append('employeePhoto', photoFileRef.current)

      const config = { headers: { 'Content-Type': 'multipart/form-data' } }
      if (id) {
        await api.put(`/restaurant/employees/${id}`, formData, config)
        toast.success('Employee updated')
      } else {
        const res = await api.post('/restaurant/employees', formData, config)
        const { credentialsEmailSent, defaultPassword } = res.data.data || {}
        if (credentialsEmailSent) {
          toast.success('Employee created. Login details were sent by email.')
        } else if (defaultPassword) {
          toast.success(`Employee created. Email not sent - share default password: ${defaultPassword}`)
        } else {
          toast.success('Employee created.')
        }
      }
      navigate(`${restaurantBase}/employees`)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">{id ? 'Edit' : 'Add'} Employee</h1>
        <p className="mt-1 text-gray-500">Create a polished staff profile for the restaurant team.</p>
      </div>

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="flex flex-col gap-4 rounded-2xl bg-surface-50 p-4 sm:flex-row sm:items-center">
            <div className="h-24 w-24 overflow-hidden rounded-3xl border-4 border-white bg-primary-50 shadow-sm">
              {photoPreview ? (
                <img src={photoPreview} alt="Employee preview" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-3xl font-semibold text-primary-600">
                  ?
                </div>
              )}
            </div>
            <div className="flex-1">
              <label htmlFor="employee-photo" className="block text-sm font-medium text-gray-700">Employee Photo</label>
              <p className="mb-2 text-xs text-gray-500">Shown in restaurant employee cards. Square 4x4 style, recommended 512x512 px. Max 1 MB.</p>
              <input
                id="employee-photo"
                type="file"
                accept="image/*"
                onChange={onPhotoChange}
                className="w-full rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm"
              />
            </div>
          </div>

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
            {...register('email', { required: 'Email is required for login credentials' })}
            error={errors.email?.message}
          />

          <Input label="Phone" placeholder="Enter phone number" {...register('phone')} error={errors.phone?.message} />

          <Input
            label="Username"
            placeholder="Enter username"
            {...register('username', { required: 'Username is required' })}
            error={errors.username?.message}
            disabled={Boolean(id)}
          />

          <div>
            <label htmlFor="employee-role" className="mb-1 block text-sm font-medium text-gray-700">Role</label>
            <select
              id="employee-role"
              {...register('role', { required: 'Role is required' })}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select Role</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="kitchen">Kitchen Staff</option>
              <option value="cashier">Cashier</option>
              <option value="waiter">Waiter</option>
              <option value="accountant">Accountant</option>
            </select>
            {errors.role && <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>}
          </div>

          <div className="rounded-2xl border border-surface-200 bg-surface-50 p-4 dark:border-gray-700 dark:bg-gray-900/40">
            <p className="mb-3 text-sm font-semibold text-gray-800 dark:text-gray-200">Payroll, TDS & EPF</p>
            <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
              Monthly salary and allowance are used on each payroll run. TDS and employee EPF are deducted from pay. Employer EPF is an extra company cost on the same basic. Leave custom % blank to use the restaurant defaults on the Payroll page.
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input label="Department" {...register('department')} />
              <Input label="Designation" {...register('designation')} />
              <Input label="Joining date" type="date" {...register('joiningDate')} />
              <Input label="PAN number" {...register('panNumber')} />
              <Input label="Bank name" {...register('bankName')} />
              <Input label="Bank account no." {...register('bankAccountNumber')} />
              <Input label="Bank branch" {...register('bankBranch')} />
              <Input label="Monthly salary (basic)" type="number" step="0.01" {...register('salary')} />
              <Input label="Monthly allowance" type="number" step="0.01" {...register('allowance')} />
              <Input
                label="Custom TDS % (optional)"
                type="number"
                step="0.01"
                {...register('customTdsPercent')}
              />
              <Input
                label="Employee EPF % on monthly basic (optional)"
                type="number"
                step="0.01"
                {...register('customEpfPercent')}
              />
              <Input
                label="Employer EPF % on monthly basic (optional)"
                type="number"
                step="0.01"
                {...register('customEmployerEpfPercent')}
              />
            </div>
          </div>

          <label className="flex items-center gap-2">
            <input type="checkbox" {...register('isActive')} className="h-4 w-4" />
            <span className="text-sm text-gray-700">Active employee</span>
          </label>

          {!id && (
            <div className="rounded-2xl bg-blue-50 p-4">
              <p className="text-sm text-blue-800">
                Default password will be set to: <strong>username@123</strong>
              </p>
              <p className="mt-1 text-xs text-blue-600">Employee must change password on first login.</p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button type="submit" loading={loading}>
              {id ? 'Update' : 'Create'} Employee
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate(`${restaurantBase}/employees`)}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

export default EmployeeForm
