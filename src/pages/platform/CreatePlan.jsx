import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import toast from 'react-hot-toast'
import api from '../../services/api'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'

const CreatePlan = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, setValue, control, formState: { errors } } = useForm()
  const { fields, append, remove } = useFieldArray({ control, name: 'features' })

  useEffect(() => {
    if (id) fetchPlan()
    else {
      append({ feature: '' })
    }
  }, [id])

  const fetchPlan = async () => {
    try {
      const res = await api.get(`/platform/subscriptions/plans/${id}`)
      const plan = res.data.data
      setValue('name', plan.name)
      setValue('planType', plan.planType)
      setValue('duration', plan.duration)
      setValue('durationLabel', plan.durationLabel)
      setValue('price', plan.price)
      setValue('limits.maxTables', plan.limits?.maxTables)
      setValue('limits.maxEmployees', plan.limits?.maxEmployees)
      setValue('limits.maxCategories', plan.limits?.maxCategories)
      setValue('limits.maxMenuItems', plan.limits?.maxMenuItems)
      setValue('isPopular', plan.isPopular)
      plan.features?.forEach(f => append({ feature: f }))
    } catch (error) {
      toast.error('Failed to fetch plan')
    }
  }

  const onSubmit = async (data) => {
    try {
      setLoading(true)
      const payload = {
        ...data,
        features: data.features?.map(f => f.feature).filter(Boolean) || [],
      }
      if (id) {
        await api.put(`/platform/subscriptions/plans/${id}`, payload)
        toast.success('Plan updated')
      } else {
        await api.post('/platform/subscriptions/plans', payload)
        toast.success('Plan created')
      }
      navigate('/platform/subscriptions')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{id ? 'Edit' : 'Create'} Subscription Plan</h1>
        <p className="text-gray-500 mt-1">Configure plan details and pricing</p>
      </div>

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            label="Plan Name"
            {...register('name', { required: 'Plan name is required' })}
            error={errors.name?.message}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Plan Type</label>
            <select {...register('planType', { required: 'Plan type is required' })} className="w-full px-4 py-2 border border-gray-300 rounded-lg">
              <option value="">Select Type</option>
              <option value="basic">Basic</option>
              <option value="standard">Standard</option>
              <option value="premium">Premium</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Duration (days)"
              type="number"
              {...register('duration', { required: 'Duration is required', min: 1 })}
              error={errors.duration?.message}
            />
            <Input
              label="Duration Label"
              placeholder="e.g., Monthly, Yearly"
              {...register('durationLabel')}
            />
          </div>

          <Input
            label="Price ($)"
            type="number"
            step="0.01"
            {...register('price', { required: 'Price is required', min: 0 })}
            error={errors.price?.message}
          />

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">Plan Limits</h3>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Max Tables" type="number" {...register('limits.maxTables')} />
              <Input label="Max Employees" type="number" {...register('limits.maxEmployees')} />
              <Input label="Max Categories" type="number" {...register('limits.maxCategories')} />
              <Input label="Max Menu Items" type="number" {...register('limits.maxMenuItems')} />
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">Features</h3>
            {fields.map((field, index) => (
              <div key={field.id} className="flex gap-2 mb-2">
                <Input
                  placeholder="Enter feature"
                  {...register(`features.${index}.feature`)}
                  className="flex-1"
                />
                <button type="button" onClick={() => remove(index)} className="px-3 py-2 text-red-500 hover:text-red-700">Remove</button>
              </div>
            ))}
            <button type="button" onClick={() => append({ feature: '' })} className="text-primary-600 hover:text-primary-700 text-sm">
              + Add Feature
            </button>
          </div>

          <label className="flex items-center gap-2">
            <input type="checkbox" {...register('isPopular')} />
            <span className="text-sm text-gray-700">Mark as Popular</span>
          </label>

          <div className="flex gap-3 pt-4">
            <Button type="submit" loading={loading}>{id ? 'Update' : 'Create'} Plan</Button>
            <Button type="button" variant="secondary" onClick={() => navigate('/platform/subscriptions')}>Cancel</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

export default CreatePlan