import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import api from '../../services/api'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Card from '../../components/common/Card'

const CategoryForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, setValue, formState: { errors } } = useForm()

  useEffect(() => {
    if (id) fetchCategory()
  }, [id])

  const fetchCategory = async () => {
    try {
      const res = await api.get(`/restaurant/menu/categories/${id}`)
      const category = res.data.data
      setValue('name', category.name)
      setValue('description', category.description)
      setValue('sortOrder', category.sortOrder)
    } catch (error) {
      toast.error('Failed to fetch category')
    }
  }

  const onSubmit = async (data) => {
    try {
      setLoading(true)
      if (id) {
        await api.put(`/restaurant/menu/categories/${id}`, data)
        toast.success('Category updated')
      } else {
        await api.post('/restaurant/menu/categories', data)
        toast.success('Category created')
      }
      navigate('/restaurant/menu')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{id ? 'Edit' : 'Add'} Category</h1>
        <p className="text-gray-500 mt-1">Create or update menu category</p>
      </div>

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            label="Category Name"
            placeholder="Enter category name"
            {...register('name', { required: 'Name is required' })}
            error={errors.name?.message}
          />

          <Input
            label="Description"
            placeholder="Enter description (optional)"
            {...register('description')}
            error={errors.description?.message}
          />

          <Input
            label="Sort Order"
            type="number"
            placeholder="0"
            {...register('sortOrder')}
            error={errors.sortOrder?.message}
          />

          <div className="flex gap-3 pt-4">
            <Button type="submit" loading={loading}>
              {id ? 'Update' : 'Create'} Category
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate('/restaurant/menu')}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

export default CategoryForm