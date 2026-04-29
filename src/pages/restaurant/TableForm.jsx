import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import api from '../../services/api'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Card from '../../components/common/Card'

const TableForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, setValue, formState: { errors } } = useForm()

  useEffect(() => {
    if (id) fetchTable()
  }, [id])

  const fetchTable = async () => {
    try {
      const res = await api.get(`/restaurant/tables/${id}`)
      const table = res.data.data
      setValue('tableNumber', table.tableNumber)
      setValue('capacity', table.capacity)
      setValue('isActive', table.isActive)
    } catch (error) {
      toast.error('Failed to fetch table')
    }
  }

  const onSubmit = async (data) => {
    try {
      setLoading(true)
      if (id) {
        await api.put(`/restaurant/tables/${id}`, data)
        toast.success('Table updated')
      } else {
        await api.post('/restaurant/tables', data)
        toast.success('Table created with QR code')
      }
      navigate('/restaurant/tables')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{id ? 'Edit' : 'Add'} Table</h1>
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

          <label className="flex items-center gap-2">
            <input type="checkbox" {...register('isActive')} className="w-4 h-4" />
            <span className="text-sm text-gray-700">Active (visible to customers)</span>
          </label>

          <div className="flex gap-3 pt-4">
            <Button type="submit" loading={loading}>
              {id ? 'Update' : 'Create'} Table
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate('/restaurant/tables')}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

export default TableForm