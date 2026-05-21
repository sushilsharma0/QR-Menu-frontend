import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTenantRoutes } from '../../hooks/useTenantRoutes'
import { useForm } from 'react-hook-form'
import toast from '@utils/toast'
import api from '../../services/api'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Card from '../../components/common/Card'

const TableForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { restaurantBase } = useTenantRoutes()
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, setValue, formState: { errors } } = useForm()
  const tableTypes = [
    { value: 'regular', label: 'Regular' },
    { value: 'family', label: 'Family' },
    { value: 'couple', label: 'Couple' },
    { value: 'private', label: 'Private' },
    { value: 'outdoor', label: 'Outdoor' },
    { value: 'bar', label: 'Bar' },
    { value: 'other', label: 'Other' }
  ]
  const floors = [
    { value: 'ground', label: 'Ground' },
    { value: 'first', label: 'First' },
    { value: 'second', label: 'Second' },
    { value: 'third', label: 'Third' },
    { value: 'top', label: 'Top / Rooftop' },
    { value: 'other', label: 'Other' }
  ]

  useEffect(() => {
    if (id) fetchTable()
  }, [id])

  const fetchTable = async () => {
    try {
      const res = await api.get(`/restaurant/tables/${id}`)
      const table = res.data.data
      setValue('tableNumber', table.tableNumber)
      setValue('capacity', table.capacity)
      setValue('tableType', table.tableType || 'regular')
      setValue('floor', table.floor || 'ground')
      setValue('area', table.area || '')
      setValue('isActive', table.isActive)
    } catch (error) {
      toast.error('Failed to fetch table')
    }
  }

  const onSubmit = async (data) => {
    try {
      setLoading(true)
      const payload = {
        ...data,
        capacity: Number(data.capacity || 4)
      }
      if (id) {
        await api.put(`/restaurant/tables/${id}`, payload)
        toast.success('Table updated')
      } else {
        await api.post('/restaurant/tables', payload)
        toast.success('Table created with QR code')
      }
      navigate(`${restaurantBase}/tables`)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">{id ? 'Edit' : 'Add'} Table</h1>
        <p className="text-gray-500 mt-1">Create or update table details</p>
      </div>

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            label="Table Number"
            placeholder="Enter table number (e.g., T01, 1, A1)"
            {...register('tableNumber', { required: 'Table number is required' })}
            error={errors.tableNumber?.message}
          />

          <Input
            label="Capacity"
            type="number"
            placeholder="Number of seats"
            {...register('capacity', { required: 'Capacity is required', min: 1 })}
            error={errors.capacity?.message}
          />

          <div>
            <label htmlFor="table-type" className="block text-sm font-medium text-gray-700 mb-1">Table Type</label>
            <select
              id="table-type"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
              {...register('tableType')}
              defaultValue="regular"
            >
              {tableTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="table-floor" className="block text-sm font-medium text-gray-700 mb-1">Floor</label>
            <select
              id="table-floor"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
              {...register('floor')}
              defaultValue="ground"
            >
              {floors.map((floor) => (
                <option key={floor.value} value={floor.value}>
                  {floor.label}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Area / Section (Optional)"
            placeholder="e.g., Window side, Garden, Hall A"
            {...register('area')}
          />

          <label className="flex items-center gap-2">
            <input type="checkbox" {...register('isActive')} className="w-4 h-4" />
            <span className="text-sm text-gray-700">Active (visible to customers)</span>
          </label>

          <div className="flex gap-3 pt-4">
            <Button type="submit" loading={loading}>
              {id ? 'Update' : 'Create'} Table
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate(`${restaurantBase}/tables`)}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

export default TableForm
